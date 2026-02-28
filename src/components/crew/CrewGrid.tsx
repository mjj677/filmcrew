import { UsersIcon } from "@phosphor-icons/react";
import { CrewCard } from "@/components/crew/CrewCard";
import type { Profile } from "@/types/models";

type CrewGridProps = {
  profiles: Profile[];
  hasActiveFilters: boolean;
};

export function CrewGrid({ profiles, hasActiveFilters }: CrewGridProps) {
  if (profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <UsersIcon size={40} className="mb-3 text-muted-foreground/50" />
        <p className="text-sm font-medium text-muted-foreground">
          {hasActiveFilters
            ? "No crew members match your filters"
            : "No crew members yet"}
        </p>
        {hasActiveFilters && (
          <p className="mt-1 text-xs text-muted-foreground/70">
            Try broadening your search or removing some filters.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {profiles.map((profile) => (
        <CrewCard key={profile.id} profile={profile} />
      ))}
    </div>
  );
}