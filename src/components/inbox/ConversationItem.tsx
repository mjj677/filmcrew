import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { ConversationPreview } from "@/hooks/useConversations";

type ConversationItemProps = {
  conversation: ConversationPreview;
  isActive: boolean;
  currentUserId: string;
  onClick: () => void;
};

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) {
    return date.toLocaleDateString("en-GB", { weekday: "short" });
  }
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function ConversationItem({
  conversation,
  isActive,
  currentUserId,
  onClick,
}: ConversationItemProps) {
  const { participant, lastMessage, unreadCount } = conversation;
  const hasUnread = unreadCount > 0;

  const previewText = lastMessage
    ? lastMessage.sender_id === currentUserId
      ? `You: ${lastMessage.body}`
      : lastMessage.body
    : "No messages yet";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-accent/50 cursor-pointer",
        isActive && "bg-accent",
      )}
    >
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage
          src={participant.profile_image_url ?? undefined}
          alt={participant.display_name ?? participant.username}
        />
        <AvatarFallback className="text-xs font-medium">
          {getInitials(participant.display_name)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p
            className={cn(
              "truncate text-sm",
              hasUnread ? "font-semibold" : "font-medium",
            )}
          >
            {participant.display_name ?? participant.username}
          </p>
          {lastMessage && (
            <span className="shrink-0 text-[11px] text-muted-foreground">
              {formatTime(lastMessage.created_at)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "truncate text-xs",
              hasUnread
                ? "font-medium text-foreground"
                : "text-muted-foreground",
            )}
          >
            {previewText}
          </p>
          {hasUnread && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-foreground px-1.5 text-[10px] font-semibold text-background">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}