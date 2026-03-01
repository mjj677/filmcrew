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
        // Unique constraint violation = already applied
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