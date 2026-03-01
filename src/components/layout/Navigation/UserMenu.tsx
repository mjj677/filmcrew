import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useUserCompanies } from "@/hooks/useCompanies";
import { useMyInvitations, useAcceptInvitation, useDeclineInvitation } from "@/hooks/useMyInvitations";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CaretDownIcon,
  UserIcon,
  PlusIcon,
  SignOutIcon,
  BriefcaseIcon,
  SpinnerGapIcon,
  CheckIcon,
  XIcon,
  EnvelopeSimpleIcon,
} from "@phosphor-icons/react";
import type { PendingInvitation } from "@/hooks/useMyInvitations";

// ── Invitation row ────────────────────────────────────────

function InvitationRow({ invitation }: { invitation: PendingInvitation }) {
  const accept = useAcceptInvitation();
  const decline = useDeclineInvitation();
  const isActing = accept.isPending || decline.isPending;

  const companyInitial = invitation.company.name.charAt(0).toUpperCase();
  const inviterName =
    invitation.inviter?.display_name ?? invitation.inviter?.username ?? "Someone";

  return (
    <div className="space-y-2 px-2 py-2">
      <div className="flex items-start gap-2">
        <Avatar className="mt-0.5 h-7 w-7 shrink-0 rounded">
          <AvatarImage
            src={invitation.company.logo_url ?? undefined}
            alt={invitation.company.name}
          />
          <AvatarFallback className="rounded text-[10px] font-semibold">
            {companyInitial}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-tight">
            {invitation.company.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {inviterName} invited you as{" "}
            <span className="capitalize">{invitation.role}</span>
          </p>
        </div>
      </div>
      <div className="flex gap-1.5">
        <Button
          size="sm"
          className="h-7 flex-1 cursor-pointer text-xs"
          disabled={isActing}
          onClick={(e) => {
            e.preventDefault();
            accept.mutate(invitation.id);
          }}
        >
          {accept.isPending ? (
            <SpinnerGapIcon className="h-3 w-3 animate-spin" />
          ) : (
            <CheckIcon className="h-3 w-3" />
          )}
          Accept
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 flex-1 cursor-pointer text-xs"
          disabled={isActing}
          onClick={(e) => {
            e.preventDefault();
            decline.mutate(invitation.id);
          }}
        >
          {decline.isPending ? (
            <SpinnerGapIcon className="h-3 w-3 animate-spin" />
          ) : (
            <XIcon className="h-3 w-3" />
          )}
          Decline
        </Button>
      </div>
    </div>
  );
}

// ── UserMenu ──────────────────────────────────────────────

export function UserMenu() {
  const { session, signOut, isLoading: isAuthLoading } = useAuth();
  const { profile, isLoading: isProfileLoading } = useProfile();
  const { companies } = useUserCompanies();
  const { data: invitations } = useMyInvitations();

  if (isAuthLoading || (session && isProfileLoading)) return null;

  if (!session) {
    return (
      <Button asChild variant="default" size="sm" className="ml-1">
        <Link to="/auth">Sign in</Link>
      </Button>
    );
  }

  const initials =
    profile?.display_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "?";

  const pendingCount = invitations?.length ?? 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative ml-1 flex cursor-pointer items-center outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.profile_image_url ?? undefined} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <CaretDownIcon
            size={10}
            weight="bold"
            className="absolute -bottom-0.5 right-0 rounded-full bg-background text-muted-foreground"
          />
          {/* Invitation badge — dot only, keeps the avatar clean */}
          {pendingCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-foreground" />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        {/* ── Personal account ─────────────────────────── */}
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{profile?.display_name}</p>
          <p className="text-xs text-muted-foreground">@{profile?.username}</p>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild className="cursor-pointer">
          <Link to="/profile">
            <UserIcon className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="cursor-pointer">
          <Link to="/applications">
            <BriefcaseIcon className="mr-2 h-4 w-4" />
            My applications
          </Link>
        </DropdownMenuItem>

        {/* ── Pending invitations ───────────────────────── */}
        {pendingCount > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="flex items-center gap-1.5">
              <EnvelopeSimpleIcon className="h-3.5 w-3.5" />
              Invitations
              <span className="ml-auto rounded-full bg-foreground px-1.5 py-0.5 text-[10px] font-semibold text-background">
                {pendingCount}
              </span>
            </DropdownMenuLabel>
            {invitations!.map((inv) => (
              <InvitationRow key={inv.id} invitation={inv} />
            ))}
          </>
        )}

        {/* ── Companies ────────────────────────────────── */}
        {companies.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Your companies</DropdownMenuLabel>
            {companies.map((c) => (
              <DropdownMenuItem key={c.id} asChild className="cursor-pointer">
                <Link
                  to={`/companies/${c.slug}/dashboard`}
                  className="flex items-center gap-2"
                >
                  <Avatar className="h-6 w-6 rounded">
                    <AvatarImage src={c.logo_url ?? undefined} />
                    <AvatarFallback className="rounded text-[10px]">
                      {c.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{c.name}</p>
                  </div>
                  {c.role === "owner" && (
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      Owner
                    </span>
                  )}
                </Link>
              </DropdownMenuItem>
            ))}
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild className="cursor-pointer">
          <Link to="/companies/new">
            <PlusIcon className="mr-2 h-4 w-4" />
            Create company
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer">
          <SignOutIcon className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}