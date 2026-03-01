import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { conversationKeys } from "@/hooks/useConversations";

/**
 * Creates or finds an existing 1:1 conversation between the current user
 * and a target user, then navigates to the inbox with that conversation open.
 *
 * Uses a server-side RPC (find_or_create_conversation) to avoid RLS issues —
 * the client can't query another user's conversation_participants rows
 * unless they already share a conversation.
 */
export function useStartConversation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      const { data, error } = await supabase.rpc(
        "find_or_create_conversation",
        { target_user_id: targetUserId }
      );

      if (error) throw error;

      return data as string;
    },
    onSuccess: (conversationId) => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.all });
      navigate(`/inbox/${conversationId}`);
    },
    onError: (error: { message?: string }) => {
      console.error("Failed to start conversation:", error);
      toast.error("Couldn't start conversation", {
        description: error.message ?? "Something went wrong. Please try again.",
      });
    },
  });
}