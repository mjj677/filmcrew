import { useSearchParams } from "react-router-dom";
import { useJobList, JOB_PAGE_SIZE, type JobListFilters } from "@/hooks/useJobs";

export type JobFilters = {
  search: string;
  category: string;
  type: string;
  experience_level: string;
  is_remote: boolean;
};

function parseFilters(params: URLSearchParams): JobFilters {
  return {
    search: params.get("search") ?? "",
    category: params.get("category") ?? "",
    type: params.get("type") ?? "",
    experience_level: params.get("experience_level") ?? "",
    is_remote: params.get("is_remote") === "true",
  };
}

function parsePage(params: URLSearchParams): number {
  const raw = params.get("page");
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isNaN(n) || n < 0 ? 0 : n;
}

export function useJobDirectory() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = parseFilters(searchParams);
  const page = parsePage(searchParams);

  // Convert our UI filters to the hook's expected format
  const queryFilters: JobListFilters = {
    search: filters.search || undefined,
    category: filters.category || undefined,
    type: filters.type || undefined,
    experience_level: filters.experience_level || undefined,
    is_remote: filters.is_remote || undefined,
  };

  const query = useJobList(queryFilters, page);

  const totalCount = query.data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / JOB_PAGE_SIZE);

  /** Update one or more filters. Resets page to 0. */
  function setFilters(updates: Partial<JobFilters>) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);

      for (const [key, value] of Object.entries(updates)) {
        if (key === "is_remote") {
          if (value) {
            next.set("is_remote", "true");
          } else {
            next.delete("is_remote");
          }
        } else if (value) {
          next.set(key, value as string);
        } else {
          next.delete(key);
        }
      }

      // Reset to first page whenever filters change
      next.delete("page");
      return next;
    });
  }

  function setPage(p: number) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (p <= 0) {
        next.delete("page");
      } else {
        next.set("page", String(p));
      }
      return next;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clearFilters() {
    setSearchParams({});
  }

  const hasActiveFilters = !!(
    filters.search ||
    filters.category ||
    filters.type ||
    filters.experience_level ||
    filters.is_remote
  );

  return {
    jobs: query.data?.jobs ?? [],
    totalCount,
    isLoading: query.isLoading,
    error: query.error,
    filters,
    setFilters,
    clearFilters,
    hasActiveFilters,
    page,
    setPage,
    totalPages,
    hasNextPage: page < totalPages - 1,
    hasPrevPage: page > 0,
  };
}