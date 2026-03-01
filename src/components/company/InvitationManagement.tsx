import { useState } from "react";
import {
  EnvelopeSimpleIcon,
  PaperPlaneTiltIcon,
  SpinnerGapIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ProhibitIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useCompanyInvitations,
  useSendInvitation,
  useRevokeInvitation,
  type InvitationWithInviter,
} from "@/hooks/useInvitations";
import type { ProductionCompany, CompanyRole, InvitationStatus } from "@/types/models";

// ── Status config ───────────────────────────────────────

const STATUS_CONFIG: Record<
  InvitationStatus,
  { label: string; icon: typeof ClockIcon; className: string }
> = {
  pending: {
    label: "Pending",
    icon: ClockIcon,
    className: "bg-amber-100 text-amber-800",
  },
  accepted: {
    label: "Accepted",
    icon: CheckCircleIcon,
    className: "bg-green-100 text-green-800",
  },
  declined: {
    label: "Declined",
    icon: XCircleIcon,
    className: "bg-stone-100 text-stone-600",
  },
  revoked: {
    label: "Revoked",
    icon: ProhibitIcon,
    className: "bg-stone-100 text-stone-600",
  },
  expired: {
    label: "Expired",
    icon: WarningCircleIcon,
    className: "bg-stone-100 text-stone-500",
  },
};

// ── Props ───────────────────────────────────────────────

type Props = {
  company: ProductionCompany;
  currentUserRole: CompanyRole;
};

// ── Component ───────────────────────────────────────────

export function InvitationManagement({ company, currentUserRole }: Props) {
  const { data: invitations, isLoading } = useCompanyInvitations(company.id);
  const sendInvitation = useSendInvitation();
  const revokeInvitation = useRevokeInvitation();

  const [identifier, setIdentifier] = useState("");
  const [role, setRole] = useState<CompanyRole>("member");
  const [revokeTarget, setRevokeTarget] = useState<InvitationWithInviter | null>(null);

  const isAdmin = currentUserRole === "owner" || currentUserRole === "admin";

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier.trim()) return;

    sendInvitation.mutate(
      { companyId: company.id, identifier: identifier.trim(), role },
      { onSuccess: () => setIdentifier("") }
    );
  }

  function handleRevoke(invitation: InvitationWithInviter) {
    revokeInvitation.mutate(
      { invitationId: invitation.id, companyId: company.id },
      { onSuccess: () => setRevokeTarget(null) }
    );
  }

  // Separate pending from historical
  const pending = (invitations ?? []).filter((inv) => inv.status === "pending");
  const historical = (invitations ?? []).filter((inv) => inv.status !== "pending");

  // Roles the current user can assign via invitation
  const assignableRoles: CompanyRole[] =
    currentUserRole === "owner" ? ["admin", "member"] : ["member"];

  return (
    <div className="space-y-8">
      {/* ── Send invitation form ──────────────── */}
      {isAdmin && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <EnvelopeSimpleIcon className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Invite someone</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Invite by username or email address. If the person hasn't signed up
            yet, they'll be linked automatically when they create an account with
            that email.
          </p>

          <form onSubmit={handleSend} className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1 space-y-1">
              <Label htmlFor="invite-identifier" className="sr-only">
                Username or email
              </Label>
              <Input
                id="invite-identifier"
                placeholder="Username or email address"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={sendInvitation.isPending}
              />
            </div>

            <Select
              value={role}
              onValueChange={(v) => setRole(v as CompanyRole)}
            >
              <SelectTrigger className="w-full sm:w-32 cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {assignableRoles.map((r) => (
                  <SelectItem key={r} value={r} className="cursor-pointer">
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type="submit"
              disabled={sendInvitation.isPending || !identifier.trim()}
              className="gap-1.5 cursor-pointer"
            >
              {sendInvitation.isPending ? (
                <SpinnerGapIcon className="h-4 w-4 animate-spin" />
              ) : (
                <PaperPlaneTiltIcon className="h-4 w-4" />
              )}
              Invite
            </Button>
          </form>
        </section>
      )}

      {/* ── Pending invitations ──────────────── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Pending invitations</h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : pending.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            No pending invitations.
          </p>
        ) : (
          <div className="divide-y rounded-lg border">
            {pending.map((inv) => (
              <InvitationRow
                key={inv.id}
                invitation={inv}
                canRevoke={isAdmin}
                onRevoke={() => setRevokeTarget(inv)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Historical invitations ────────────── */}
      {historical.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Invitation history</h2>
          <div className="divide-y rounded-lg border">
            {historical.map((inv) => (
              <InvitationRow
                key={inv.id}
                invitation={inv}
                canRevoke={false}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Revoke confirmation dialog ────────── */}
      <AlertDialog
        open={!!revokeTarget}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              The invitation to{" "}
              <strong>
                {revokeTarget?.invitedUser?.display_name ??
                  revokeTarget?.invitedUser?.username ??
                  revokeTarget?.invited_email ??
                  "this person"}
              </strong>{" "}
              will be cancelled. They can be re-invited later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => revokeTarget && handleRevoke(revokeTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
            >
              {revokeInvitation.isPending ? "Revoking…" : "Revoke"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Row subcomponent ──────────────────────────────────────

function InvitationRow({
  invitation,
  canRevoke,
  onRevoke,
}: {
  invitation: InvitationWithInviter;
  canRevoke: boolean;
  onRevoke?: () => void;
}) {
  const statusInfo = STATUS_CONFIG[invitation.status];
  const displayName =
    invitation.invitedUser?.display_name ??
    invitation.invitedUser?.username ??
    invitation.invited_email ??
    "Unknown";

  const isExpired =
    invitation.status === "pending" &&
    new Date(invitation.expires_at) < new Date();

  const expiresAt = new Date(invitation.expires_at);
  const daysLeft = Math.max(
    0,
    Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{displayName}</p>
        <p className="text-xs text-muted-foreground">
          Invited as {invitation.role}
          {invitation.status === "pending" && !isExpired && (
            <> · expires in {daysLeft} day{daysLeft !== 1 && "s"}</>
          )}
          {isExpired && <> · expired</>}
        </p>
      </div>

      <Badge
        variant="secondary"
        className={`shrink-0 text-xs ${
          isExpired ? STATUS_CONFIG.expired.className : statusInfo.className
        }`}
      >
        {isExpired ? (
          <>
            <WarningCircleIcon className="mr-1 h-3 w-3" />
            Expired
          </>
        ) : (
          <>
            <statusInfo.icon className="mr-1 h-3 w-3" />
            {statusInfo.label}
          </>
        )}
      </Badge>

      {canRevoke && invitation.status === "pending" && !isExpired && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-muted-foreground hover:text-destructive cursor-pointer"
          onClick={onRevoke}
        >
          Revoke
        </Button>
      )}
    </div>
  );
}