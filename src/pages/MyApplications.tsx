import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  BriefcaseIcon,
  FilmSlateIcon,
} from "@phosphor-icons/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useMyApplications,
  type MyApplicationWithJob,
} from "@/hooks/useJobApplications";

// ── Status config ─────────────────────────────────────────

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending review", color: "bg-blue-100 text-blue-800" },
  reviewed: { label: "Under review", color: "bg-amber-100 text-amber-800" },
  accepted: { label: "Accepted", color: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "Not selected", color: "bg-stone-100 text-stone-600" },
};

// ── Page ──────────────────────────────────────────────────

function MyApplications() {
  const { data: applications, isLoading } = useMyApplications();

  return (
    <>
      <Helmet>
        <title>My Applications | FilmCrew</title>
      </Helmet>

      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            My applications
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track the status of jobs you've applied to.
          </p>
        </div>

        {isLoading ? (
          <ApplicationsSkeleton />
        ) : !applications || applications.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <ApplicationCard key={app.id} application={app} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ── Application card ──────────────────────────────────────

function ApplicationCard({
  application,
}: {
  application: MyApplicationWithJob;
}) {
  const { job } = application;
  const statusMeta =
    STATUS_META[application.status ?? "pending"] ?? STATUS_META.pending;
  const isJobClosed = !job.is_active;

  return (
    <Link to={`/jobs/${job.id}`} className="group block">
      <Card className="transition-colors group-hover:border-foreground/20 group-hover:bg-accent/50">
        <CardContent className="flex items-start gap-4 p-4">
          {/* Company avatar */}
          {job.company ? (
            <Avatar className="h-10 w-10 shrink-0 rounded">
              <AvatarImage src={job.company.logo_url ?? undefined} />
              <AvatarFallback className="rounded text-sm">
                {job.company.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-muted">
              <BriefcaseIcon className="h-5 w-5 text-muted-foreground" />
            </div>
          )}

          {/* Content */}
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{job.title}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  {job.company && <span>{job.company.name}</span>}
                  {job.company && job.production && (
                    <span className="text-muted-foreground/40">·</span>
                  )}
                  {job.production && (
                    <span className="inline-flex items-center gap-1">
                      <FilmSlateIcon className="h-3 w-3" />
                      {job.production.title}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {isJobClosed && (
                  <Badge
                    variant="outline"
                    className="border-stone-300 text-stone-500"
                  >
                    Closed
                  </Badge>
                )}
                <Badge className={statusMeta.color}>{statusMeta.label}</Badge>
              </div>
            </div>

            {/* Cover message preview */}
            {application.cover_message && (
              <p className="line-clamp-2 text-xs text-muted-foreground">
                {application.cover_message}
              </p>
            )}

            <p className="text-xs text-muted-foreground/70">
              Applied{" "}
              {new Date(application.created_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ── Empty state ───────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <BriefcaseIcon className="h-10 w-10 text-muted-foreground/50" />
      <p className="mt-3 font-medium">No applications yet</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        When you apply to jobs, they'll appear here so you can track their
        status.
      </p>
      <Link
        to="/jobs"
        className="mt-4 text-sm font-medium underline underline-offset-4 hover:text-foreground"
      >
        Browse jobs
      </Link>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────

function ApplicationsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="flex items-start gap-4 p-4">
            <Skeleton className="h-10 w-10 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-full" />
            </div>
            <Skeleton className="h-5 w-24 rounded-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default MyApplications;