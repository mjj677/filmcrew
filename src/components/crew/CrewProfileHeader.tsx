import { MapPinIcon, ClockIcon } from "@phosphor-icons/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AVAILABILITY_OPTIONS, EXPERIENCE_RANGES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/models";

type CrewProfileHeaderProps = {
  profile: Profile;
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

export function CrewProfileHeader({ profile }: CrewProfileHeaderProps) {
  const availability = getAvailabilityMeta(profile.availability_status);
  const experienceLabel = getExperienceLabel(profile.experience_years);

  const location = [profile.location, profile.country]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left sm:gap-6">
      <Avatar className="h-24 w-24 shrink-0">
        <AvatarImage
          src={profile.profile_image_url ?? undefined}
          alt={profile.display_name ?? profile.username}
        />
        <AvatarFallback className="text-xl font-medium">
          {getInitials(profile.display_name)}
        </AvatarFallback>
      </Avatar>

      <div className="mt-4 sm:mt-0">
        <h1 className="text-2xl font-semibold tracking-tight">
          {profile.display_name ?? profile.username}
        </h1>

        {profile.position && (
          <p className="mt-0.5 text-base text-muted-foreground">
            {profile.position}
          </p>
        )}

        {/* Availability badge */}
        <span className="mt-2 inline-flex items-center gap-1.5 text-sm">
          <span
            className={cn(
              "h-2.5 w-2.5 shrink-0 rounded-full",
              availability.color,
            )}
          />
          {availability.label}
        </span>

        {/* Meta row */}
        {(location || experienceLabel) && (
          <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground sm:justify-start">
            {location && (
              <span className="flex items-center gap-1">
                <MapPinIcon size={15} className="shrink-0" />
                {location}
              </span>
            )}
            {experienceLabel && (
              <span className="flex items-center gap-1">
                <ClockIcon size={15} className="shrink-0" />
                {experienceLabel}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}