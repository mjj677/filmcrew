import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { companyKeys } from "@/hooks/useCompanies";
import type {
  Production,
  ProductionInsert,
  ProductionStatus,
} from "@/types/models";

// ── Query keys ────────────────────────────────────────────

export const productionKeys = {
  all: ["productions"] as const,
  detail: (slug: string) => [...productionKeys.all, "detail", slug] as const,
};

// ── Slug helpers ──────────────────────────────────────────

export function generateProductionSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function checkProductionSlugAvailability(
  slug: string
): Promise<boolean> {
  const { data: isValid, error: validateErr } = await supabase.rpc(
    "validate_slug",
    { input_slug: slug }
  );

  if (validateErr || !isValid) return false;

  const { data, error } = await supabase
    .from("productions")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (error) return false;

  return data === null;
}

// ── Create mutation ───────────────────────────────────────

type CreateProductionInput = {
  companyId: string;
  companySlug: string; // for navigation after creation
  title: string;
  slug: string;
  description?: string;
  production_type?: Production["production_type"];
  start_date?: string;
  end_date?: string;
  location?: string;
  country?: string;
  budget_range?: Production["budget_range"];
};

export function useCreateProduction() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProductionInput) => {
      if (!user?.id) throw new Error("Not authenticated");

      const row: ProductionInsert = {
        company_id: input.companyId,
        title: input.title,
        slug: input.slug,
        description: input.description || null,
        production_type: input.production_type || null,
        start_date: input.start_date || null,
        end_date: input.end_date || null,
        location: input.location || null,
        country: input.country || null,
        budget_range: input.budget_range || null,
        created_by: user.id,
      };

      const { data, error } = await supabase
        .from("productions")
        .insert(row)
        .select()
        .single();

      if (error) {
        // Tier limit exceeded (raised by trigger)
        if (
          error.code === "23514" ||
          error.message.includes("Production limit reached")
        ) {
          throw new Error(
            "You've reached the production limit for your current tier. Upgrade to create more."
          );
        }
        if (error.code === "23505" && error.message.includes("slug")) {
          throw new Error("This URL slug is already taken.");
        }
        if (error.code === "23514" && error.message.includes("valid_production_slug")) {
          throw new Error(
            "Invalid slug format. Use lowercase letters, numbers, and hyphens (2–60 characters)."
          );
        }
        throw new Error(error.message);
      }

      return { production: data as Production, companySlug: input.companySlug };
    },
    onSuccess: ({ production, companySlug }) => {
      // Invalidate company detail so the dashboard picks up the new production
      queryClient.invalidateQueries({
        queryKey: companyKeys.detail(companySlug),
      });

      toast.success("Production created", {
        description: `${production.title} is ready. Add job listings next.`,
      });

      navigate(`/companies/${companySlug}/dashboard`);
    },
    onError: (error: Error) => {
      toast.error("Failed to create production", {
        description: error.message,
      });
    },
  });
}

// ── Update mutation ───────────────────────────────────────

type UpdateProductionInput = {
  productionId: string;
  productionSlug: string;
  companySlug: string;
  title?: string;
  description?: string | null;
  production_type?: Production["production_type"] | null;
  start_date?: string | null;
  end_date?: string | null;
  location?: string | null;
  country?: string | null;
  budget_range?: Production["budget_range"] | null;
};

export function useUpdateProduction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productionId,
      productionSlug,
      companySlug,
      ...fields
    }: UpdateProductionInput) => {
      const { data, error } = await supabase
        .from("productions")
        .update(fields)
        .eq("id", productionId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return {
        production: data as Production,
        productionSlug,
        companySlug,
      };
    },
    onSuccess: ({ productionSlug, companySlug }) => {
      queryClient.invalidateQueries({
        queryKey: productionKeys.detail(productionSlug),
      });
      queryClient.invalidateQueries({
        queryKey: companyKeys.detail(companySlug),
      });
      toast.success("Production updated");
    },
    onError: (error: Error) => {
      toast.error("Failed to update production", {
        description: error.message,
      });
    },
  });
}

// ── Publish / unpublish toggle ────────────────────────────

export function useTogglePublish() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productionId,
      productionSlug,
      companySlug,
      publish,
    }: {
      productionId: string;
      productionSlug: string;
      companySlug: string;
      publish: boolean;
    }) => {
      const { data, error } = await supabase
        .from("productions")
        .update({ is_published: publish })
        .eq("id", productionId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return {
        production: data as Production,
        productionSlug,
        companySlug,
      };
    },
    onSuccess: ({ production, productionSlug, companySlug }) => {
      queryClient.invalidateQueries({
        queryKey: productionKeys.detail(productionSlug),
      });
      queryClient.invalidateQueries({
        queryKey: companyKeys.detail(companySlug),
      });
      // Invalidate all job queries — publish state affects job visibility
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success(
        production.is_published
          ? "Production published"
          : "Production unpublished",
        {
          description: production.is_published
            ? "This production is now visible to everyone."
            : "This production is now hidden from the public.",
        }
      );
    },
    onError: (error: Error) => {
      toast.error("Failed to update publish status", {
        description: error.message,
      });
    },
  });
}

// ── Change production status ──────────────────────────────

export function useChangeProductionStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productionId,
      productionSlug,
      companySlug,
      status,
    }: {
      productionId: string;
      productionSlug: string;
      companySlug: string;
      status: ProductionStatus;
    }) => {
      const { data, error } = await supabase
        .from("productions")
        .update({ status })
        .eq("id", productionId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return {
        production: data as Production,
        productionSlug,
        companySlug,
      };
    },
    onSuccess: ({ productionSlug, companySlug }) => {
      queryClient.invalidateQueries({
        queryKey: productionKeys.detail(productionSlug),
      });
      queryClient.invalidateQueries({
        queryKey: companyKeys.detail(companySlug),
      });
      // Invalidate all job queries — production status affects job visibility
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Production status updated");
    },
    onError: (error: Error) => {
      toast.error("Failed to update status", {
        description: error.message,
      });
    },
  });
}