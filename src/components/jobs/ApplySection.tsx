import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BriefcaseIcon,
  ClockIcon,
  CheckCircleIcon,
  SpinnerIcon,
  SignInIcon,
  PaperPlaneRightIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import {
  useMyApplication,
  useApplyToJob,
} from "@/hooks/useJobApplications";

// ── Props ─────────────────────────────────────────────────

type ApplySectionProps = {
  jobId: string;
  effectivelyClosed: boolean;
  isPastDeadline: boolean;
  deadline: string | null;
  productionInactive: boolean;
  productionStatusLabel: string;
  /** Is the current user the poster of this job? */
  isOwnJob: boolean;
};

// ── Status labels ─────────────────────────────────────────

const APPLICATION_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending review", color: "bg-blue-100 text-blue-800" },
  reviewed: { label: "Under review", color: "bg-amber-100 text-amber-800" },
  accepted: { label: "Accepted", color: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "Not selected", color: "bg-stone-100 text-stone-600" },
};

// ── Component ─────────────────────────────────────────────

export function ApplySection({
  jobId,
  effectivelyClosed,
  isPastDeadline,
  deadline,
  productionInactive,
  productionStatusLabel,
  isOwnJob,
}: ApplySectionProps) {
  const { user } = useAuth();
  const { data: myApplication, isLoading: checkingApplication } =
    useMyApplication(jobId);
  const applyMutation = useApplyToJob();

  const [coverMessage, setCoverMessage] = useState("");

  function handleSubmit() {
    if (!coverMessage.trim()) return;
    applyMutation.mutate({ jobId, coverMessage: coverMessage.trim() });
  }

  // ── Closed states ─────────────────────────────────────

  if (effectivelyClosed) {
    return (
      <div className="rounded-lg border border-dashed px-4 py-8 text-center">
        <BriefcaseIcon className="mx-auto h-8 w-8 text-muted-foreground/50" />
        <p className="mt-2 font-medium">This position is closed</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {productionInactive
            ? `The production has ${productionStatusLabel}. Applications are no longer being accepted.`
            : "Applications are no longer being accepted."}
        </p>
      </div>
    );
  }

  if (isPastDeadline) {
    return (
      <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 px-4 py-8 text-center">
        <ClockIcon className="mx-auto h-8 w-8 text-amber-500" />
        <p className="mt-2 font-medium text-amber-800">
          Application deadline has passed
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          The deadline was{" "}
          {new Date(deadline!).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          .
        </p>
      </div>
    );
  }

  // ── Own job ───────────────────────────────────────────

  if (isOwnJob) {
    return (
      <div className="rounded-lg border border-dashed px-4 py-8 text-center">
        <BriefcaseIcon className="mx-auto h-8 w-8 text-muted-foreground/50" />
        <p className="mt-2 font-medium">This is your job listing</p>
        <p className="mt-1 text-sm text-muted-foreground">
          You can view applicants below.
        </p>
      </div>
    );
  }

  // ── Not authenticated ─────────────────────────────────

  if (!user) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center">
        <h2 className="text-lg font-semibold">Apply for this role</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to submit your application.
        </p>
        <Button asChild className="mt-4 gap-2">
          <Link to="/auth">
            <SignInIcon className="h-4 w-4" />
            Sign in to apply
          </Link>
        </Button>
      </div>
    );
  }

  // ── Loading application status ────────────────────────

  if (checkingApplication) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <SpinnerIcon className="h-4 w-4 animate-spin" />
          Checking application status…
        </div>
      </div>
    );
  }

  // ── Already applied ───────────────────────────────────

  if (myApplication) {
    const statusMeta =
      APPLICATION_STATUS_LABELS[myApplication.status ?? "pending"] ??
      APPLICATION_STATUS_LABELS.pending;

    return (
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-start gap-3">
          <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div className="space-y-2">
            <div>
              <h2 className="text-lg font-semibold">Application submitted</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                You applied on{" "}
                {new Date(myApplication.created_at).toLocaleDateString(
                  "en-GB",
                  { day: "numeric", month: "long", year: "numeric" },
                )}
                .
              </p>
            </div>
            <Badge className={statusMeta.color}>{statusMeta.label}</Badge>
            {myApplication.cover_message && (
              <div className="mt-3 rounded-md bg-muted/50 p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Your cover message
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm">
                  {myApplication.cover_message}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Apply form ────────────────────────────────────────

  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="text-lg font-semibold">Apply for this role</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Write a short cover message to introduce yourself and explain why you're
        a good fit.
      </p>

      <div className="mt-4 space-y-3">
        <Textarea
          placeholder="Tell them about your experience, relevant skills, and why you're interested in this role…"
          value={coverMessage}
          onChange={(e) => setCoverMessage(e.target.value)}
          rows={5}
          maxLength={2000}
          disabled={applyMutation.isPending}
        />

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {coverMessage.length}/2000
          </span>

          <Button
            onClick={handleSubmit}
            disabled={!coverMessage.trim() || applyMutation.isPending}
            className="gap-2 cursor-pointer"
          >
            {applyMutation.isPending ? (
              <SpinnerIcon className="h-4 w-4 animate-spin" />
            ) : (
              <PaperPlaneRightIcon className="h-4 w-4" />
            )}
            Submit application
          </Button>
        </div>
      </div>
    </div>
  );
}