import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { productionKeys } from "@/hooks/useProductions";
import type { JobPost, Production, ProductionCompany, Profile } from "@/types/models";

// ── Query keys ────────────────────────────────────────────

export const jobKeys = {
  all: ["jobs"] as const,
  list: (filters?: Record<string, string>) =>
    [...jobKeys.all, "list", filters ?? {}] as const,
  detail: (id: string) => [...jobKeys.all, "detail", id] as const,
};

// ── Types ─────────────────────────────────────────────────

export type JobWithContext = JobPost & {
  production: Pick<Production, "id" | "title" | "slug" | "status" | "is_published"> | null;
  company: Pick<ProductionCompany, "id" | "name" | "slug" | "logo_url"> | null;
  poster: Pick<Profile, "id" | "display_name" | "username" | "profile_image_url"> | null;
  /** Current user's role in the parent company (null if not a member or not authenticated) */
  companyRole: "owner" | "admin" | "member" | null;
};

/** Whether a job should be treated as effectively closed based on its production's status. */
export function isJobEffectivelyClosed(job: JobWithContext): boolean {
  if (!job.is_active) return true;
  if (job.production) {
    const status = job.production.status;
    if (status === "wrapped" || status === "cancelled") return true;
  }
  return false;
}

export type JobListFilters = {
  search?: string;
  category?: string;
  type?: string;
  experience_level?: string;
  is_remote?: boolean;
};

export type JobListResult = {
  jobs: JobWithContext[];
  count: number;
};

export const JOB_PAGE_SIZE = 12;

// ── Fetchers ──────────────────────────────────────────────

async function fetchJobDetail(jobId: string, userId: string | undefined): Promise<JobWithContext> {
  const { data, error } = await supabase
    .from("job_posts")
    .select(
      `
      *,
      production:productions!job_posts_production_id_fkey (
        id, title, slug, status, is_published
      ),
      poster:profiles!job_posts_posted_by_fkey (
        id, display_name, username, profile_image_url
      )
    `
    )
    .eq("id", jobId)
    .single();

  if (error) {
    if (error.code === "PGRST116") throw new Error("Job not found");
    throw new Error(error.message);
  }

  // Get the company via production if available
  let company: JobWithContext["company"] = null;
  const production = data.production as JobWithContext["production"];

  if (production) {
    const { data: prod } = await supabase
      .from("productions")
      .select(
        `
        company:production_companies!inner (
          id, name, slug, logo_url
        )
      `
      )
      .eq("id", production.id)
      .single();

    if (prod?.company) {
      company = prod.company as JobWithContext["company"];
    }
  }

  // Determine the current user's role in the parent company
  let companyRole: JobWithContext["companyRole"] = null;
  if (userId && company) {
    const { data: membership } = await supabase
      .from("production_company_members")
      .select("role")
      .eq("company_id", company.id)
      .eq("user_id", userId)
      .maybeSingle();

    companyRole = (membership?.role as JobWithContext["companyRole"]) ?? null;
  }

  return {
    ...data,
    production,
    company,
    companyRole,
    poster: data.poster as JobWithContext["poster"],
  } as JobWithContext;
}

async function fetchJobList(
  filters: JobListFilters,
  page: number = 0,
): Promise<JobListResult> {
  const from = page * JOB_PAGE_SIZE;
  const to = from + JOB_PAGE_SIZE - 1;

  let query = supabase
    .from("job_posts")
    .select(
      `
      *,
      production:productions!job_posts_production_id_fkey (
        id, title, slug, status, is_published,
        company:production_companies!inner (
          id, name, slug, logo_url
        )
      ),
      poster:profiles!job_posts_posted_by_fkey (
        id, display_name, username, profile_image_url
      )
    `,
      { count: "exact" },
    )
    .eq("is_active", true)
    .eq("is_flagged", false)
    .order("created_at", { ascending: false });

  if (filters.search) {
    query = query.ilike("title", `%${filters.search}%`);
  }
  if (filters.category) {
    query = query.eq("category", filters.category);
  }
  if (filters.type) {
    query = query.eq("type", filters.type);
  }
  if (filters.experience_level) {
    query = query.eq("experience_level", filters.experience_level);
  }
  if (filters.is_remote) {
    query = query.eq("is_remote", true);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  // Filter client-side: only show jobs where the production is published
  // AND the production is not wrapped/cancelled.
  // Note: We can't easily paginate after client-side filtering, so we fetch
  // more than needed and slice. For production use, move this to a DB view.
  const filtered = (data ?? [])
    .filter((row) => {
      const prod = row.production as any;
      // Allow legacy jobs without production_id through
      if (!prod) return true;
      // Must be published and in an active status
      if (!prod.is_published) return false;
      if (prod.status === "wrapped" || prod.status === "cancelled") return false;
      return true;
    })
    .map((row) => {
      const prod = row.production as any;
      const company = prod?.company ?? null;
      return {
        ...row,
        production: prod
          ? { id: prod.id, title: prod.title, slug: prod.slug, status: prod.status, is_published: prod.is_published }
          : null,
        company: company
          ? { id: company.id, name: company.name, slug: company.slug, logo_url: company.logo_url }
          : null,
        poster: row.poster as JobWithContext["poster"],
        companyRole: null,
      } as JobWithContext;
    });

  // Client-side pagination from the filtered set
  const paged = filtered.slice(from, to + 1);

  return {
    jobs: paged,
    count: filtered.length,
  };
}

// ── Hooks ─────────────────────────────────────────────────

export function useJobDetail(jobId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: jobKeys.detail(jobId ?? ""),
    queryFn: () => fetchJobDetail(jobId!, user?.id),
    enabled: !!jobId,
  });
}

export function useJobList(filters: JobListFilters = {}, page: number = 0) {
  return useQuery({
    queryKey: jobKeys.list({
      ...Object.fromEntries(
        Object.entries(filters).map(([k, v]) => [k, String(v ?? "")]),
      ),
      page: String(page),
    }),
    queryFn: () => fetchJobList(filters, page),
  });
}

// ── Create job mutation ───────────────────────────────────

type CreateJobInput = {
  productionId: string;
  productionSlug: string;
  title: string;
  description: string;
  category?: string;
  type?: string;
  experience_level?: string;
  location?: string;
  is_remote?: boolean;
  compensation?: string;
  deadline?: string;
};

export function useCreateJob() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateJobInput) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("job_posts")
        .insert({
          posted_by: user.id,
          production_id: input.productionId,
          title: input.title,
          description: input.description,
          category: input.category || null,
          type: input.type || null,
          experience_level: input.experience_level || null,
          location: input.location || null,
          is_remote: input.is_remote ?? false,
          compensation: input.compensation || null,
          deadline: input.deadline || null,
        })
        .select()
        .single();

      if (error) {
        if (error.message.includes("Cannot post jobs on a")) {
          throw new Error(
            "This production is wrapped or cancelled. Jobs can't be posted on inactive productions."
          );
        }
        if (error.message.includes("Job limit reached")) {
          throw new Error(
            "You've reached the job limit for this production. Upgrade your tier to post more."
          );
        }
        throw new Error(error.message);
      }

      return {
        job: data as JobPost,
        productionSlug: input.productionSlug,
      };
    },
    onSuccess: ({ job, productionSlug }) => {
      queryClient.invalidateQueries({
        queryKey: productionKeys.detail(productionSlug),
      });
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
      toast.success("Job posted", {
        description: `"${job.title}" is now live.`,
      });
      navigate(`/jobs/${job.id}`);
    },
    onError: (error: Error) => {
      toast.error("Failed to post job", { description: error.message });
    },
  });
}