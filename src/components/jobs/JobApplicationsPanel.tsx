import { Link } from "react-router-dom";
import {
  UsersIcon,
  SpinnerIcon,
  CaretDownIcon,
} from "@phosphor-icons/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useJobApplicants,
  useUpdateApplicationStatus,
  type ApplicationWithApplicant,
} from "@/hooks/useJobApplications";

// ── Constants ─────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "reviewed", label: "Reviewed" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
] as const;

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-blue-100 text-blue-800",
  reviewed: "bg-amber-100 text-amber-800",
  accepted: "bg-emerald-100 text-emerald-800",
  rejected: "bg-stone-100 text-stone-600",
};

// ── Props ─────────────────────────────────────────────────

type Props = {
  jobId: string;
};

// ── Component ─────────────────────────────────────────────

export function JobApplicationsPanel({ jobId }: Props) {
  const { data: applicants, isLoading } = useJobApplicants(jobId);
  const updateStatus = useUpdateApplicationStatus();

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <SpinnerIcon className="h-4 w-4 animate-spin" />
          Loading applicants…
        </div>
      </div>
    );
  }

  const list = applicants ?? [];

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between p-4 pb-0">
        <div className="flex items-center gap-2">
          <UsersIcon className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">
            Applicants{" "}
            <span className="text-base font-normal text-muted-foreground">
              ({list.length})
            </span>
          </h2>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            No applications yet. They'll appear here once candidates apply.
          </p>
        </div>
      ) : (
        <div className="divide-y">
          {list.map((app) => (
            <ApplicantRow
              key={app.id}
              application={app}
              jobId={jobId}
              onStatusChange={(status) =>
                updateStatus.mutate({
                  applicationId: app.id,
                  status,
                  jobId,
                })
              }
              isUpdating={
                updateStatus.isPending &&
                updateStatus.variables?.applicationId === app.id
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Applicant row ─────────────────────────────────────────

function ApplicantRow({
  application,
  onStatusChange,
  isUpdating,
}: {
  application: ApplicationWithApplicant;
  jobId: string;
  onStatusChange: (status: string) => void;
  isUpdating: boolean;
}) {
  const { applicant } = application;
  const statusColor = STATUS_COLORS[application.status ?? "pending"] ?? STATUS_COLORS.pending;
  const currentStatus = application.status ?? "pending";

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <Link
          to={`/crew/${applicant.username}`}
          className="flex items-center gap-3 transition-colors hover:opacity-80"
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={applicant.profile_image_url ?? undefined} />
            <AvatarFallback>
              {(applicant.display_name ?? applicant.username ?? "?")
                .charAt(0)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">
              {applicant.display_name ?? applicant.username}
            </p>
            <p className="text-xs text-muted-foreground">
              {applicant.position ? (
                <>
                  {applicant.position}{" "}
                  <span className="text-muted-foreground/50">·</span>{" "}
                </>
              ) : null}
              @{applicant.username}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <SpinnerIcon className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Badge className={`${statusColor} pointer-events-none`}>
                    {STATUS_OPTIONS.find((s) => s.value === currentStatus)
                      ?.label ?? currentStatus}
                  </Badge>
                )}
                <CaretDownIcon className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {STATUS_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => onStatusChange(opt.value)}
                  disabled={opt.value === currentStatus}
                  className="cursor-pointer"
                >
                  <Badge className={`${STATUS_COLORS[opt.value]} mr-2`}>
                    {opt.label}
                  </Badge>
                  {opt.value === currentStatus && (
                    <span className="text-xs text-muted-foreground">
                      (current)
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {application.cover_message && (
        <div className="ml-13 rounded-md bg-muted/50 p-3">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {application.cover_message}
          </p>
        </div>
      )}

      <p className="ml-13 text-xs text-muted-foreground">
        Applied{" "}
        {new Date(application.created_at).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </p>
    </div>
  );
}