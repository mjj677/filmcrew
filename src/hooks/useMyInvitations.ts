import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { companyKeys } from "@/hooks/useCompanies";
import type { CompanyRole } from "@/types/models";

// ── Types ─────────────────────────────────────────────────

export type PendingInvitation = {
  id: string;
  company_id: string;
  role: CompanyRole;
  expires_at: string;
  created_at: string;
  company: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
  };
  inviter: {
    id: string;
    display_name: string | null;
    username: string;
  } | null;
};

// ── Query keys ────────────────────────────────────────────

export const myInvitationKeys = {
  all: ["myInvitations"] as const,
  pending: () => [...myInvitationKeys.all, "pending"] as const,
};

// ── Fetcher ───────────────────────────────────────────────

async function fetchMyPendingInvitations(): Promise<PendingInvitation[]> {
  const { data, error } = await supabase
    .from("company_invitations")
    .select(
      `
      id,
      company_id,
      role,
      expires_at,
      created_at,
      company:production_companies!inner (
        id, name, slug, logo_url
      ),
      inviter:profiles!company_invitations_invited_by_fkey (
        id, display_name, username
      )
    `
    )
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    company_id: row.company_id,
    role: row.role as CompanyRole,
    expires_at: row.expires_at,
    created_at: row.created_at,
    company: row.company as PendingInvitation["company"],
    inviter: row.inviter as PendingInvitation["inviter"],
  }));
}

// ── Hook ──────────────────────────────────────────────────

export function useMyInvitations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: myInvitationKeys.pending(),
    queryFn: fetchMyPendingInvitations,
    enabled: !!user,
    // Poll every 2 minutes — invitations are low-frequency,
    // real-time isn't worth the overhead here.
    refetchInterval: 120_000,
  });
}

// ── Accept mutation ───────────────────────────────────────

export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase.rpc("accept_company_invitation", {
        p_invitation_id: invitationId,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      // Invalidate pending invitations list
      queryClient.invalidateQueries({ queryKey: myInvitationKeys.all });
      // Invalidate user companies so the context switcher updates immediately
      queryClient.invalidateQueries({ queryKey: companyKeys.all });
      // Invalidate any loaded company public profile so the Dashboard/Settings
      // buttons appear and the team roster updates without a page reload
      queryClient.invalidateQueries({ queryKey: ["companyProfile"] });
      toast.success("Invitation accepted — welcome to the team!");
    },
    onError: (error: Error) => {
      toast.error("Failed to accept invitation", { description: error.message });
    },
  });
}

// ── Decline mutation ──────────────────────────────────────

export function useDeclineInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase.rpc("decline_company_invitation", {
        p_invitation_id: invitationId,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myInvitationKeys.all });
      toast("Invitation declined");
    },
    onError: (error: Error) => {
      toast.error("Failed to decline invitation", { description: error.message });
    },
  });
}