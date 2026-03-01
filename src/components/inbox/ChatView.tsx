import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  PaperPlaneRightIcon,
  ArrowLeftIcon
} from "@phosphor-icons/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatBubble } from "@/components/inbox/ChatBubble";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/context/AuthContext";
import type { Profile } from "@/types/models";

type ChatViewProps = {
  conversationId: string;
  participant: Profile;
  onBack?: () => void;
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

function ChatSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-3 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
        >
          <Skeleton
            className={`h-10 rounded-2xl ${
              i % 2 === 0 ? "w-48" : "w-36"
            }`}
          />
        </div>
      ))}
    </div>
  );
}

export function ChatView({
  conversationId,
  participant,
  onBack,
}: ChatViewProps) {
  const { user } = useAuth();
  const {
    messages,
    isLoading,
    sendMessage,
    isTyping,
    sendTypingIndicator,
  } = useMessages(conversationId);

  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingDebounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, [conversationId]);

  function handleSend() {
    const body = input.trim();
    if (!body || sendMessage.isPending) return;
    sendMessage.mutate(body);
    setInput("");
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      clearTimeout(typingDebounceRef.current);
      sendTypingIndicator();
      typingDebounceRef.current = setTimeout(() => {
        // typing stopped — indicator will auto-clear on the other end
      }, 1000);
    },
    [sendTypingIndicator],
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mr-1 h-8 w-8 p-0 md:hidden"
          >
            <ArrowLeftIcon size={18} />
          </Button>
        )}
        <Link
          to={`/crew/${participant.username}`}
          className="flex items-center gap-3 hover:opacity-80"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={participant.profile_image_url ?? undefined}
              alt={participant.display_name ?? participant.username}
            />
            <AvatarFallback className="text-xs font-medium">
              {getInitials(participant.display_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium leading-tight">
              {participant.display_name ?? participant.username}
            </p>
            {participant.position && (
              <p className="text-xs text-muted-foreground">
                {participant.position}
              </p>
            )}
          </div>
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <ChatSkeleton />
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Say hello to {participant.display_name ?? participant.username}!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((msg) => (
              <ChatBubble
                key={msg.id}
                message={msg}
                isMine={msg.sender_id === user?.id}
              />
            ))}
          </div>
        )}

        {/* Typing indicator */}
        {isTyping && (
          <div className="mt-2 flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-muted px-3.5 py-2">
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2"
          />
          <Button
            size="sm"
            disabled={!input.trim() || sendMessage.isPending}
            onClick={handleSend}
            className="h-9 w-9 shrink-0 p-0"
          >
            <PaperPlaneRightIcon size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}