import { useSearchParams } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { ProductionCompany } from "@/types/models";

const PAGE_SIZE = 12;

export type CompanyFilters = {
  search: string;
  country: string;
};

export type CompanyWithCounts = ProductionCompany & {
  memberCount: number;
  productionCount: number;
};

type CompanyDirectoryResult = {
  companies: CompanyWithCounts[];
  count: number;
};

export const companyDirectoryKeys = {
  all: ["companyDirectory"] as const,
  list: (filters: CompanyFilters, page: number) =>
    [...companyDirectoryKeys.all, "list", filters, page] as const,
};

async function fetchCompanies(
  filters: CompanyFilters,
  page: number
): Promise<CompanyDirectoryResult> {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let q = supabase
    .from("production_companies")
    .select(
      `
      *,
      members:production_company_members(count),
      productions:productions(count)
    `,
      { count: "exact" }
    )
    .is("deleted_at", null)
    .order("name", { ascending: true })
    .range(from, to);

  if (filters.search) {
    q = q.ilike("name", `%${filters.search}%`);
  }
  if (filters.country) {
    q = q.eq("country", filters.country);
  }

  const { data, error, count } = await q;
  if (error) throw new Error(error.message);

  const companies = (data ?? []).map((row) => {
    // Supabase returns embedded counts as [{ count: N }]
    const memberCount = (row.members as unknown as { count: number }[])[0]?.count ?? 0;
    const productionCount = (row.productions as unknown as { count: number }[])[0]?.count ?? 0;
    const { members: _m, productions: _p, ...company } = row as any;
    return { ...company, memberCount, productionCount } as CompanyWithCounts;
  });

  return { companies, count: count ?? 0 };
}

function parseFilters(params: URLSearchParams): CompanyFilters {
  return {
    search: params.get("search") ?? "",
    country: params.get("country") ?? "",
  };
}

function parsePage(params: URLSearchParams): number {
  const raw = params.get("page");
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isNaN(n) || n < 0 ? 0 : n;
}

export function useCompanyDirectory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseFilters(searchParams);
  const page = parsePage(searchParams);

  const query = useQuery({
    queryKey: companyDirectoryKeys.list(filters, page),
    queryFn: () => fetchCompanies(filters, page),
    placeholderData: keepPreviousData,
  });

  const totalPages = query.data ? Math.ceil(query.data.count / PAGE_SIZE) : 0;

  function setFilters(updates: Partial<CompanyFilters>) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [key, value] of Object.entries(updates)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      next.delete("page");
      return next;
    });
  }

  function setPage(p: number) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (p <= 0) next.delete("page");
      else next.set("page", String(p));
      return next;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clearFilters() {
    setSearchParams({});
  }

  const hasActiveFilters = !!(filters.search || filters.country);

  return {
    companies: query.data?.companies ?? [],
    totalCount: query.data?.count ?? 0,
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