import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import type {
  ProductionCompany,
  CompanyRole,
  ProductionCompanyInsert,
} from "@/types/models";

// ── Query keys ────────────────────────────────────────────

export const companyKeys = {
  all: ["companies"] as const,
  userCompanies: (userId: string) =>
    [...companyKeys.all, "user", userId] as const,
  detail: (slug: string) => [...companyKeys.all, "detail", slug] as const,
  members: (companyId: string) =>
    [...companyKeys.all, "members", companyId] as const,
};

// ── Types ─────────────────────────────────────────────────

/** A company the current user belongs to, with their role attached. */
export type UserCompany = ProductionCompany & {
  role: CompanyRole;
};

// ── Fetchers ──────────────────────────────────────────────

async function fetchUserCompanies(userId: string): Promise<UserCompany[]> {
  // Join through production_company_members to get the user's role
  // alongside company data. Only returns non-deleted companies.
  const { data, error } = await supabase
    .from("production_company_members")
    .select(
      `
      role,
      company:production_companies!inner (*)
    `
    )
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  // Flatten the nested shape into UserCompany objects
  return (data ?? [])
    .filter(
      (row): row is typeof row & { company: ProductionCompany } =>
        row.company !== null &&
        // Type-safe soft delete filter — Supabase returns the full row
        (row.company as ProductionCompany).deleted_at === null
    )
    .map((row) => ({
      ...(row.company as ProductionCompany),
      role: row.role,
    }));
}

// ── Hooks ─────────────────────────────────────────────────

/**
 * Fetches all production companies the current user belongs to,
 * including their role in each. Used by the UserMenu context switcher.
 */
export function useUserCompanies() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: companyKeys.userCompanies(user?.id ?? ""),
    queryFn: () => fetchUserCompanies(user!.id),
    enabled: !!user?.id,
  });

  return {
    companies: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}

/**
 * Generates a URL-friendly slug from a company name.
 * e.g. "Lilla Marie Films AB" → "lilla-marie-films-ab"
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // strip non-alphanumeric (except spaces/hyphens)
    .replace(/\s+/g, "-") // spaces → hyphens
    .replace(/-+/g, "-") // collapse multiple hyphens
    .replace(/^-|-$/g, ""); // trim leading/trailing hyphens
}

/**
 * Checks whether a slug is available (not taken, not reserved).
 * Returns true if available, false if taken.
 */
export async function checkSlugAvailability(
  slug: string
): Promise<boolean> {
  // First check the validate_slug function (handles format + reserved words)
  const { data: isValid, error: validateError } = await supabase.rpc(
    "validate_slug",
    { input_slug: slug }
  );

  if (validateError || !isValid) return false;

  // Then check if any existing company already uses it
  const { data, error } = await supabase
    .from("production_companies")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (error) return false;

  return data === null; // null means no existing company has this slug
}

// ── Update mutation ────────────────────────────────────────

type UpdateCompanyInput = {
  companyId: string;
  slug: string; // for cache invalidation
  name?: string;
  description?: string | null;
  city?: string | null;
  country?: string | null;
  website_url?: string | null;
  logo_url?: string | null;
};

export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId, slug, ...fields }: UpdateCompanyInput) => {
      const { data, error } = await supabase
        .from("production_companies")
        .update(fields)
        .eq("id", companyId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return { company: data as ProductionCompany, slug };
    },
    onSuccess: ({ slug }) => {
      queryClient.invalidateQueries({ queryKey: companyKeys.detail(slug) });
      toast.success("Company updated");
    },
    onError: (error: Error) => {
      toast.error("Failed to update company", { description: error.message });
    },
  });
}

// ── Member mutations ──────────────────────────────────────

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      role,
      companySlug,
    }: {
      memberId: string;
      role: CompanyRole;
      companySlug: string;
    }) => {
      const { error } = await supabase
        .from("production_company_members")
        .update({ role })
        .eq("id", memberId);

      if (error) throw new Error(error.message);
      return { companySlug };
    },
    onSuccess: ({ companySlug }) => {
      queryClient.invalidateQueries({ queryKey: companyKeys.detail(companySlug) });
      toast.success("Role updated");
    },
    onError: (error: Error) => {
      toast.error("Failed to update role", { description: error.message });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      companySlug,
    }: {
      memberId: string;
      companySlug: string;
    }) => {
      const { error } = await supabase
        .from("production_company_members")
        .delete()
        .eq("id", memberId);

      if (error) throw new Error(error.message);
      return { companySlug };
    },
    onSuccess: ({ companySlug }) => {
      queryClient.invalidateQueries({ queryKey: companyKeys.detail(companySlug) });
      toast.success("Member removed");
    },
    onError: (error: Error) => {
      toast.error("Failed to remove member", { description: error.message });
    },
  });
}

// ── Create mutation ───────────────────────────────────────

type CreateCompanyInput = {
  name: string;
  slug: string;
  description?: string;
  city?: string;
  country?: string;
  website_url?: string;
};

/**
 * Creates a new production company. The database trigger automatically
 * creates an owner membership for the current user.
 */
export function useCreateCompany() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCompanyInput) => {
      if (!user?.id) throw new Error("Not authenticated");

      const row: ProductionCompanyInsert = {
        name: input.name,
        slug: input.slug,
        description: input.description || null,
        city: input.city || null,
        country: input.country || null,
        website_url: input.website_url || null,
        owner_id: user.id,
      };

      const { data, error } = await supabase
        .from("production_companies")
        .insert(row)
        .select()
        .single();

      if (error) {
        // Handle unique constraint violation on slug
        if (error.code === "23505" && error.message.includes("slug")) {
          throw new Error("This URL slug is already taken. Please choose another.");
        }
        // Handle slug validation check constraint
        if (error.code === "23514" && error.message.includes("valid_company_slug")) {
          throw new Error(
            "Invalid slug format. Use only lowercase letters, numbers, and hyphens (2–60 characters)."
          );
        }
        throw new Error(error.message);
      }

      return data as ProductionCompany;
    },
    onSuccess: (company) => {
      // Invalidate user companies so the context switcher picks it up
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: companyKeys.userCompanies(user.id),
        });
      }

      toast.success("Company created", {
        description: `${company.name} is ready to go.`,
      });

      // Navigate to the new company's dashboard
      navigate(`/companies/${company.slug}/dashboard`);
    },
    onError: (error: Error) => {
      toast.error("Failed to create company", {
        description: error.message,
      });
    },
  });
}