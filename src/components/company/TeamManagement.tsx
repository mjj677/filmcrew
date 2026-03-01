import { useState } from "react";
import { Link } from "react-router-dom";
import {
  CrownIcon,
  ShieldCheckIcon,
  UserIcon,
  DotsThreeIcon,
  TrashIcon,
  ArrowsClockwiseIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useAuth } from "@/context/AuthContext";
import { useUpdateMemberRole, useRemoveMember } from "@/hooks/useCompanies";
import type { CompanyMemberWithProfile } from "@/hooks/useCompanyDetail";
import type { ProductionCompany, CompanyRole } from "@/types/models";

// ── Config ────────────────────────────────────────────────

const ROLE_CONFIG: Record<
  CompanyRole,
  { label: string; icon: typeof CrownIcon; className: string }
> = {
  owner: {
    label: "Owner",
    icon: CrownIcon,
    className: "bg-amber-100 text-amber-800",
  },
  admin: {
    label: "Admin",
    icon: ShieldCheckIcon,
    className: "bg-blue-100 text-blue-800",
  },
  member: {
    label: "Member",
    icon: UserIcon,
    className: "bg-stone-100 text-stone-700",
  },
};

type Props = {
  company: ProductionCompany;
  members: CompanyMemberWithProfile[];
  currentUserRole: CompanyRole;
};

export function TeamManagement({ company, members, currentUserRole }: Props) {
  const { user } = useAuth();
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();

  const [confirmRemove, setConfirmRemove] = useState<CompanyMemberWithProfile | null>(null);

  const isOwner = currentUserRole === "owner";
  const isAdmin = currentUserRole === "owner" || currentUserRole === "admin";

  // Sort: owner first, then admin, then member
  const sorted = [...members].sort((a, b) => {
    const order: Record<CompanyRole, number> = { owner: 0, admin: 1, member: 2 };
    return order[a.role] - order[b.role];
  });

  function canEditMember(member: CompanyMemberWithProfile): boolean {
    if (!isAdmin) return false;
    // Can't edit yourself
    if (member.profile.id === user?.id) return false;
    // Admins can't edit owners or other admins
    if (currentUserRole === "admin" && member.role !== "member") return false;
    return true;
  }

  function canRemoveMember(member: CompanyMemberWithProfile): boolean {
    // Owners can never be removed (must transfer first)
    if (member.role === "owner") return false;
    // You can remove yourself (leave) unless you're the owner
    if (member.profile.id === user?.id && currentUserRole !== "owner") return true;
    // Otherwise same as canEdit
    return canEditMember(member);
  }

  function handleRoleChange(member: CompanyMemberWithProfile, newRole: CompanyRole) {
    updateRole.mutate({
      memberId: member.id,
      role: newRole,
      companySlug: company.slug,
    });
  }

  function handleRemove(member: CompanyMemberWithProfile) {
    removeMember.mutate(
      { memberId: member.id, companySlug: company.slug },
      { onSuccess: () => setConfirmRemove(null) }
    );
  }

  // Roles this user can assign to others
  function assignableRoles(): CompanyRole[] {
    if (isOwner) return ["admin", "member"];
    return ["member"];
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Team members</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {members.length} member{members.length !== 1 && "s"} in {company.name}.
        </p>
      </div>

      <div className="divide-y rounded-lg border">
        {sorted.map((member) => {
          const { profile } = member;
          const roleInfo = ROLE_CONFIG[member.role];
          const isSelf = profile.id === user?.id;
          const editable = canEditMember(member);
          const removable = canRemoveMember(member);

          const initials =
            profile.display_name
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase() ?? "?";

          return (
            <div
              key={member.id}
              className="flex items-center gap-3 px-4 py-3"
            >
              <Link to={`/crew/${profile.username}`}>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile.profile_image_url ?? undefined} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </Link>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    to={`/crew/${profile.username}`}
                    className="truncate text-sm font-medium hover:underline"
                  >
                    {profile.display_name ?? profile.username}
                  </Link>
                  {isSelf && (
                    <span className="text-xs text-muted-foreground">(you)</span>
                  )}
                </div>
                {profile.position && (
                  <p className="truncate text-xs text-muted-foreground">
                    {profile.position}
                  </p>
                )}
              </div>

              <Badge
                variant="secondary"
                className={`shrink-0 text-xs ${roleInfo.className}`}
              >
                <roleInfo.icon className="mr-1 h-3 w-3" weight="fill" />
                {roleInfo.label}
              </Badge>

              {/* Actions menu — only show if we can do something */}
              {(editable || removable) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild className="cursor-pointer">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <DotsThreeIcon className="h-4 w-4" weight="bold" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {editable && (
                      <>
                        {assignableRoles()
                          .filter((r) => r !== member.role)
                          .map((r) => (
                            <DropdownMenuItem
                              key={r}
                              onClick={() => handleRoleChange(member, r)}
                            className="cursor-pointer"
                            >
                              <ArrowsClockwiseIcon className="mr-2 h-4 w-4" />
                              Change to {ROLE_CONFIG[r].label}
                            </DropdownMenuItem>
                          ))}
                        {removable && <DropdownMenuSeparator />}
                      </>
                    )}
                    {removable && (
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setConfirmRemove(member)}
                        className="cursor-pointer"
                      >
                        <TrashIcon className="mr-2 h-4 w-4" />
                        {isSelf ? "Leave company" : "Remove"}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Remove confirmation dialog ─────────────────── */}
      <AlertDialog
        open={!!confirmRemove}
        onOpenChange={(open) => !open && setConfirmRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmRemove?.profile.id === user?.id
                ? "Leave company?"
                : "Remove team member?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmRemove?.profile.id === user?.id ? (
                <>
                  You'll lose access to {company.name}'s dashboard, productions,
                  and job listings. You can be re-invited later.
                </>
              ) : (
                <>
                  <strong>
                    {confirmRemove?.profile.display_name ??
                      confirmRemove?.profile.username}
                  </strong>{" "}
                  will lose access to {company.name}. They can be re-invited
                  later.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmRemove && handleRemove(confirmRemove)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
            >
              {removeMember.isPending ? "Removing…" : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}