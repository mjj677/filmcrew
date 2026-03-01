import { Helmet } from "react-helmet-async";
import { useJobDirectory } from "@/hooks/useJobDirectory";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";
import { JobFilters } from "@/components/jobs/JobFilters";
import { JobGrid } from "@/components/jobs/JobGrid";
import { JobSkeleton } from "@/components/jobs/JobSkeleton";
import { JobPagination } from "@/components/jobs/JobPagination";

function Jobs() {
  const {
    jobs,
    totalCount,
    isLoading,
    filters,
    setFilters,
    clearFilters,
    hasActiveFilters,
    page,
    setPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
  } = useJobDirectory();

  useScrollRestoration(!isLoading);

  return (
    <>
      <Helmet>
        <title>Jobs | FilmCrew</title>
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Find jobs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse open positions across film productions.
          </p>
        </div>

        <JobFilters
          filters={filters}
          hasActiveFilters={hasActiveFilters}
          onFilterChange={setFilters}
          onClear={clearFilters}
          totalCount={totalCount}
        />

        {isLoading ? (
          <JobSkeleton />
        ) : (
          <JobGrid jobs={jobs} hasActiveFilters={hasActiveFilters} />
        )}

        <JobPagination
          page={page}
          totalPages={totalPages}
          hasPrevPage={hasPrevPage}
          hasNextPage={hasNextPage}
          onPageChange={setPage}
        />
      </div>
    </>
  );
}

export default Jobs;