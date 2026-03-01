import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { companyKeys } from "@/hooks/useCompanies";
import type {
  ProductionCompany,
  CompanyRole,
  Production,
  Profile,
} from "@/types/models";

// ── Types ─────────────────────────────────────────────────

export type CompanyMemberWithProfile = {
  id: string;
  role: CompanyRole;
  created_at: string;
  profile: Pick<
    Profile,
    "id" | "display_name" | "username" | "profile_image_url" | "position"
  >;
};

export type CompanyDetail = {
  company: ProductionCompany;
  role: CompanyRole | null; // null = not a member (shouldn't happen on dashboard)
  members: CompanyMemberWithProfile[];
  productions: Production[];
};

// ── Fetcher ───────────────────────────────────────────────

async function fetchCompanyBySlug(
  slug: string,
  userId: string | undefined
): Promise<CompanyDetail> {
  // 1. Fetch the company
  const { data: company, error: companyErr } = await supabase
    .from("production_companies")
    .select("*")
    .eq("slug", slug)
    .is("deleted_at", null)
    .single();

  if (companyErr) {
    if (companyErr.code === "PGRST116") {
      throw new Error("Company not found");
    }
    throw new Error(companyErr.message);
  }

  // 2. Fetch members with their profile data
  const { data: members, error: membersErr } = await supabase
    .from("production_company_members")
    .select(
      `
      id,
      role,
      created_at,
      profile:profiles!inner (
        id,
        display_name,
        username,
        profile_image_url,
        position
      )
    `
    )
    .eq("company_id", company.id);

  if (membersErr) throw new Error(membersErr.message);

  // 3. Fetch productions (non-deleted)
  const { data: productions, error: prodsErr } = await supabase
    .from("productions")
    .select("*")
    .eq("company_id", company.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (prodsErr) throw new Error(prodsErr.message);

  // 4. Determine the current user's role
  const currentMember = userId
    ? (members ?? []).find(
        (m) => (m.profile as CompanyMemberWithProfile["profile"]).id === userId
      )
    : undefined;

  return {
    company: company as ProductionCompany,
    role: (currentMember?.role as CompanyRole) ?? null,
    members: (members ?? []).map((m) => ({
      id: m.id,
      role: m.role as CompanyRole,
      created_at: m.created_at,
      profile: m.profile as CompanyMemberWithProfile["profile"],
    })),
    productions: (productions ?? []) as Production[],
  };
}

// ── Hook ──────────────────────────────────────────────────

/**
 * Fetches a production company by slug, including members (with profiles)
 * and productions. Also resolves the current user's role in the company.
 */
export function useCompanyDetail(slug: string | undefined) {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: companyKeys.detail(slug ?? ""),
    queryFn: () => fetchCompanyBySlug(slug!, user?.id),
    enabled: !!slug,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
  };
}