import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  MapPinIcon,
  GlobeIcon,
  UsersIcon,
  FilmSlateIcon,
  BriefcaseIcon,
  ArrowRightIcon,
  CrownIcon,
  ShieldCheckIcon,
  UserIcon,
  GearIcon,
  BuildingsIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCompanyProfile, type PublicMember, type PublicProductionWithJobs } from "@/hooks/useCompanyProfile";
import type { CompanyRole } from "@/types/models";

// ── Config maps ───────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pre_production: { label: "Pre-production", className: "bg-yellow-100 text-yellow-800" },
  in_production: { label: "In production", className: "bg-green-100 text-green-800" },
  post_production: { label: "Post-production", className: "bg-blue-100 text-blue-800" },
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

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  freelance: "Freelance",
  daily_rate: "Daily rate",
};

const ROLE_CONFIG: Record<CompanyRole, { label: string; Icon: typeof CrownIcon }> = {
  owner: { label: "Owner", Icon: CrownIcon },
  admin: { label: "Admin", Icon: ShieldCheckIcon },
  member: { label: "Member", Icon: UserIcon },
};

// ── Sub-components ────────────────────────────────────────

function ProductionSection({ production }: { production: PublicProductionWithJobs }) {
  const statusCfg = STATUS_CONFIG[production.status];
  const openJobs = production.jobs;

  return (
    <div className="rounded-xl border bg-card">
      {/* Production header */}
      <div className="flex items-start justify-between gap-3 p-5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold leading-tight">{production.title}</h3>
            {statusCfg && (
              <Badge className={`text-xs ${statusCfg.className}`} variant="secondary">
                {statusCfg.label}
              </Badge>
            )}
          </div>
          {production.production_type && (
            <p className="text-xs text-muted-foreground">
              {TYPE_LABELS[production.production_type] ?? production.production_type}
              {production.location || production.country
                ? ` · ${[production.location, production.country].filter(Boolean).join(", ")}`
                : ""}
            </p>
          )}
        </div>
        <Button asChild variant="ghost" size="sm" className="shrink-0 text-xs">
          <Link to={`/productions/${production.slug}`}>
            View
            <ArrowRightIcon className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {/* Jobs */}
      {openJobs.length > 0 && (
        <>
          <Separator />
          <div className="divide-y">
            {openJobs.map((job) => (
              <Link
                key={job.id}
                to={`/jobs/${job.id}`}
                className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-accent/50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{job.title}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {job.type && (
                      <span>{JOB_TYPE_LABELS[job.type] ?? job.type}</span>
                    )}
                    {job.location && !job.is_remote && (
                      <span className="flex items-center gap-0.5">
                        <MapPinIcon className="h-3 w-3" />
                        {job.location}
                      </span>
                    )}
                    {job.is_remote && (
                      <span className="flex items-center gap-0.5">
                        <GlobeIcon className="h-3 w-3" />
                        Remote
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRightIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </>
      )}

      {openJobs.length === 0 && (
        <>
          <Separator />
          <p className="px-5 py-3 text-xs text-muted-foreground">
            No open positions at this time.
          </p>
        </>
      )}
    </div>
  );
}

function MemberRow({ member }: { member: PublicMember }) {
  const { Icon, label } = ROLE_CONFIG[member.role];
  const initials = (member.profile.display_name ?? member.profile.username)
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Link
      to={`/crew/${member.profile.username}`}
      className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50"
    >
      <Avatar className="h-9 w-9">
        <AvatarImage src={member.profile.profile_image_url ?? undefined} />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {member.profile.display_name ?? member.profile.username}
        </p>
        {member.profile.position && (
          <p className="truncate text-xs text-muted-foreground">
            {member.profile.position}
          </p>
        )}
      </div>
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
    </Link>
  );
}

// ── Skeleton ──────────────────────────────────────────────

function CompanyProfileSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <Skeleton className="h-16 w-16 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-80" />
        </div>
      </div>
      <Separator />
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-32 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
      <Separator />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────

function CompanyProfile() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, error } = useCompanyProfile(slug);

  if (isLoading) return <CompanyProfileSkeleton />;

  if (error || !data) {
    return (
      <div className="py-20 text-center">
        <BuildingsIcon className="mx-auto h-10 w-10 text-muted-foreground/50" />
        <h2 className="mt-3 text-lg font-semibold">Company not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This company doesn't exist or has been removed.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/companies">Browse companies</Link>
        </Button>
      </div>
    );
  }

  const { company, productions, members, currentUserRole } = data;
  const isAdmin = currentUserRole === "owner" || currentUserRole === "admin";
  const isMember = currentUserRole !== null;
  const location = [company.city, company.country].filter(Boolean).join(", ");
  const totalOpenJobs = productions.reduce((acc, p) => acc + p.jobs.length, 0);

  const initials = company.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      <Helmet>
        <title>{company.name} | FilmCrew</title>
      </Helmet>

      <div className="space-y-8">
        {/* ── Header ───────────────────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 rounded-xl">
              <AvatarImage src={company.logo_url ?? undefined} alt={company.name} />
              <AvatarFallback className="rounded-xl text-lg font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {company.name}
                </h1>
                {company.is_verified && (
                  <Badge variant="secondary">Verified</Badge>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {location && (
                  <span className="flex items-center gap-1">
                    <MapPinIcon className="h-4 w-4" />
                    {location}
                  </span>
                )}
                {company.website_url && (
                  <a
                    href={company.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 transition-colors hover:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <GlobeIcon className="h-4 w-4" />
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* CTA buttons for members */}
          <div className="flex shrink-0 gap-2">
            {isAdmin && (
              <Button asChild variant="outline" size="sm">
                <Link to={`/companies/${slug}/settings`}>
                  <GearIcon className="mr-1.5 h-4 w-4" />
                  Settings
                </Link>
              </Button>
            )}
            {isMember && (
              <Button asChild size="sm">
                <Link to={`/companies/${slug}/dashboard`}>
                  Dashboard
                  <ArrowRightIcon className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* ── About ────────────────────────────────────── */}
        {company.description && (
          <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
            {company.description}
          </p>
        )}

        {/* ── Stats row ────────────────────────────────── */}
        <div className="flex flex-wrap gap-6 text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <UsersIcon className="h-4 w-4" />
            <strong className="text-foreground">{members.length}</strong>{" "}
            {members.length === 1 ? "member" : "members"}
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <FilmSlateIcon className="h-4 w-4" />
            <strong className="text-foreground">{productions.length}</strong>{" "}
            active {productions.length === 1 ? "production" : "productions"}
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <BriefcaseIcon className="h-4 w-4" />
            <strong className="text-foreground">{totalOpenJobs}</strong>{" "}
            open {totalOpenJobs === 1 ? "position" : "positions"}
          </span>
        </div>

        <Separator />

        {/* ── Productions + jobs ───────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <FilmSlateIcon className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">
              Active productions
              {productions.length > 0 && (
                <span className="ml-1.5 font-normal text-muted-foreground">
                  ({productions.length})
                </span>
              )}
            </h2>
          </div>

          {productions.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed py-10 text-center">
              <FilmSlateIcon className="h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 font-medium">No active productions</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                This company doesn't have any published productions right now.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {productions.map((prod) => (
                <ProductionSection key={prod.id} production={prod} />
              ))}
            </div>
          )}
        </section>

        <Separator />

        {/* ── Team ─────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Team</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((m) => (
              <MemberRow key={m.profile.id} member={m} />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

export default CompanyProfile;