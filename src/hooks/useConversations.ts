import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import type { Profile } from "@/types/models";

// ── Types ─────────────────────────────────────────────────

export type ConversationPreview = {
  id: string;
  created_at: string;
  participant: Profile;
  lastMessage: {
    body: string;
    sender_id: string;
    created_at: string;
  } | null;
  unreadCount: number;
};

// ── Query keys ────────────────────────────────────────────

export const conversationKeys = {
  all: ["conversations"] as const,
  list: (userId: string) => [...conversationKeys.all, "list", userId] as const,
  detail: (id: string) => [...conversationKeys.all, "detail", id] as const,
};

// ── Fetcher ───────────────────────────────────────────────

async function fetchConversations(
  userId: string,
): Promise<ConversationPreview[]> {
  // Get all conversations the user participates in
  const { data: participations, error: pErr } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId);

  if (pErr) throw new Error(pErr.message);
  if (!participations?.length) return [];

  const convIds = participations.map((p) => p.conversation_id);

  // Fetch other participants with their profiles
  const { data: otherParticipants, error: opErr } = await supabase
    .from("conversation_participants")
    .select("conversation_id, user_id, profile:profiles(*)")
    .in("conversation_id", convIds)
    .neq("user_id", userId);

  if (opErr) throw new Error(opErr.message);

  // Fetch latest message per conversation
  // We'll fetch all messages for these conversations and pick the latest
  const { data: messages, error: mErr } = await supabase
    .from("messages")
    .select("conversation_id, body, sender_id, created_at, read_at")
    .in("conversation_id", convIds)
    .order("created_at", { ascending: false });

  if (mErr) throw new Error(mErr.message);

  // Build a map of conversation_id → latest message + unread count
  const lastMessageMap = new Map<
    string,
    { body: string; sender_id: string; created_at: string }
  >();
  const unreadMap = new Map<string, number>();

  for (const msg of messages ?? []) {
    // Track latest message
    if (!lastMessageMap.has(msg.conversation_id)) {
      lastMessageMap.set(msg.conversation_id, {
        body: msg.body,
        sender_id: msg.sender_id,
        created_at: msg.created_at,
      });
    }
    // Count unreads (messages not from me, not read)
    if (msg.sender_id !== userId && !msg.read_at) {
      unreadMap.set(
        msg.conversation_id,
        (unreadMap.get(msg.conversation_id) ?? 0) + 1,
      );
    }
  }

  // Build previews
  const previews: ConversationPreview[] = [];

  for (const op of otherParticipants ?? []) {
    const profile = op.profile as unknown as Profile;
    if (!profile) continue;

    previews.push({
      id: op.conversation_id,
      created_at: lastMessageMap.get(op.conversation_id)?.created_at ?? "",
      participant: profile,
      lastMessage: lastMessageMap.get(op.conversation_id) ?? null,
      unreadCount: unreadMap.get(op.conversation_id) ?? 0,
    });
  }

  // Sort by latest message (most recent first), conversations with no messages last
  previews.sort((a, b) => {
    if (!a.lastMessage && !b.lastMessage) return 0;
    if (!a.lastMessage) return 1;
    if (!b.lastMessage) return -1;
    return b.lastMessage.created_at.localeCompare(a.lastMessage.created_at);
  });

  return previews;
}

// ── Hook ──────────────────────────────────────────────────

export function useConversations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const query = useQuery({
    queryKey: conversationKeys.list(userId ?? ""),
    queryFn: () => fetchConversations(userId!),
    enabled: !!userId,
    refetchOnMount: "always"
  });

  // Real-time: subscribe to new messages to update the conversation list
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("inbox-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          // Refetch conversation list when any message changes
          queryClient.invalidateQueries({
            queryKey: conversationKeys.list(userId),
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return {
    conversations: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}