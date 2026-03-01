import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import type { ProductionCompany, Production, CompanyRole } from "@/types/models";

// ── Types ─────────────────────────────────────────────────

export type PublicMember = {
  role: CompanyRole;
  profile: {
    id: string;
    display_name: string | null;
    username: string;
    profile_image_url: string | null;
    position: string | null;
  };
};

export type PublicProductionWithJobs = Production & {
  jobs: Array<{
    id: string;
    title: string;
    type: string | null;
    category: string | null;
    location: string | null;
    is_remote: boolean;
    created_at: string;
  }>;
};

export type CompanyProfileData = {
  company: ProductionCompany;
  productions: PublicProductionWithJobs[];
  members: PublicMember[];
  /** Current user's role, or null if not a member / not logged in */
  currentUserRole: CompanyRole | null;
};

// ── Fetcher ───────────────────────────────────────────────

async function fetchCompanyProfile(
  slug: string,
  userId: string | undefined
): Promise<CompanyProfileData> {
  // 1. Fetch the company
  const { data: company, error: companyErr } = await supabase
    .from("production_companies")
    .select("*")
    .eq("slug", slug)
    .is("deleted_at", null)
    .single();

  if (companyErr) {
    if (companyErr.code === "PGRST116") throw new Error("Company not found");
    throw new Error(companyErr.message);
  }

  // 2. Fetch published, active productions with their active job posts.
  //    We use a single joined query then filter jobs client-side (cleaner
  //    than relying on PostgREST embedded filters which don't support eq on
  //    embedded resource columns reliably across all Supabase versions).
  const { data: productionRows, error: prodsErr } = await supabase
    .from("productions")
    .select(
      `
      *,
      jobs:job_posts!job_posts_production_id_fkey (
        id, title, type, category, location, is_remote, is_active, created_at
      )
    `
    )
    .eq("company_id", company.id)
    .eq("is_published", true)
    .is("deleted_at", null)
    .not("status", "in", "(wrapped,cancelled)")
    .order("created_at", { ascending: false });

  if (prodsErr) throw new Error(prodsErr.message);

  const productions: PublicProductionWithJobs[] = (productionRows ?? []).map(
    (row) => {
      const allJobs = (row.jobs ?? []) as Array<{
        id: string;
        title: string;
        type: string | null;
        category: string | null;
        location: string | null;
        is_remote: boolean;
        is_active: boolean;
        created_at: string;
      }>;
      const { jobs: _jobs, ...prod } = row as any;
      return {
        ...(prod as Production),
        jobs: allJobs
          .filter((j) => j.is_active)
          .map(({ is_active: _ia, ...j }) => j),
      };
    }
  );

  // 3. Fetch members with profiles
  const { data: memberRows, error: membersErr } = await supabase
    .from("production_company_members")
    .select(
      `
      role,
      profile:profiles!inner (
        id, display_name, username, profile_image_url, position
      )
    `
    )
    .eq("company_id", company.id);

  if (membersErr) throw new Error(membersErr.message);

  const members = (memberRows ?? []).map((m) => ({
    role: m.role as CompanyRole,
    profile: m.profile as PublicMember["profile"],
  }));

  // 4. Resolve current user's role (null if not logged in or not a member)
  const currentUserRole: CompanyRole | null = userId
    ? (members.find((m) => m.profile.id === userId)?.role ?? null)
    : null;

  return {
    company: company as ProductionCompany,
    productions,
    members,
    currentUserRole,
  };
}

// ── Hook ──────────────────────────────────────────────────

const profileKeys = {
  publicProfile: (slug: string, userId: string | undefined) =>
    ["companyProfile", slug, userId ?? "anonymous"] as const,
};

export function useCompanyProfile(slug: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: profileKeys.publicProfile(slug ?? "", user?.id),
    queryFn: () => fetchCompanyProfile(slug!, user?.id),
    enabled: !!slug,
  });
}