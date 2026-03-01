import { useRef, useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCompanyDirectory } from "@/hooks/useCompanyDirectory";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";
import { CompanyCard } from "@/components/company/CompanyCard";
import { BuildingsIcon } from "@phosphor-icons/react";

// ── Skeleton ──────────────────────────────────────────────

function CompaniesSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <Skeleton key={i} className="h-40 rounded-xl" />
      ))}
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────

function CompanyPagination({
  page,
  totalPages,
  hasPrevPage,
  hasNextPage,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3 pt-2">
      <Button
        variant="outline"
        size="sm"
        disabled={!hasPrevPage}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {page + 1} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={!hasNextPage}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────

function Companies() {
  const {
    companies,
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
  } = useCompanyDirectory();

  useScrollRestoration(!isLoading);

  // Debounced local search state
  const [searchInput, setSearchInput] = useState(filters.search);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  function handleSearchChange(value: string) {
    setSearchInput(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters({ search: value.trim() });
    }, 300);
  }

  return (
    <>
      <Helmet>
        <title>Production Companies | FilmCrew</title>
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Production companies
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse film and TV production companies posting jobs on FilmCrew.
          </p>
        </div>

        {/* Search + count */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <MagnifyingGlassIcon
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Search companies..."
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <XIcon className="mr-1.5 h-3.5 w-3.5" />
                Clear
              </Button>
            )}
          </div>
          {!isLoading && (
            <p className="text-xs text-muted-foreground">
              {totalCount === 0
                ? "No companies found"
                : `${totalCount} ${totalCount === 1 ? "company" : "companies"}`}
            </p>
          )}
        </div>

        {/* Grid */}
        {isLoading ? (
          <CompaniesSkeleton />
        ) : companies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BuildingsIcon size={40} className="mb-3 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">
              {hasActiveFilters
                ? "No companies match your search"
                : "No companies yet"}
            </p>
            {hasActiveFilters && (
              <p className="mt-1 text-xs text-muted-foreground/70">
                Try a different search term.
              </p>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((c) => (
              <CompanyCard key={c.id} company={c} />
            ))}
          </div>
        )}

        <CompanyPagination
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

export default Companies;