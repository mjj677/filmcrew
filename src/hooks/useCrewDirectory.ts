import { useSearchParams } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/models";

const PAGE_SIZE = 12;

export type CrewFilters = {
  search: string;
  position: string;
  availability: string;
  skill: string;
};

type CrewDirectoryResult = {
  profiles: Profile[];
  count: number;
};

export const crewKeys = {
  all: ["crew"] as const,
  list: (filters: CrewFilters, page: number) =>
    [...crewKeys.all, "list", filters, page] as const,
};

async function fetchCrewProfiles(
  filters: CrewFilters,
  page: number,
): Promise<CrewDirectoryResult> {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .eq("has_completed_setup", true)
    .order("availability_status", { ascending: true })  // 'available' < 'busy' < 'not_looking' alphabetically
    .order("updated_at", { ascending: false });

  // Text search — matches display_name, username, or position
  if (filters.search) {
    const term = `%${filters.search}%`;
    query = query.or(
      `display_name.ilike.${term},username.ilike.${term},position.ilike.${term}`,
    );
  }

  // Exact-match filters
  if (filters.position) {
    query = query.eq("position", filters.position);
  }

  if (filters.availability) {
    query = query.eq("availability_status", filters.availability);
  }

  // Skills array containment — "has this skill"
  if (filters.skill) {
    query = query.contains("skills", [filters.skill]);
  }

  // Pagination
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return {
    profiles: data ?? [],
    count: count ?? 0,
  };
}

function parseFilters(params: URLSearchParams): CrewFilters {
  return {
    search: params.get("search") ?? "",
    position: params.get("position") ?? "",
    availability: params.get("availability") ?? "",
    skill: params.get("skill") ?? "",
  };
}

function parsePage(params: URLSearchParams): number {
  const raw = params.get("page");
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isNaN(n) || n < 0 ? 0 : n;
}

export function useCrewDirectory() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = parseFilters(searchParams);
  const page = parsePage(searchParams);

  const query = useQuery({
    queryKey: crewKeys.list(filters, page),
    queryFn: () => fetchCrewProfiles(filters, page),
    placeholderData: keepPreviousData,
  });

  const totalPages = query.data
    ? Math.ceil(query.data.count / PAGE_SIZE)
    : 0;

  /** Update one or more filters. Resets page to 0. */
  function setFilters(updates: Partial<CrewFilters>) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);

      // Apply updates
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          next.set(key, value);
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
    window.scrollTo({ top: 0, behavior: "smooth"})
  }

  function clearFilters() {
    setSearchParams({});
  }

  const hasActiveFilters = !!(
    filters.search ||
    filters.position ||
    filters.availability ||
    filters.skill
  );

  return {
    profiles: query.data?.profiles ?? [],
    totalCount: query.data?.count ?? 0,
    isLoading: query.isLoading,
    isPlaceholderData: query.isPlaceholderData,
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
    pageSize: PAGE_SIZE,
  };
}