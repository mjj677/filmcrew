import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { productionKeys } from "@/hooks/useProductions";
import type {
  Production,
  ProductionCompany,
  JobPost,
  CompanyRole,
} from "@/types/models";

// ── Types ─────────────────────────────────────────────────

export type ProductionDetail = {
  production: Production;
  company: Pick<
    ProductionCompany,
    "id" | "name" | "slug" | "logo_url" | "city" | "country"
  >;
  /** Active (is_active = true) job listings — visible to everyone */
  activeJobs: JobPost[];
  /** Inactive (is_active = false) job listings — only returned for company admins/owners via RLS */
  inactiveJobs: JobPost[];
  /** Current user's role in the parent company, null if not a member */
  role: CompanyRole | null;
};

// ── Fetcher ───────────────────────────────────────────────

async function fetchProductionBySlug(
  slug: string,
  userId: string | undefined,
): Promise<ProductionDetail> {
  // 1. Fetch production with parent company info
  const { data: production, error: prodErr } = await supabase
    .from("productions")
    .select(
      `
      *,
      company:production_companies!inner (
        id,
        name,
        slug,
        logo_url,
        city,
        country
      )
    `,
    )
    .eq("slug", slug)
    .is("deleted_at", null)
    .single();

  if (prodErr) {
    if (prodErr.code === "PGRST116") throw new Error("Production not found");
    throw new Error(prodErr.message);
  }

  const company = production.company as ProductionDetail["company"];

  // 2. Fetch ALL job listings for this production — no is_active filter.
  //    RLS enforces what the caller can see:
  //    - Public / non-members: only is_active = true rows (existing public policy)
  //    - Company admins/owners: all rows (new admin policy)
  const { data: jobs, error: jobsErr } = await supabase
    .from("job_posts")
    .select("*")
    .eq("production_id", production.id)
    .order("created_at", { ascending: false });

  if (jobsErr) throw new Error(jobsErr.message);

  const allJobs = (jobs ?? []) as JobPost[];

  // 3. Determine current user's role (if authenticated)
  let role: CompanyRole | null = null;

  if (userId) {
    const { data: membership } = await supabase
      .from("production_company_members")
      .select("role")
      .eq("company_id", company.id)
      .eq("user_id", userId)
      .maybeSingle();

    role = (membership?.role as CompanyRole) ?? null;
  }

  // Strip the nested company from the production row to keep types clean
  const { company: _, ...prodData } = production;

  return {
    production: prodData as Production,
    company,
    activeJobs: allJobs.filter((j) => j.is_active),
    inactiveJobs: allJobs.filter((j) => !j.is_active),
    role,
  };
}

// ── Hook ──────────────────────────────────────────────────

/**
 * Fetches a production by slug, including its parent company, all job
 * listings split into activeJobs / inactiveJobs, and the current user's
 * role in the company.
 *
 * Inactive jobs are only returned for company admins/owners — RLS silently
 * excludes them for public/non-member callers, so the split is safe.
 */
export function useProductionDetail(slug: string | undefined) {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: productionKeys.detail(slug ?? ""),
    queryFn: () => fetchProductionBySlug(slug!, user?.id),
    enabled: !!slug,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
  };
}