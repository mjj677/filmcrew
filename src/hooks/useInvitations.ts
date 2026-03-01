import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { companyKeys } from "@/hooks/useCompanies";
import type { CompanyInvitation, CompanyRole, Profile } from "@/types/models";

// ── Types ─────────────────────────────────────────────────

export type InvitationWithInviter = CompanyInvitation & {
  inviter: Pick<Profile, "id" | "display_name" | "username" | "profile_image_url"> | null;
  invitedUser: Pick<Profile, "id" | "display_name" | "username" | "profile_image_url"> | null;
};

// ── Query keys ────────────────────────────────────────────

export const invitationKeys = {
  forCompany: (companyId: string) =>
    [...companyKeys.all, "invitations", companyId] as const,
};

// ── Fetcher ───────────────────────────────────────────────

async function fetchCompanyInvitations(
  companyId: string
): Promise<InvitationWithInviter[]> {
  const { data, error } = await supabase
    .from("company_invitations")
    .select(
      `
      *,
      inviter:profiles!company_invitations_invited_by_fkey (
        id, display_name, username, profile_image_url
      ),
      invitedUser:profiles!company_invitations_invited_user_id_fkey (
        id, display_name, username, profile_image_url
      )
    `
    )
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    ...row,
    inviter: row.inviter as InvitationWithInviter["inviter"],
    invitedUser: row.invitedUser as InvitationWithInviter["invitedUser"],
  }));
}

// ── Hooks ─────────────────────────────────────────────────

/**
 * Fetches all invitations for a company (all statuses).
 * Only admins+ can see these (enforced by RLS).
 */
export function useCompanyInvitations(companyId: string | undefined) {
  return useQuery({
    queryKey: invitationKeys.forCompany(companyId ?? ""),
    queryFn: () => fetchCompanyInvitations(companyId!),
    enabled: !!companyId,
  });
}

/**
 * Send a new invitation — by username or email.
 * Resolves a username to a user_id before inserting.
 */
export function useSendInvitation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      companyId,
      identifier,
      role,
    }: {
      companyId: string;
      identifier: string; // username or email
      role: CompanyRole;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const trimmed = identifier.trim().toLowerCase();
      const isEmail = trimmed.includes("@");

      let invited_user_id: string | null = null;
      let invited_email: string | null = null;

      if (isEmail) {
        invited_email = trimmed;
        // Also try to find an existing user with this email
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", trimmed)
          .maybeSingle();
        if (profile) invited_user_id = profile.id;
      } else {
        // Treat as username
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("id, email")
          .eq("username", trimmed)
          .maybeSingle();

        if (error) throw new Error(error.message);
        if (!profile) throw new Error(`No user found with username "${trimmed}".`);

        invited_user_id = profile.id;
        invited_email = profile.email;
      }

      // Prevent self-invites
      if (invited_user_id === user.id) {
        throw new Error("You can't invite yourself.");
      }

      const { data, error } = await supabase
        .from("company_invitations")
        .insert({
          company_id: companyId,
          invited_by: user.id,
          invited_user_id,
          invited_email,
          role,
        })
        .select()
        .single();

      if (error) {
        // Handle duplicate pending invite exclusion constraint
        if (error.code === "23P01") {
          throw new Error("A pending invitation already exists for this person.");
        }
        // Handle check constraint (at least one of user_id or email required)
        if (error.code === "23514") {
          throw new Error("Either a username or email is required.");
        }
        throw new Error(error.message);
      }

      return { invitation: data as CompanyInvitation, companyId };
    },
    onSuccess: ({ companyId }) => {
      queryClient.invalidateQueries({
        queryKey: invitationKeys.forCompany(companyId),
      });
      toast.success("Invitation sent");
    },
    onError: (error: Error) => {
      toast.error("Failed to send invitation", { description: error.message });
    },
  });
}

/**
 * Revoke a pending invitation (admin+ only, enforced by RLS).
 */
export function useRevokeInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      invitationId,
      companyId,
    }: {
      invitationId: string;
      companyId: string;
    }) => {
      const { error } = await supabase
        .from("company_invitations")
        .update({ status: "revoked", responded_at: new Date().toISOString() })
        .eq("id", invitationId)
        .eq("status", "pending");

      if (error) throw new Error(error.message);
      return { companyId };
    },
    onSuccess: ({ companyId }) => {
      queryClient.invalidateQueries({
        queryKey: invitationKeys.forCompany(companyId),
      });
      toast.success("Invitation revoked");
    },
    onError: (error: Error) => {
      toast.error("Failed to revoke invitation", { description: error.message });
    },
  });
}