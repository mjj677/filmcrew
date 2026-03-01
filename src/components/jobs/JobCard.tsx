import { Link, useLocation } from "react-router-dom";
import {
  MapPinIcon,
  GlobeIcon,
  CalendarIcon,
  CurrencyGbpIcon,
  BriefcaseIcon,
  FilmSlateIcon,
} from "@phosphor-icons/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { saveScrollPosition } from "@/hooks/useScrollRestoration";
import type { JobWithContext } from "@/hooks/useJobs";

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
  any: "Any",
};

// ── Component ─────────────────────────────────────────────

type JobCardProps = {
  job: JobWithContext;
};

export function JobCard({ job }: JobCardProps) {
  const { pathname, search } = useLocation();

  function handleClick() {
    saveScrollPosition(pathname + search);
  }

  const isPastDeadline = job.deadline
    ? new Date(job.deadline) < new Date()
    : false;

  return (
    <Link
      to={`/jobs/${job.id}`}
      onClick={handleClick}
      className="group block"
    >
      <Card className="relative h-full transition-colors group-hover:border-foreground/20 group-hover:bg-accent/50">
        <CardContent className="flex flex-col gap-3 p-4">
          {/* Header: company avatar + title */}
          <div className="flex items-start gap-3">
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

            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-tight group-hover:text-foreground">
                {job.title}
              </p>
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
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap gap-1.5">
            {job.type && (
              <Badge variant="secondary" className="text-[11px]">
                {TYPE_LABELS[job.type] ?? job.type}
              </Badge>
            )}
            {job.experience_level && (
              <Badge variant="outline" className="text-[11px]">
                {EXPERIENCE_LABELS[job.experience_level] ?? job.experience_level}
              </Badge>
            )}
            {job.category && (
              <Badge variant="outline" className="text-[11px]">
                {job.category}
              </Badge>
            )}
          </div>

          {/* Location + compensation + deadline */}
          <Separator />
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPinIcon size={13} className="shrink-0" />
                <span className="truncate">{job.location}</span>
              </span>
            )}
            {job.is_remote && (
              <span className="flex items-center gap-1">
                <GlobeIcon size={13} className="shrink-0" />
                Remote
              </span>
            )}
            {job.compensation && (
              <span className="flex items-center gap-1">
                <CurrencyGbpIcon size={13} className="shrink-0" />
                {job.compensation}
              </span>
            )}
            {job.deadline && (
              <span
                className={`flex items-center gap-1 ${
                  isPastDeadline ? "text-amber-600" : ""
                }`}
              >
                <CalendarIcon size={13} className="shrink-0" />
                {isPastDeadline ? "Closed " : "Due "}
                {new Date(job.deadline).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}