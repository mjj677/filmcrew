import { cn } from "@/lib/utils";
import type { Message } from "@/types/models";

type ChatBubbleProps = {
  message: Message;
  isMine: boolean;
};

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ChatBubble({ message, isMine }: ChatBubbleProps) {
  return (
    <div
      className={cn("flex", isMine ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-3.5 py-2",
          isMine
            ? "rounded-br-md bg-foreground text-background"
            : "rounded-bl-md bg-muted",
        )}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.body}
        </p>
        <p
          className={cn(
            "mt-0.5 text-[10px]",
            isMine ? "text-background/60" : "text-muted-foreground",
          )}
        >
          {formatTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}