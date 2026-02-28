import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { connectionKeys } from "@/hooks/useConnection";
import type { Profile } from "@/types/models";

// ── Types ─────────────────────────────────────────────────

type ConnectionWithProfile = {
  id: string;
  status: string | null;
  created_at: string;
  requester_id: string;
  recipient_id: string;
  profile: Profile;
};

type ConnectionsResult = {
  accepted: ConnectionWithProfile[];
  pendingIncoming: ConnectionWithProfile[];
  pendingSent: ConnectionWithProfile[];
};

// ── Fetcher ───────────────────────────────────────────────

async function fetchUserConnections(
  userId: string,
): Promise<ConnectionsResult> {
  // Fetch all connections where user is requester or recipient
  // We need two queries because the "other person" profile is on different FK sides

  const [asRequester, asRecipient] = await Promise.all([
    supabase
      .from("connections")
      .select("*, profile:profiles!connections_recipient_id_fkey(*)")
      .eq("requester_id", userId)
      .in("status", ["pending", "accepted"]),
    supabase
      .from("connections")
      .select("*, profile:profiles!connections_requester_id_fkey(*)")
      .eq("recipient_id", userId)
      .in("status", ["pending", "accepted"]),
  ]);

  if (asRequester.error) throw new Error(asRequester.error.message);
  if (asRecipient.error) throw new Error(asRecipient.error.message);

  const accepted: ConnectionWithProfile[] = [];
  const pendingIncoming: ConnectionWithProfile[] = [];
  const pendingSent: ConnectionWithProfile[] = [];

  // Connections where I'm the requester
  for (const row of asRequester.data ?? []) {
    const item = {
      id: row.id,
      status: row.status,
      created_at: row.created_at,
      requester_id: row.requester_id,
      recipient_id: row.recipient_id,
      profile: row.profile as unknown as Profile,
    };
    if (row.status === "accepted") accepted.push(item);
    else if (row.status === "pending") pendingSent.push(item);
  }

  // Connections where I'm the recipient
  for (const row of asRecipient.data ?? []) {
    const item = {
      id: row.id,
      status: row.status,
      created_at: row.created_at,
      requester_id: row.requester_id,
      recipient_id: row.recipient_id,
      profile: row.profile as unknown as Profile,
    };
    if (row.status === "accepted") accepted.push(item);
    else if (row.status === "pending") pendingIncoming.push(item);
  }

  // Sort accepted by display name
  accepted.sort((a, b) =>
    (a.profile.display_name ?? "").localeCompare(b.profile.display_name ?? ""),
  );

  return { accepted, pendingIncoming, pendingSent };
}

// ── Hook ──────────────────────────────────────────────────

export function useConnections() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: connectionKeys.list(user?.id ?? ""),
    queryFn: () => fetchUserConnections(user!.id),
    enabled: !!user?.id,
  });

  const data = query.data;

  return {
    accepted: data?.accepted ?? [],
    pendingIncoming: data?.pendingIncoming ?? [],
    pendingSent: data?.pendingSent ?? [],
    totalAccepted: data?.accepted.length ?? 0,
    totalPendingIncoming: data?.pendingIncoming.length ?? 0,
    isLoading: query.isLoading,
    error: query.error,
  };
}