import { useEffect, useCallback, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { conversationKeys } from "@/hooks/useConversations";
import { unreadKeys } from "@/hooks/useUnreadCount";
import type { Message } from "@/types/models";

// ── Query keys ────────────────────────────────────────────

export const messageKeys = {
  all: ["messages"] as const,
  list: (conversationId: string) =>
    [...messageKeys.all, conversationId] as const,
};

// ── Fetcher ───────────────────────────────────────────────

async function fetchMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

// ── Hook ──────────────────────────────────────────────────

export function useMessages(conversationId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const enabled = !!conversationId && !!userId;

  const query = useQuery({
    queryKey: messageKeys.list(conversationId ?? ""),
    queryFn: () => fetchMessages(conversationId!),
    enabled,
    staleTime: 0,
  });

  // Helper to invalidate both conversation list and unread badge
  const invalidateInbox = useCallback(() => {
    if (!userId) return;
    queryClient.invalidateQueries({
      queryKey: conversationKeys.list(userId),
    });
    queryClient.invalidateQueries({
      queryKey: unreadKeys.count(userId),
    });
  }, [userId, queryClient]);

  // ── Real-time: new messages ─────────────────────────────

  useEffect(() => {
    if (!conversationId || !userId) return;

    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;

          // Optimistically add to cache
          queryClient.setQueryData<Message[]>(
            messageKeys.list(conversationId),
            (old) => (old ? [...old, newMsg] : [newMsg]),
          );

          // If message is from the other person, mark as read
          if (newMsg.sender_id !== userId) {
            supabase
              .from("messages")
              .update({ read_at: new Date().toISOString() })
              .eq("id", newMsg.id)
              .then(() => invalidateInbox());
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, userId, queryClient, invalidateInbox]);

  // ── Real-time: typing indicators ────────────────────────

  useEffect(() => {
    if (!conversationId || !userId) return;

    const channel = supabase.channel(`typing:${conversationId}`);

    channel
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload?.userId !== userId) {
          setIsTyping(true);
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
          }, 2000);
        }
      })
      .subscribe();

    return () => {
      clearTimeout(typingTimeoutRef.current);
      supabase.removeChannel(channel);
    };
  }, [conversationId, userId]);

  // Broadcast that we're typing
  const sendTypingIndicator = useCallback(() => {
    if (!conversationId || !userId) return;

    supabase.channel(`typing:${conversationId}`).send({
      type: "broadcast",
      event: "typing",
      payload: { userId },
    });
  }, [conversationId, userId]);

  // ── Mark all unread messages as read ────────────────────

  const markedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!conversationId || !userId || !query.data) return;

    const unreadIds = query.data
      .filter(
        (m) =>
          m.sender_id !== userId &&
          !m.read_at &&
          !markedIdsRef.current.has(m.id),
      )
      .map((m) => m.id);

    if (unreadIds.length === 0) return;

    // Track these so we don't re-mark them while waiting for cache to update
    unreadIds.forEach((id) => markedIdsRef.current.add(id));

    supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .in("id", unreadIds)
      .then(() => {
        // Optimistically update the messages cache so they show as read
        queryClient.setQueryData<Message[]>(
          messageKeys.list(conversationId),
          (old) =>
            old?.map((m) =>
              unreadIds.includes(m.id)
                ? { ...m, read_at: new Date().toISOString() }
                : m,
            ) ?? [],
        );
        invalidateInbox();
      });
  }, [conversationId, userId, query.data, invalidateInbox, queryClient]);

  // Reset tracked IDs when conversation changes
  useEffect(() => {
    markedIdsRef.current.clear();
  }, [conversationId]);

  useEffect(() => {
    return () => {
      markedIdsRef.current.clear();
    };
  }, []);

  // ── Send message mutation ───────────────────────────────

  const sendMessage = useMutation({
    mutationFn: async (body: string) => {
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId!,
        sender_id: userId!,
        body: body.trim(),
      });
      if (error) throw error;
    },
  });

  return {
    messages: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    sendMessage,
    isTyping,
    sendTypingIndicator,
  };
}
