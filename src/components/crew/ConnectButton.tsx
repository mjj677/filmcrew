import { useNavigate } from "react-router-dom";
import {
  UserPlusIcon,
  CheckIcon,
  ClockIcon,
  SpinnerGapIcon,
  XIcon,
  UserMinusIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useConnection } from "@/hooks/useConnection";

type ConnectButtonProps = {
  targetUserId: string;
  targetName: string;
};

export function ConnectButton({ targetUserId, targetName }: ConnectButtonProps) {
  const navigate = useNavigate();
  const {
    status,
    isLoading,
    isSelf,
    isSignedIn,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeConnection,
  } = useConnection(targetUserId);

  if (isSelf || isLoading) return null;

  // Not signed in — prompt to sign in
  if (!isSignedIn) {
    return (
      <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
        <UserPlusIcon size={16} />
        Connect
      </Button>
    );
  }

  const isActing =
    sendRequest.isPending ||
    acceptRequest.isPending ||
    declineRequest.isPending ||
    removeConnection.isPending;

  if (status === "none" || status === "declined") {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={isActing}
        onClick={() => {
          sendRequest.mutate(undefined, {
            onSuccess: () =>
              toast.success(`Connection request sent to ${targetName}`),
            onError: () =>
              toast.error("Failed to send request. Please try again."),
          });
        }}
        className="gap-1.5 cursor-pointer"
      >
        {isActing ? (
          <SpinnerGapIcon size={16} className="animate-spin" />
        ) : (
          <UserPlusIcon size={16} />
        )}
        Connect
      </Button>
    );
  }

  if (status === "pending_sent") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 cursor-pointer" disabled={isActing}>
            <ClockIcon size={16} />
            Pending
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              removeConnection.mutate(undefined, {
                onSuccess: () => toast("Connection request withdrawn"),
                onError: () => toast.error("Failed to withdraw request"),
              });
            }}
            className="cursor-pointer"
          >
            <XIcon size={14} />
            Withdraw request
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (status === "pending_received") {
    return (
      <div className="flex gap-2 cursor-pointer">
        <Button
          variant="default"
          size="sm"
          disabled={isActing}
          onClick={() => {
            acceptRequest.mutate(undefined, {
              onSuccess: () =>
                toast.success(`You're now connected with ${targetName}`),
              onError: () =>
                toast.error("Failed to accept request"),
            });
          }}
          className="gap-1.5 cursor-pointer"
        >
          {acceptRequest.isPending ? (
            <SpinnerGapIcon size={16} className="animate-spin" />
          ) : (
            <CheckIcon size={16} />
          )}
          Accept
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={isActing}
          onClick={() => {
            declineRequest.mutate(undefined, {
              onSuccess: () => toast("Request declined"),
              onError: () => toast.error("Failed to decline request"),
            });
          }}
          className="gap-1.5 cursor-pointer"
        >
          <XIcon size={16} />
          Decline
        </Button>
      </div>
    );
  }

  if (status === "accepted") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 cursor-pointer" disabled={isActing}>
            <CheckIcon size={16} />
            Connected
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              removeConnection.mutate(undefined, {
                onSuccess: () =>
                  toast(`Disconnected from ${targetName}`),
                onError: () =>
                  toast.error("Failed to remove connection"),
              });
            }}
            className="cursor-pointer text-destructive"
          >
            <UserMinusIcon size={14} />
            Remove connection
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return null;
}