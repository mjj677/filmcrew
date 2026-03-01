import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ChatCircleIcon } from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { useConversations } from "@/hooks/useConversations";
import { ConversationList } from "@/components/inbox/ConversationList";
import { ChatView } from "@/components/inbox/ChatView";
import { cn } from "@/lib/utils";

function Inbox() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { conversations, isLoading } = useConversations();

  // On mobile, show list or chat (not both)
  const [mobileShowChat, setMobileShowChat] = useState(!!conversationId);

  // Sync mobile view with URL
  useEffect(() => {
    setMobileShowChat(!!conversationId);
  }, [conversationId]);

  const activeConversation = conversations.find(
    (c) => c.id === conversationId,
  );

  function handleSelect(id: string) {
    navigate(`/inbox/${id}`);
  }

  function handleBack() {
    navigate("/inbox");
  }

  return (
    <>
      <Helmet>
        <title>Inbox | FilmCrew</title>
      </Helmet>

      <div className="mx-auto h-[calc(100vh-4rem)] max-w-5xl overflow-hidden rounded-lg border bg-card md:flex">
        {/* Conversation list — sidebar on desktop, full-screen on mobile */}
        <div
          className={cn(
            "h-full w-full flex-col border-r md:flex md:w-80 md:shrink-0",
            mobileShowChat ? "hidden" : "flex",
          )}
        >
          <div className="border-b px-4 py-3">
            <h1 className="text-lg font-semibold">Messages</h1>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ConversationList
              conversations={conversations}
              isLoading={isLoading}
              activeConversationId={conversationId ?? null}
              currentUserId={user?.id ?? ""}
              onSelect={handleSelect}
            />
          </div>
        </div>

        {/* Chat view — right side on desktop, full-screen on mobile */}
        <div
          className={cn(
            "h-full flex-1 flex-col",
            mobileShowChat ? "flex" : "hidden md:flex",
          )}
        >
          {activeConversation ? (
            <ChatView
              conversationId={activeConversation.id}
              participant={activeConversation.participant}
              onBack={handleBack}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <ChatCircleIcon
                size={48}
                className="mb-3 text-muted-foreground/30"
              />
              <p className="text-sm text-muted-foreground">
                Select a conversation to start messaging
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Inbox;