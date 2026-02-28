import { Helmet } from "react-helmet-async";
import { useCrewDirectory } from "@/hooks/useCrewDirectory";
import { useScrollRestoration } from "@/hooks/useScrollRestoration"
import { CrewFilters } from "@/components/crew/CrewFilters";
import { CrewGrid } from "@/components/crew/CrewGrid";
import { CrewSkeleton } from "@/components/crew/CrewSkeleton";
import { CrewPagination } from "@/components/crew/CrewPagination";

function CrewDirectory() {
  const {
    profiles,
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
  } = useCrewDirectory();

  useScrollRestoration(!isLoading)

  return (
    <>
      <Helmet>
        <title>Find Crew | FilmCrew</title>
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Find crew</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse film professionals and find the right people for your
            project.
          </p>
        </div>

        <CrewFilters
          filters={filters}
          hasActiveFilters={hasActiveFilters}
          onFilterChange={setFilters}
          onClear={clearFilters}
          totalCount={totalCount}
        />

        {isLoading ? (
          <CrewSkeleton />
        ) : (
          <CrewGrid
            profiles={profiles}
            hasActiveFilters={hasActiveFilters}
          />
        )}

        <CrewPagination
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

export default CrewDirectory;