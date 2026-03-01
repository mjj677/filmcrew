import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  WarningIcon,
  CrownIcon,
  TrashIcon,
  SpinnerGapIcon,
} from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { companyKeys } from "@/hooks/useCompanies";
import type { ProductionCompany, CompanyRole } from "@/types/models";
import type { CompanyMemberWithProfile } from "@/hooks/useCompanyDetail";

// ── Mutations ─────────────────────────────────────────────

function useTransferOwnership() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      companyId,
      newOwnerId,
      companySlug,
    }: {
      companyId: string;
      newOwnerId: string;
      companySlug: string;
    }) => {
      const { error } = await supabase.rpc("transfer_company_ownership", {
        p_company_id: companyId,
        p_new_owner_id: newOwnerId,
      });

      if (error) throw new Error(error.message);
      return { companySlug };
    },
    onSuccess: ({ companySlug }) => {
      queryClient.invalidateQueries({
        queryKey: companyKeys.detail(companySlug),
      });
      toast.success("Ownership transferred");
    },
    onError: (error: Error) => {
      toast.error("Failed to transfer ownership", {
        description: error.message,
      });
    },
  });
}

function useDeleteCompany() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async ({
      companyId,
      companySlug,
    }: {
      companyId: string;
      companySlug: string;
    }) => {
      // Soft delete — set deleted_at
      const { error } = await supabase
        .from("production_companies")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", companyId);

      if (error) throw new Error(error.message);
      return { companySlug };
    },
    onSuccess: () => {
      // Invalidate user companies so context switcher updates
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: companyKeys.userCompanies(user.id),
        });
      }
      toast.success("Company deleted");
      navigate("/home");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete company", {
        description: error.message,
      });
    },
  });
}

// ── Props ─────────────────────────────────────────────────

type Props = {
  company: ProductionCompany;
  members: CompanyMemberWithProfile[];
  currentUserRole: CompanyRole;
};

// ── Component ─────────────────────────────────────────────

export function DangerZone({ company, members, currentUserRole }: Props) {
  const { user } = useAuth();
  const transferOwnership = useTransferOwnership();
  const deleteCompany = useDeleteCompany();

  const isOwner = currentUserRole === "owner";

  // Transfer state
  const [showTransfer, setShowTransfer] = useState(false);
  const [newOwnerId, setNewOwnerId] = useState("");

  // Delete state
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  // Get eligible transfer targets (non-owner members)
  const transferCandidates = members.filter(
    (m) => m.role !== "owner" && m.profile.id !== user?.id
  );

  function handleTransfer() {
    if (!newOwnerId) return;
    transferOwnership.mutate(
      { companyId: company.id, newOwnerId, companySlug: company.slug },
      {
        onSuccess: () => {
          setShowTransfer(false);
          setNewOwnerId("");
        },
      }
    );
  }

  function handleDelete() {
    deleteCompany.mutate({
      companyId: company.id,
      companySlug: company.slug,
    });
  }

  if (!isOwner) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <WarningIcon className="h-5 w-5 text-destructive" />
        <h2 className="text-lg font-semibold text-destructive">Danger zone</h2>
      </div>

      <div className="divide-y rounded-lg border border-destructive/30">
        {/* ── Transfer ownership ────────────────── */}
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Transfer ownership</p>
            <p className="text-sm text-muted-foreground">
              Transfer this company to another team member. You'll be demoted to
              admin.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setShowTransfer(true)}
            disabled={transferCandidates.length === 0}
          >
            <CrownIcon className="mr-1.5 h-4 w-4" />
            Transfer
          </Button>
        </div>

        {/* ── Delete company ────────────────────── */}
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Delete company</p>
            <p className="text-sm text-muted-foreground">
              Permanently remove this company and all its data. This action
              cannot be undone.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            className="shrink-0 cursor-pointer"
            onClick={() => setShowDelete(true)}
          >
            <TrashIcon className="mr-1.5 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {transferCandidates.length === 0 && (
        <p className="text-xs text-muted-foreground">
          You need at least one other team member to transfer ownership.
        </p>
      )}

      {/* ── Transfer dialog ───────────────────── */}
      <AlertDialog
        open={showTransfer}
        onOpenChange={(open) => {
          if (!open) {
            setShowTransfer(false);
            setNewOwnerId("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transfer ownership</AlertDialogTitle>
            <AlertDialogDescription>
              Choose a team member to become the new owner of{" "}
              <strong>{company.name}</strong>. Your role will be changed to
              admin. This action is immediate and can only be reversed by the new
              owner.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="new-owner-select">New owner</Label>
            <Select value={newOwnerId} onValueChange={setNewOwnerId}>
              <SelectTrigger id="new-owner-select">
                <SelectValue placeholder="Select a team member" />
              </SelectTrigger>
              <SelectContent>
                {transferCandidates.map((m) => (
                  <SelectItem key={m.profile.id} value={m.profile.id}>
                    {m.profile.display_name ?? m.profile.username}{" "}
                    <span className="text-muted-foreground">
                      ({m.role})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <AlertDialogFooter className="cursor-pointer">
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTransfer}
              disabled={!newOwnerId || transferOwnership.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {transferOwnership.isPending ? (
                <>
                  <SpinnerGapIcon className="mr-2 h-4 w-4 animate-spin" />
                  Transferring…
                </>
              ) : (
                "Transfer ownership"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Delete dialog ─────────────────────── */}
      <AlertDialog
        open={showDelete}
        onOpenChange={(open) => {
          if (!open) {
            setShowDelete(false);
            setDeleteConfirmation("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {company.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the company, all productions, job
              listings, and team memberships. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="delete-confirm">
              Type <strong>{company.slug}</strong> to confirm
            </Label>
            <Input
              id="delete-confirm"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder={company.slug}
              autoComplete="off"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={
                deleteConfirmation !== company.slug || deleteCompany.isPending
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
            >
              {deleteCompany.isPending ? (
                <>
                  <SpinnerGapIcon className="mr-2 h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete company"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}