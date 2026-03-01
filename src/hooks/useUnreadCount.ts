import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export const unreadKeys = {
  count: (userId: string) => ["unread-count", userId] as const,
};

async function fetchUnreadCount(): Promise<number> {
  const { data, error } = await supabase.rpc("get_unread_count");

  if (error) throw new Error(error.message);
  return data ?? 0;
}

export function useUnreadCount() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const query = useQuery({
    queryKey: unreadKeys.count(userId ?? ""),
    queryFn: fetchUnreadCount,
    enabled: !!userId,
    refetchInterval: 30_000,
  });

  // Real-time: refresh on new messages
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("unread-badge")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: unreadKeys.count(userId),
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return query.data ?? 0;
}