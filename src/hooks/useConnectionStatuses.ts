import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { connectionKeys } from "@/hooks/useConnection";

type StatusMap = Record<string, "pending" | "accepted">;

/**
 * Batch-fetches connection statuses between the current user and a list of
 * profile IDs in a single query. Returns a map of profileId → status.
 * Only includes entries where a connection exists (pending or accepted).
 */
async function fetchStatuses(
  userId: string,
  profileIds: string[],
): Promise<StatusMap> {
  if (profileIds.length === 0) return {};

  const { data, error } = await supabase
    .from("connections")
    .select("requester_id, recipient_id, status")
    .in("status", ["pending", "accepted"])
    .or(
      `and(requester_id.eq.${userId},recipient_id.in.(${profileIds.join(",")})),` +
      `and(recipient_id.eq.${userId},requester_id.in.(${profileIds.join(",")}))`,
    );

  if (error) throw new Error(error.message);

  const map: StatusMap = {};

  for (const row of data ?? []) {
    const otherId =
      row.requester_id === userId ? row.recipient_id : row.requester_id;
    if (row.status === "accepted" || row.status === "pending") {
      map[otherId] = row.status;
    }
  }

  return map;
}

export function useConnectionStatuses(profileIds: string[]) {
  const { user } = useAuth();
  const userId = user?.id;

  // Sort IDs for stable query key
  const sortedIds = [...profileIds].sort();

  const query = useQuery({
    queryKey: [...connectionKeys.all, "statuses", userId, sortedIds],
    queryFn: () => fetchStatuses(userId!, sortedIds),
    enabled: !!userId && sortedIds.length > 0,
  });

  return {
    statuses: query.data ?? ({} as StatusMap),
    isLoading: query.isLoading,
  };
}