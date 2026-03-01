import { useParams, Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  PlusIcon,
  FilmSlateIcon,
  UsersIcon,
  GearIcon,
  CrownIcon,
  ShieldCheckIcon,
  UserIcon,
  ArrowRightIcon,
  CalendarIcon,
  MapPinIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCompanyDetail } from "@/hooks/useCompanyDetail";
import type { CompanyMemberWithProfile } from "@/hooks/useCompanyDetail";
import type { Production, CompanyRole } from "@/types/models";

// ── Role helpers ──────────────────────────────────────────

const ROLE_CONFIG: Record<
  CompanyRole,
  { label: string; icon: typeof CrownIcon; className: string }
> = {
  owner: {
    label: "Owner",
    icon: CrownIcon,
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  admin: {
    label: "Admin",
    icon: ShieldCheckIcon,
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  member: {
    label: "Member",
    icon: UserIcon,
    className: "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
  },
};

// ── Production status config ──────────────────────────────

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pre_production: { label: "Pre-production", className: "bg-yellow-100 text-yellow-800" },
  in_production: { label: "In production", className: "bg-green-100 text-green-800" },
  post_production: { label: "Post-production", className: "bg-blue-100 text-blue-800" },
  wrapped: { label: "Wrapped", className: "bg-stone-100 text-stone-700" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700" },
};

// ── Tier badge ────────────────────────────────────────────

const TIER_CONFIG: Record<string, { label: string; className: string }> = {
  free: { label: "Free", className: "bg-stone-100 text-stone-600" },
  pro: { label: "Pro", className: "bg-violet-100 text-violet-700" },
  enterprise: { label: "Enterprise", className: "bg-amber-100 text-amber-700" },
};

// ── Page ──────────────────────────────────────────────────

function CompanyDashboard() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, error } = useCompanyDetail(slug);

  if (isLoading) return <DashboardSkeleton />;

  if (error || !data) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-lg font-semibold">Company not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This company doesn't exist or you don't have access.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/home">Go home</Link>
        </Button>
      </div>
    );
  }

  // If the user isn't a member, redirect to the public profile instead
  if (!data.role) {
    return <Navigate to={`/companies/${slug}`} replace />;
  }

  const { company, role, members, productions } = data;
  const isAdmin = role === "owner" || role === "admin";
  const tierInfo = TIER_CONFIG[company.tier] ?? TIER_CONFIG.free;
  const activeProductions = productions.filter(
    (p) => !["wrapped", "cancelled"].includes(p.status)
  );

  return (
    <>
      <Helmet>
        <title>{company.name} — Dashboard | FilmCrew</title>
      </Helmet>

      <div className="space-y-8">
        {/* ── Header ───────────────────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14 rounded-lg">
              <AvatarImage src={company.logo_url ?? undefined} alt={company.name} />
              <AvatarFallback className="rounded-lg text-lg">
                {company.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {company.name}
                </h1>
                <Badge variant="secondary" className={tierInfo.className}>
                  {tierInfo.label}
                </Badge>
              </div>
              {company.description && (
                <p className="mt-1 max-w-lg text-sm text-muted-foreground">
                  {company.description}
                </p>
              )}
              {(company.city || company.country) && (
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPinIcon className="h-3.5 w-3.5" />
                  {[company.city, company.country].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
          </div>

          {isAdmin && (
            <Button asChild variant="outline" size="sm">
              <Link to={`/companies/${slug}/settings`}>
                <GearIcon className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </Button>
          )}
        </div>

        <Separator />

        {/* ── Stats cards ──────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Productions"
            value={activeProductions.length}
            sublabel={`of ${company.max_active_productions} allowed`}
            icon={FilmSlateIcon}
          />
          <StatCard
            label="Team members"
            value={members.length}
            icon={UsersIcon}
          />
          <StatCard
            label="Your role"
            value={ROLE_CONFIG[role].label}
            icon={ROLE_CONFIG[role].icon}
          />
        </div>

        {/* ── Productions ──────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Productions</h2>
            {isAdmin && (
              <Button asChild size="sm">
                <Link to={`/companies/${slug}/productions/new`}>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  New production
                </Link>
              </Button>
            )}
          </div>

          {productions.length === 0 ? (
            <EmptyState
              icon={FilmSlateIcon}
              title="No productions yet"
              description={
                isAdmin
                  ? "Create your first production to start posting jobs."
                  : "No productions have been created yet."
              }
            />
          ) : (
            <div className="space-y-3">
              {productions.map((p) => (
                <ProductionRow key={p.id} production={p} />
              ))}
            </div>
          )}
        </section>

        <Separator />

        {/* ── Team ─────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Team</h2>
            {isAdmin && (
              <Button asChild variant="outline" size="sm">
                <Link to={`/companies/${slug}/settings`}>
                  Manage team
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {members.map((m) => (
              <MemberCard key={m.id} member={m} />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────

function StatCard({
  label,
  value,
  sublabel,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: typeof FilmSlateIcon;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {sublabel && (
        <p className="text-xs text-muted-foreground">{sublabel}</p>
      )}
    </div>
  );
}

function ProductionRow({
  production: p,
}: {
  production: Production;
}) {
  const status = STATUS_LABELS[p.status] ?? STATUS_LABELS.pre_production;

  return (
    <Link
      to={`/productions/${p.slug}`}
      className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{p.title}</p>
          <Badge variant="secondary" className={status.className}>
            {status.label}
          </Badge>
        </div>
        {(p.location || p.start_date) && (
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            {p.location && (
              <span className="flex items-center gap-1">
                <MapPinIcon className="h-3 w-3" />
                {p.location}
              </span>
            )}
            {p.start_date && (
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                {new Date(p.start_date).toLocaleDateString("en-GB", {
                  month: "short",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
        )}
      </div>
      <ArrowRightIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

function MemberCard({ member }: { member: CompanyMemberWithProfile }) {
  const { profile } = member;
  const roleConfig = ROLE_CONFIG[member.role];
  const initials =
    profile.display_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "?";

  return (
    <Link
      to={`/crew/${profile.username}`}
      className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50"
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={profile.profile_image_url ?? undefined} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {profile.display_name ?? profile.username}
        </p>
        {profile.position && (
          <p className="truncate text-xs text-muted-foreground">
            {profile.position}
          </p>
        )}
      </div>
      <Badge variant="secondary" className={`text-xs ${roleConfig.className}`}>
        <roleConfig.icon className="mr-1 h-3 w-3" weight="fill" />
        {roleConfig.label}
      </Badge>
    </Link>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof FilmSlateIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed py-10 text-center">
      <Icon className="h-10 w-10 text-muted-foreground/50" />
      <p className="mt-3 font-medium">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <Skeleton className="h-14 w-14 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
      </div>
      <Separator />
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
      </div>
    </div>
  );
}

export default CompanyDashboard;