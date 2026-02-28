import { Link, useLocation } from "react-router-dom";
import {
  MapPinIcon,
  ClockIcon,
  LinkIcon,
  ClockCountdownIcon,
} from "@phosphor-icons/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AVAILABILITY_OPTIONS, EXPERIENCE_RANGES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { saveScrollPosition } from "@/hooks/useScrollRestoration";
import type { Profile } from "@/types/models";

const MAX_VISIBLE_SKILLS = 3;
const BIO_PREVIEW_LENGTH = 100;

type CrewCardProps = {
  profile: Profile;
  connectionStatus: "pending" | "accepted" | null;
};

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvailabilityMeta(status: string | null) {
  return (
    AVAILABILITY_OPTIONS.find((o) => o.value === status) ??
    AVAILABILITY_OPTIONS[2]
  );
}

function getExperienceLabel(years: number | null): string | null {
  if (years === null) return null;
  const match = EXPERIENCE_RANGES.find((r) => r.value === years);
  return match?.label ?? `${years} years`;
}

function truncateBio(bio: string | null): string | null {
  if (!bio) return null;
  if (bio.length <= BIO_PREVIEW_LENGTH) return bio;
  const trimmed = bio.slice(0, BIO_PREVIEW_LENGTH);
  const lastSpace = trimmed.lastIndexOf(" ");
  return (lastSpace > 0 ? trimmed.slice(0, lastSpace) : trimmed) + "…";
}

export function CrewCard({ profile, connectionStatus }: CrewCardProps) {
  const { pathname, search } = useLocation();

  function handleClick() {
    saveScrollPosition(pathname + search);
  }

  const availability = getAvailabilityMeta(profile.availability_status);
  const skills = profile.skills ?? [];
  const visibleSkills = skills.slice(0, MAX_VISIBLE_SKILLS);
  const overflowCount = skills.length - MAX_VISIBLE_SKILLS;
  const experienceLabel = getExperienceLabel(profile.experience_years);
  const bioPreview = truncateBio(profile.bio);

  const location = [profile.location, profile.country]
    .filter(Boolean)
    .join(", ");

  return (
    <Link to={`/crew/${profile.username}`} onClick={handleClick} className="group block">
      <Card className="relative h-full transition-colors group-hover:border-foreground/20 group-hover:bg-accent/50">
        {/* Connection status indicator */}
        {connectionStatus && (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="absolute right-3 top-3 text-muted-foreground">
                  {connectionStatus === "accepted" ? (
                    <LinkIcon size={16} />
                  ) : (
                    <ClockCountdownIcon size={16} />
                  )}
                </span>
              </TooltipTrigger>
              <TooltipContent side="left">
                {connectionStatus === "accepted"
                  ? "Connected"
                  : "Request pending"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <CardContent className="flex flex-col gap-4 p-4">
          {/* Header: avatar + name + availability */}
          <div className="flex items-start gap-3">
            <Avatar className="h-14 w-14 shrink-0">
              <AvatarImage
                src={profile.profile_image_url ?? undefined}
                alt={profile.display_name ?? profile.username}
              />
              <AvatarFallback className="text-sm font-medium">
                {getInitials(profile.display_name)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold leading-tight">
                {profile.display_name ?? profile.username}
              </p>

              {profile.position && (
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {profile.position}
                </p>
              )}

              <span className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full",
                    availability.color,
                  )}
                />
                {availability.label}
              </span>
            </div>
          </div>

          {/* Bio preview */}
          {bioPreview && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              {bioPreview}
            </p>
          )}

          {/* Meta row: location + experience */}
          {(location || experienceLabel) && (
            <>
              <Separator />
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {location && (
                  <span className="flex items-center gap-1">
                    <MapPinIcon size={13} className="shrink-0" />
                    <span className="truncate">{location}</span>
                  </span>
                )}
                {experienceLabel && (
                  <span className="flex items-center gap-1">
                    <ClockIcon size={13} className="shrink-0" />
                    {experienceLabel}
                  </span>
                )}
              </div>
            </>
          )}

          {/* Skills */}
          {visibleSkills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {visibleSkills.map((skill) => (
                <Badge
                  key={skill}
                  variant="secondary"
                  className="text-[11px]"
                >
                  {skill}
                </Badge>
              ))}
              {overflowCount > 0 && (
                <Badge variant="outline" className="text-[11px]">
                  +{overflowCount} more
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}