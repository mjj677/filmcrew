import { Link } from "react-router-dom";
import {
  CheckIcon,
  XIcon,
  UserMinusIcon,
  SpinnerGapIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { connectionKeys } from "@/hooks/useConnection";
import type { Profile } from "@/types/models";

type ConnectionCardProps = {
  connectionId: string;
  profile: Profile;
  variant: "accepted" | "incoming" | "sent";
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

export function ConnectionCard({
  connectionId,
  profile,
  variant,
}: ConnectionCardProps) {
  const queryClient = useQueryClient();

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: connectionKeys.all });
  }

  const accept = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("connections")
        .update({ status: "accepted" })
        .eq("id", connectionId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`Connected with ${profile.display_name ?? profile.username}`);
      invalidate();
    },
    onError: () => toast.error("Failed to accept request"),
  });

  const decline = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("connections")
        .update({ status: "declined" })
        .eq("id", connectionId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast("Request declined");
      invalidate();
    },
    onError: () => toast.error("Failed to decline request"),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("connections")
        .delete()
        .eq("id", connectionId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast("Connection removed");
      invalidate();
    },
    onError: () => toast.error("Failed to remove connection"),
  });

  const isActing = accept.isPending || decline.isPending || remove.isPending;

  return (
    <div className="flex items-center gap-3 py-3">
      <Link to={`/crew/${profile.username}`}>
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage
            src={profile.profile_image_url ?? undefined}
            alt={profile.display_name ?? profile.username}
          />
          <AvatarFallback className="text-xs font-medium">
            {getInitials(profile.display_name)}
          </AvatarFallback>
        </Avatar>
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          to={`/crew/${profile.username}`}
          className="text-sm font-medium hover:underline"
        >
          {profile.display_name ?? profile.username}
        </Link>
        {profile.position && (
          <p className="truncate text-xs text-muted-foreground">
            {profile.position}
          </p>
        )}
      </div>

      {/* Actions */}
      {variant === "incoming" && (
        <div className="flex gap-1.5">
          <Button
            variant="default"
            size="sm"
            disabled={isActing}
            onClick={() => accept.mutate()}
            className="h-8 gap-1 cursor-pointer"
          >
            {accept.isPending ? (
              <SpinnerGapIcon size={14} className="animate-spin" />
            ) : (
              <CheckIcon size={14} />
            )}
            Accept
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isActing}
            onClick={() => decline.mutate()}
            className="h-8 gap-1 cursor-pointer"
          >
            <XIcon size={14} />
          </Button>
        </div>
      )}

      {variant === "sent" && (
        <Button
          variant="ghost"
          size="sm"
          disabled={isActing}
          onClick={() => remove.mutate()}
          className="h-8 gap-1 text-muted-foreground cursor-pointer"
        >
          {remove.isPending ? (
            <SpinnerGapIcon size={14} className="animate-spin" />
          ) : (
            <XIcon size={14} />
          )}
          Withdraw
        </Button>
      )}

      {variant === "accepted" && (
        <Button
          variant="ghost"
          size="sm"
          disabled={isActing}
          onClick={() => remove.mutate()}
          className="h-8 gap-1 text-muted-foreground cursor-pointer"
        >
          {remove.isPending ? (
            <SpinnerGapIcon size={14} className="animate-spin" />
          ) : (
            <UserMinusIcon size={14} />
          )}
        </Button>
      )}
    </div>
  );
}