import { BriefcaseIcon } from "@phosphor-icons/react";
import { JobCard } from "@/components/jobs/JobCard";
import type { JobWithContext } from "@/hooks/useJobs";

type JobGridProps = {
  jobs: JobWithContext[];
  hasActiveFilters: boolean;
};

export function JobGrid({ jobs, hasActiveFilters }: JobGridProps) {
  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <BriefcaseIcon size={40} className="mb-3 text-muted-foreground/50" />
        <p className="text-sm font-medium text-muted-foreground">
          {hasActiveFilters
            ? "No jobs match your filters"
            : "No jobs posted yet"}
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
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}