import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import type { JobApplication, Profile } from "@/types/models";

// ── Query keys ────────────────────────────────────────────

export const applicationKeys = {
  all: ["job-applications"] as const,
  forJob: (jobId: string) =>
    [...applicationKeys.all, "job", jobId] as const,
  myApplication: (jobId: string, userId: string) =>
    [...applicationKeys.all, "mine", jobId, userId] as const,
  myAll: (userId: string) =>
    [...applicationKeys.all, "my-all", userId] as const,
  counts: (jobIds: string[]) =>
    [...applicationKeys.all, "counts", ...jobIds.sort()] as const,
};

// ── Types ─────────────────────────────────────────────────

export type ApplicationWithApplicant = JobApplication & {
  applicant: Pick<
    Profile,
    "id" | "display_name" | "username" | "profile_image_url" | "position"
  >;
};

export type MyApplicationWithJob = JobApplication & {
  job: {
    id: string;
    title: string;
    is_active: boolean;
    production: {
      id: string;
      title: string;
      slug: string;
    } | null;
    company: {
      id: string;
      name: string;
      slug: string;
      logo_url: string | null;
    } | null;
  };
};

// ── Fetchers ──────────────────────────────────────────────

async function fetchMyApplication(
  jobId: string,
  userId: string,
): Promise<JobApplication | null> {
  const { data, error } = await supabase
    .from("job_applications")
    .select("*")
    .eq("job_id", jobId)
    .eq("applicant_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as JobApplication | null;
}

async function fetchMyApplications(
  userId: string,
): Promise<MyApplicationWithJob[]> {
  const { data, error } = await supabase
    .from("job_applications")
    .select(
      `
      *,
      job:job_posts!job_applications_job_id_fkey (
        id, title, is_active,
        production:productions!job_posts_production_id_fkey (
          id, title, slug,
          company:production_companies!inner (
            id, name, slug, logo_url
          )
        )
      )
    `,
    )
    .eq("applicant_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const rawJob = row.job as any;
    const rawProd = rawJob?.production;
    const rawCompany = rawProd?.company ?? null;

    return {
      ...row,
      job: {
        id: rawJob.id,
        title: rawJob.title,
        is_active: rawJob.is_active,
        production: rawProd
          ? { id: rawProd.id, title: rawProd.title, slug: rawProd.slug }
          : null,
        company: rawCompany
          ? {
              id: rawCompany.id,
              name: rawCompany.name,
              slug: rawCompany.slug,
              logo_url: rawCompany.logo_url,
            }
          : null,
      },
    } as MyApplicationWithJob;
  });
}

async function fetchJobApplicants(
  jobId: string,
): Promise<ApplicationWithApplicant[]> {
  const { data, error } = await supabase
    .from("job_applications")
    .select(
      `
      *,
      applicant:profiles!job_applications_applicant_id_fkey (
        id, display_name, username, profile_image_url, position
      )
    `,
    )
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    ...row,
    applicant: row.applicant as ApplicationWithApplicant["applicant"],
  })) as ApplicationWithApplicant[];
}

async function fetchApplicantCounts(
  jobIds: string[],
): Promise<Record<string, number>> {
  if (jobIds.length === 0) return {};

  const { data, error } = await supabase
    .from("job_applications")
    .select("job_id")
    .in("job_id", jobIds);

  if (error) throw new Error(error.message);

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.job_id] = (counts[row.job_id] ?? 0) + 1;
  }
  return counts;
}

// ── Hooks ─────────────────────────────────────────────────

/**
 * Check whether the current user has already applied to a job.
 * Returns the application row or null.
 */
export function useMyApplication(jobId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: applicationKeys.myApplication(jobId ?? "", user?.id ?? ""),
    queryFn: () => fetchMyApplication(jobId!, user!.id),
    enabled: !!jobId && !!user?.id,
  });
}

/**
 * Fetch all of the current user's job applications, including
 * the job title, production, and company context.
 */
export function useMyApplications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: applicationKeys.myAll(user?.id ?? ""),
    queryFn: () => fetchMyApplications(user!.id),
    enabled: !!user?.id,
  });
}

/**
 * Fetch all applicants for a specific job. Intended for job posters / company admins.
 */
export function useJobApplicants(jobId: string | undefined) {
  return useQuery({
    queryKey: applicationKeys.forJob(jobId ?? ""),
    queryFn: () => fetchJobApplicants(jobId!),
    enabled: !!jobId,
  });
}

/**
 * Fetch applicant counts for a set of job IDs.
 * Used by ProductionDetail to show badge counts on job rows.
 */
export function useApplicantCounts(jobIds: string[]) {
  return useQuery({
    queryKey: applicationKeys.counts(jobIds),
    queryFn: () => fetchApplicantCounts(jobIds),
    enabled: jobIds.length > 0,
  });
}

/**
 * Submit a job application.
 */
export function useApplyToJob() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      coverMessage,
    }: {
      jobId: string;
      coverMessage: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("job_applications")
        .insert({
          job_id: jobId,
          applicant_id: user.id,
          cover_message: coverMessage.trim() || null,
          status: "pending",
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error("You have already applied to this job.");
        }
        throw new Error(error.message);
      }

      return data as JobApplication;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: applicationKeys.myApplication(data.job_id, user!.id),
      });
      queryClient.invalidateQueries({
        queryKey: applicationKeys.forJob(data.job_id),
      });
      queryClient.invalidateQueries({
        queryKey: applicationKeys.myAll(user!.id),
      });
      queryClient.invalidateQueries({
        queryKey: [...applicationKeys.all, "counts"],
        exact: false,
      });
      toast.success("Application submitted", {
        description: "Your application has been sent to the hiring team.",
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to apply", { description: error.message });
    },
  });
}

/**
 * Update the status of a job application (pending → reviewed → accepted → rejected).
 */
export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      applicationId,
      status,
      jobId,
    }: {
      applicationId: string;
      status: string;
      jobId: string;
    }) => {
      const { data, error } = await supabase
        .from("job_applications")
        .update({ status })
        .eq("id", applicationId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return { application: data as JobApplication, jobId };
    },
    onSuccess: ({ application, jobId }) => {
      queryClient.invalidateQueries({
        queryKey: applicationKeys.forJob(jobId),
      });
      toast.success("Status updated", {
        description: `Application marked as ${application.status}.`,
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to update status", { description: error.message });
    },
  });
}