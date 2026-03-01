import { ChatCircleIcon } from "@phosphor-icons/react";
import { Skeleton } from "@/components/ui/skeleton";
import { ConversationItem } from "@/components/inbox/ConversationItem";
import type { ConversationPreview } from "@/hooks/useConversations";

type ConversationListProps = {
  conversations: ConversationPreview[];
  isLoading: boolean;
  activeConversationId: string | null;
  currentUserId: string;
  onSelect: (conversationId: string) => void;
};

function ListSkeleton() {
  return (
    <div className="space-y-1 p-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ConversationList({
  conversations,
  isLoading,
  activeConversationId,
  currentUserId,
  onSelect,
}: ConversationListProps) {
  if (isLoading) return <ListSkeleton />;

  if (conversations.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4 text-center">
        <ChatCircleIcon size={40} className="mb-3 text-muted-foreground/50" />
        <p className="text-sm font-medium text-muted-foreground">
          No conversations yet
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          Visit a crew member's profile and click Message to start chatting.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5 p-2">
      {conversations.map((conv) => (
        <ConversationItem
          key={conv.id}
          conversation={conv}
          isActive={conv.id === activeConversationId}
          currentUserId={currentUserId}
          onClick={() => onSelect(conv.id)}
        />
      ))}
    </div>
  );
}