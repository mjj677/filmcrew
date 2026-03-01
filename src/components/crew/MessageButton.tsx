import { useNavigate } from "react-router-dom";
import { ChatCircleIcon, SpinnerGapIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useStartConversation } from "@/hooks/useStartConversation";

type MessageButtonProps = {
  targetUserId: string;
};

export function MessageButton({ targetUserId }: MessageButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const startConversation = useStartConversation();

  if (!user) {
    return (
      <Button variant="outline" size="sm" onClick={() => navigate("/auth")} className="gap-1.5">
        <ChatCircleIcon size={16} />
        Message
      </Button>
    );
  }

  if (user.id === targetUserId) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={startConversation.isPending}
      onClick={() => {
        startConversation.mutate(targetUserId, {
          onError: () => toast.error("Failed to start conversation"),
        });
      }}
      className="gap-1.5 cursor-pointer"
    >
      {startConversation.isPending ? (
        <SpinnerGapIcon size={16} className="animate-spin" />
      ) : (
        <ChatCircleIcon size={16} />
      )}
      Message
    </Button>
  );
}