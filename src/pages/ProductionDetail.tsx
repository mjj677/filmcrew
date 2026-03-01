import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  MapPinIcon,
  CalendarIcon,
  BriefcaseIcon,
  CurrencyGbpIcon,
  FilmSlateIcon,
  PlusIcon,
  ArrowRightIcon,
  ClockIcon,
  GlobeIcon,
  EyeSlashIcon,
  EyeIcon,
  PencilSimpleIcon,
  SpinnerIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProductionDetail } from "@/hooks/useProductionDetail";
import { useTogglePublish } from "@/hooks/useProductions";
import type { JobPost } from "@/types/models";

// ── Config maps ───────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pre_production: { label: "Pre-production", className: "bg-yellow-100 text-yellow-800" },
  in_production: { label: "In production", className: "bg-green-100 text-green-800" },
  post_production: { label: "Post-production", className: "bg-blue-100 text-blue-800" },
  wrapped: { label: "Wrapped", className: "bg-stone-100 text-stone-700" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700" },
};

const TYPE_LABELS: Record<string, string> = {
  feature_film: "Feature Film",
  short_film: "Short Film",
  commercial: "Commercial",
  music_video: "Music Video",
  series: "Series",
  documentary: "Documentary",
  corporate: "Corporate",
  other: "Other",
};

const BUDGET_LABELS: Record<string, string> = {
  micro: "Micro budget",
  low: "Low budget",
  mid: "Mid budget",
  high: "High budget",
};

// ── Page ──────────────────────────────────────────────────

function ProductionDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, error } = useProductionDetail(slug);
  const togglePublish = useTogglePublish();

  if (isLoading) return <ProductionSkeleton />;

  if (error || !data) {
    return (
      <div className="py-20 text-center">
        <FilmSlateIcon className="mx-auto h-10 w-10 text-muted-foreground/50" />
        <h2 className="mt-3 text-lg font-semibold">Production not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This production doesn't exist or isn't published yet.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/home">Go home</Link>
        </Button>
      </div>
    );
  }

  const { production, company, jobs, role } = data;
  const isAdmin = role === "owner" || role === "admin";
  const status = STATUS_CONFIG[production.status] ?? STATUS_CONFIG.pre_production;
  const isActive = !["wrapped", "cancelled"].includes(production.status);

  function handleTogglePublish() {
    togglePublish.mutate({
      productionId: production.id,
      productionSlug: production.slug,
      companySlug: company.slug,
      publish: !production.is_published,
    });
  }

  return (
    <>
      <Helmet>
        <title>{production.title} | FilmCrew</title>
      </Helmet>

      <div className="space-y-8">
        {/* ── Draft banner ─────────────────────────────── */}
        {!production.is_published && isAdmin && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <div className="flex items-center gap-2">
              <EyeSlashIcon className="h-4 w-4 shrink-0" />
              <p>
                This production is a <strong>draft</strong> — only team members
                can see it.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 border-amber-400 bg-amber-100 text-amber-800 hover:bg-amber-200 cursor-pointer"
              onClick={handleTogglePublish}
              disabled={togglePublish.isPending}
            >
              {togglePublish.isPending ? (
                <SpinnerIcon className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <EyeIcon className="mr-1.5 h-3.5 w-3.5" />
              )}
              Publish now
            </Button>
          </div>
        )}

        {/* ── Header ───────────────────────────────────── */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {production.title}
              </h1>
              <Badge variant="secondary" className={status.className}>
                {status.label}
              </Badge>
            </div>

            {/* Company link */}
            <Link
              to={`/companies/${company.slug}/dashboard`}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Avatar className="h-6 w-6 rounded">
                <AvatarImage src={company.logo_url ?? undefined} />
                <AvatarFallback className="rounded text-xs">
                  {company.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {company.name}
            </Link>

            {production.description && (
              <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
                {production.description}
              </p>
            )}
          </div>

          {/* Admin actions */}
          {isAdmin && (
            <div className="flex shrink-0 gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to={`/productions/${production.slug}/edit`}>
                  <PencilSimpleIcon className="mr-1.5 h-4 w-4" />
                  Edit
                </Link>
              </Button>
              {production.is_published && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 cursor-pointer"
                  onClick={handleTogglePublish}
                  disabled={togglePublish.isPending}
                >
                  {togglePublish.isPending ? (
                    <SpinnerIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <EyeSlashIcon className="h-4 w-4" />
                  )}
                  Unpublish
                </Button>
              )}
              {isActive && (
                <Button asChild size="sm">
                  <Link to={`/productions/${production.slug}/jobs/new`}>
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Post a job
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>

        {/* ── Meta grid ────────────────────────────────── */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {production.production_type && (
            <MetaCard
              icon={FilmSlateIcon}
              label="Type"
              value={TYPE_LABELS[production.production_type] ?? production.production_type}
            />
          )}
          {(production.location || production.country) && (
            <MetaCard
              icon={MapPinIcon}
              label="Location"
              value={[production.location, production.country].filter(Boolean).join(", ")}
            />
          )}
          {production.start_date && (
            <MetaCard
              icon={CalendarIcon}
              label="Dates"
              value={formatDateRange(production.start_date, production.end_date)}
            />
          )}
          {production.budget_range && isAdmin && (
            <MetaCard
              icon={CurrencyGbpIcon}
              label="Budget"
              value={BUDGET_LABELS[production.budget_range] ?? production.budget_range}
            />
          )}
        </div>

        <Separator />

        {/* ── Job listings ─────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BriefcaseIcon className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">
                Open positions{" "}
                {jobs.length > 0 && (
                  <span className="font-normal text-muted-foreground">
                    ({jobs.length})
                  </span>
                )}
              </h2>
            </div>
          </div>

          {jobs.length === 0 ? (
            <div className="flex flex-col items-center rounded-lg border border-dashed py-10 text-center">
              <BriefcaseIcon className="h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 font-medium">No open positions</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {isAdmin && isActive
                  ? "Post your first job listing to start finding crew."
                  : isAdmin && !isActive
                    ? "This production is no longer active."
                    : "Check back later — new roles may be posted soon."}
              </p>
              {isAdmin && isActive && (
                <Button asChild size="sm" className="mt-4">
                  <Link to={`/productions/${production.slug}/jobs/new`}>
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Post a job
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <JobRow key={job.id} job={job} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────

function MetaCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FilmSlateIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function JobRow({ job }: { job: JobPost }) {
  return (
    <Link
      to={`/jobs/${job.id}`}
      className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{job.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPinIcon className="h-3 w-3" />
              {job.location}
            </span>
          )}
          {job.is_remote && (
            <span className="flex items-center gap-1">
              <GlobeIcon className="h-3 w-3" />
              Remote
            </span>
          )}
          {job.type && (
            <span className="flex items-center gap-1">
              <BriefcaseIcon className="h-3 w-3" />
              {job.type}
            </span>
          )}
          {job.compensation && (
            <span className="flex items-center gap-1">
              <CurrencyGbpIcon className="h-3 w-3" />
              {job.compensation}
            </span>
          )}
          {job.deadline && (
            <span className="flex items-center gap-1">
              <ClockIcon className="h-3 w-3" />
              Apply by{" "}
              {new Date(job.deadline).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              })}
            </span>
          )}
        </div>
      </div>
      <ArrowRightIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

// ── Helpers ───────────────────────────────────────────────

function formatDateRange(
  start: string,
  end: string | null
): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  if (!end) return `From ${fmt(start)}`;
  return `${fmt(start)} – ${fmt(end)}`;
}

// ── Skeleton ──────────────────────────────────────────────

function ProductionSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-16 w-full max-w-2xl" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
      <Separator />
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
      </div>
    </div>
  );
}

export default ProductionDetail;