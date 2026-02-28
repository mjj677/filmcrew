import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import type { Connection } from "@/types/models";

// ── Types ─────────────────────────────────────────────────

export type ConnectionStatus =
  | "none"            // no connection exists
  | "pending_sent"    // current user sent the request
  | "pending_received"// current user received the request
  | "accepted"        // connected
  | "declined";       // recipient declined

type ConnectionState = {
  status: ConnectionStatus;
  connection: Connection | null;
};

// ── Query keys ────────────────────────────────────────────

export const connectionKeys = {
  all: ["connections"] as const,
  between: (a: string, b: string) =>
    [...connectionKeys.all, "between", a, b] as const,
  list: (userId: string) =>
    [...connectionKeys.all, "list", userId] as const,
};

// ── Fetcher ───────────────────────────────────────────────

async function fetchConnectionBetween(
  currentUserId: string,
  targetUserId: string,
): Promise<ConnectionState> {
  // Check both directions — current user could be requester or recipient
  const { data, error } = await supabase
    .from("connections")
    .select("*")
    .or(
      `and(requester_id.eq.${currentUserId},recipient_id.eq.${targetUserId}),` +
      `and(requester_id.eq.${targetUserId},recipient_id.eq.${currentUserId})`,
    )
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (!data) {
    return { status: "none", connection: null };
  }

  if (data.status === "accepted") {
    return { status: "accepted", connection: data };
  }

  if (data.status === "declined") {
    return { status: "declined", connection: data };
  }

  // Pending — determine direction
  if (data.requester_id === currentUserId) {
    return { status: "pending_sent", connection: data };
  }

  return { status: "pending_received", connection: data };
}

// ── Hook ──────────────────────────────────────────────────

/**
 * Manages the connection state between the current user and a target user.
 * Provides the current status + mutations to send, accept, decline, and remove.
 */
export function useConnection(targetUserId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const currentUserId = user?.id;

  const enabled = !!currentUserId && !!targetUserId && currentUserId !== targetUserId;

  const query = useQuery({
    queryKey: connectionKeys.between(currentUserId ?? "", targetUserId ?? ""),
    queryFn: () => fetchConnectionBetween(currentUserId!, targetUserId!),
    enabled,
  });

  function invalidate() {
    // Invalidate both the specific pair and the full list
    queryClient.invalidateQueries({ queryKey: connectionKeys.all });
  }

  // ── Send request ────────────────────────────────────────

  const sendRequest = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("connections").insert({
        requester_id: currentUserId!,
        recipient_id: targetUserId!,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // ── Accept request ──────────────────────────────────────

  const acceptRequest = useMutation({
    mutationFn: async () => {
      const connId = query.data?.connection?.id;
      if (!connId) throw new Error("No connection to accept");
      const { error } = await supabase
        .from("connections")
        .update({ status: "accepted" })
        .eq("id", connId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // ── Decline request ─────────────────────────────────────

  const declineRequest = useMutation({
    mutationFn: async () => {
      const connId = query.data?.connection?.id;
      if (!connId) throw new Error("No connection to decline");
      const { error } = await supabase
        .from("connections")
        .update({ status: "declined" })
        .eq("id", connId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // ── Remove / withdraw ──────────────────────────────────

  const removeConnection = useMutation({
    mutationFn: async () => {
      const connId = query.data?.connection?.id;
      if (!connId) throw new Error("No connection to remove");
      const { error } = await supabase
        .from("connections")
        .delete()
        .eq("id", connId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return {
    status: query.data?.status ?? "none",
    connection: query.data?.connection ?? null,
    isLoading: query.isLoading,
    isSelf: currentUserId === targetUserId,
    isSignedIn: !!currentUserId,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeConnection,
  };
}