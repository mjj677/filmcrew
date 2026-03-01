import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  BriefcaseIcon,
  MapPinIcon,
  GlobeIcon,
  CurrencyGbpIcon,
  UserIcon,
  FilmSlateIcon,
  ArrowLeftIcon,
  CalendarIcon,
  BuildingsIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useJobDetail, isJobEffectivelyClosed } from "@/hooks/useJobs";
import { useAuth } from "@/context/AuthContext";
import { ApplySection } from "@/components/jobs/ApplySection";
import { JobApplicationsPanel } from "@/components/jobs/JobApplicationsPanel";

// ── Label maps ────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  freelance: "Freelance",
  daily_rate: "Daily rate",
};

const EXPERIENCE_LABELS: Record<string, string> = {
  entry: "Entry level",
  mid: "Mid level",
  senior: "Senior",
  lead: "Lead / Head of Dept",
  any: "Any experience",
};

const STATUS_LABELS: Record<string, string> = {
  wrapped: "wrapped",
  cancelled: "cancelled",
};

// ── Page ──────────────────────────────────────────────────

function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: job, isLoading, error } = useJobDetail(id);
  const { user } = useAuth();

  if (isLoading) return <JobSkeleton />;

  if (error || !job) {
    return (
      <div className="py-20 text-center">
        <BriefcaseIcon className="mx-auto h-10 w-10 text-muted-foreground/50" />
        <h2 className="mt-3 text-lg font-semibold">Job not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This job listing doesn't exist or has been removed.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/jobs">Browse jobs</Link>
        </Button>
      </div>
    );
  }

  const isPastDeadline = job.deadline
    ? new Date(job.deadline) < new Date()
    : false;

  const effectivelyClosed = isJobEffectivelyClosed(job);
  const productionInactive =
    job.production?.status === "wrapped" || job.production?.status === "cancelled";
  const productionStatusLabel = job.production?.status
    ? STATUS_LABELS[job.production.status] ?? job.production.status
    : "";

  const isOwnJob = !!user && job.posted_by === user.id;
  const isCompanyAdmin =
    job.companyRole === "owner" || job.companyRole === "admin";
  const canManageApplicants = isOwnJob || isCompanyAdmin;

  return (
    <>
      <Helmet>
        <title>{job.title} | FilmCrew</title>
      </Helmet>

      <div className="mx-auto max-w-3xl space-y-8">
        {/* ── Back link ─────────────────────────────────── */}
        {job.production && (
          <Link
            to={`/productions/${job.production.slug}`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            {job.production.title}
          </Link>
        )}

        {/* ── Production inactive banner ────────────────── */}
        {productionInactive && (
          <div className="flex items-center gap-2 rounded-lg border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-700">
            <WarningCircleIcon className="h-4 w-4 shrink-0" />
            <p>
              This production has {productionStatusLabel}. This position is no
              longer accepting applications.
            </p>
          </div>
        )}

        {/* ── Header ────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {job.title}
              </h1>

              {/* Production & company context */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {job.company && (
                  <Link
                    to={`/companies/${job.company.slug}`}
                    className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                  >
                    <Avatar className="h-5 w-5 rounded">
                      <AvatarImage src={job.company.logo_url ?? undefined} />
                      <AvatarFallback className="rounded text-[10px]">
                        {job.company.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {job.company.name}
                  </Link>
                )}
                {job.production && (
                  <>
                    <span className="text-muted-foreground/40">·</span>
                    <Link
                      to={`/productions/${job.production.slug}`}
                      className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                    >
                      <FilmSlateIcon className="h-4 w-4" />
                      {job.production.title}
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Apply CTA */}
            <div className="shrink-0">
              {effectivelyClosed ? (
                <Badge variant="secondary" className="bg-stone-100 text-stone-600">
                  Closed
                </Badge>
              ) : isPastDeadline ? (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                  Deadline passed
                </Badge>
              ) : canManageApplicants ? (
                <Badge variant="secondary">
                  {isOwnJob ? "Your listing" : "Team listing"}
                </Badge>
              ) : (
                <Button size="lg" asChild>
                  <a href="#apply">Apply now</a>
                </Button>
              )}
            </div>
          </div>

          {/* ── Meta badges ────────────────────────────── */}
          <div className="flex flex-wrap gap-2">
            {job.type && (
              <Badge variant="outline" className="gap-1.5 font-normal">
                <BriefcaseIcon className="h-3 w-3" />
                {TYPE_LABELS[job.type] ?? job.type}
              </Badge>
            )}
            {job.experience_level && (
              <Badge variant="outline" className="gap-1.5 font-normal">
                <UserIcon className="h-3 w-3" />
                {EXPERIENCE_LABELS[job.experience_level] ?? job.experience_level}
              </Badge>
            )}
            {job.category && (
              <Badge variant="outline" className="gap-1.5 font-normal">
                <BuildingsIcon className="h-3 w-3" />
                {job.category}
              </Badge>
            )}
            {job.location && (
              <Badge variant="outline" className="gap-1.5 font-normal">
                <MapPinIcon className="h-3 w-3" />
                {job.location}
              </Badge>
            )}
            {job.is_remote && (
              <Badge variant="outline" className="gap-1.5 font-normal">
                <GlobeIcon className="h-3 w-3" />
                Remote
              </Badge>
            )}
            {job.compensation && (
              <Badge variant="outline" className="gap-1.5 font-normal">
                <CurrencyGbpIcon className="h-3 w-3" />
                {job.compensation}
              </Badge>
            )}
            {job.deadline && (
              <Badge
                variant="outline"
                className={`gap-1.5 font-normal ${
                  isPastDeadline ? "border-amber-300 text-amber-700" : ""
                }`}
              >
                <CalendarIcon className="h-3 w-3" />
                {isPastDeadline ? "Deadline passed: " : "Apply by "}
                {new Date(job.deadline).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </Badge>
            )}
          </div>
        </div>

        <Separator />

        {/* ── Description ───────────────────────────────── */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">About this role</h2>
          <div className="prose prose-sm prose-stone max-w-none whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {job.description}
          </div>
        </section>

        {/* ── Posted by ─────────────────────────────────── */}
        {job.poster && (
          <>
            <Separator />
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">
                Posted by
              </h2>
              <Link
                to={`/crew/${job.poster.username}`}
                className="inline-flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={job.poster.profile_image_url ?? undefined} />
                  <AvatarFallback>
                    {(job.poster.display_name ?? job.poster.username ?? "?")
                      .charAt(0)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {job.poster.display_name ?? job.poster.username}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    @{job.poster.username}
                  </p>
                </div>
              </Link>
            </section>
          </>
        )}

        <Separator />

        {/* ── Apply section ─────────────────────────────── */}
        <section id="apply" className="scroll-mt-20">
          <ApplySection
            jobId={job.id}
            effectivelyClosed={effectivelyClosed}
            isPastDeadline={isPastDeadline}
            deadline={job.deadline}
            productionInactive={productionInactive}
            productionStatusLabel={productionStatusLabel}
            canManage={canManageApplicants}
          />
        </section>

        {/* ── Applicants panel (poster + company admins) ── */}
        {canManageApplicants && (
          <>
            <Separator />
            <JobApplicationsPanel jobId={job.id} />
          </>
        )}

        {/* ── Footer meta ───────────────────────────────── */}
        <p className="text-xs text-muted-foreground">
          Posted{" "}
          {new Date(job.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          {job.updated_at !== job.created_at && (
            <>
              {" · Updated "}
              {new Date(job.updated_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </>
          )}
        </p>
      </div>
    </>
  );
}

// ── Skeleton ──────────────────────────────────────────────

function JobSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Skeleton className="h-5 w-40" />
      <div className="space-y-3">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-5 w-56" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-24 rounded-full" />
          ))}
        </div>
      </div>
      <Separator />
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
    </div>
  );
}

export default JobDetail;