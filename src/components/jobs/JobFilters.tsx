import { useRef, useState, useEffect } from "react";
import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { JobFilters as Filters } from "@/hooks/useJobDirectory";

// ── Constants ─────────────────────────────────────────────

const JOB_CATEGORIES = [
  "Camera & Lighting",
  "Direction & Production",
  "Post-Production",
  "Sound",
  "Art & Design",
  "Wardrobe & Makeup",
  "Writing",
  "Performance",
  "Other",
] as const;

const JOB_TYPES = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "freelance", label: "Freelance" },
  { value: "daily_rate", label: "Daily rate" },
] as const;

const EXPERIENCE_LEVELS = [
  { value: "entry", label: "Entry level" },
  { value: "mid", label: "Mid level" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead / Head of Dept" },
  { value: "any", label: "Any experience" },
] as const;

// Sentinel value for "all" since shadcn Select doesn't support empty string values
const ALL = "__all__";

// ── Props ─────────────────────────────────────────────────

type JobFiltersProps = {
  filters: Filters;
  hasActiveFilters: boolean;
  onFilterChange: (updates: Partial<Filters>) => void;
  onClear: () => void;
  totalCount: number;
};

// ── Component ─────────────────────────────────────────────

export function JobFilters({
  filters,
  hasActiveFilters,
  onFilterChange,
  onClear,
  totalCount,
}: JobFiltersProps) {
  // Debounced search
  const [searchInput, setSearchInput] = useState(filters.search);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Keep local input in sync if filters change externally (e.g. clear all)
  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  function handleSearchChange(value: string) {
    setSearchInput(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onFilterChange({ search: value.trim() });
    }, 300);
  }

  function handleSelectChange(key: keyof Filters, value: string) {
    onFilterChange({ [key]: value === ALL ? "" : value });
  }

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative">
        <MagnifyingGlassIcon
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Search jobs by title…"
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={filters.category || ALL}
          onValueChange={(v) => handleSelectChange("category", v)}
        >
          <SelectTrigger className="w-44 cursor-pointer">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent position="popper" className="max-h-60">
            <SelectItem value={ALL} className="cursor-pointer">
              All categories
            </SelectItem>
            {JOB_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat} className="cursor-pointer">
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.type || ALL}
          onValueChange={(v) => handleSelectChange("type", v)}
        >
          <SelectTrigger className="w-36 cursor-pointer">
            <SelectValue placeholder="Job type" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value={ALL} className="cursor-pointer">
              All types
            </SelectItem>
            {JOB_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value} className="cursor-pointer">
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.experience_level || ALL}
          onValueChange={(v) => handleSelectChange("experience_level", v)}
        >
          <SelectTrigger className="w-44 cursor-pointer">
            <SelectValue placeholder="Experience" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value={ALL} className="cursor-pointer">
              All levels
            </SelectItem>
            {EXPERIENCE_LEVELS.map((lvl) => (
              <SelectItem key={lvl.value} value={lvl.value} className="cursor-pointer">
                {lvl.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Remote toggle */}
        <div className="flex items-center gap-2 rounded-md border px-3 py-2">
          <Switch
            id="remote-filter"
            checked={filters.is_remote}
            onCheckedChange={(checked) =>
              onFilterChange({ is_remote: checked })
            }
          />
          <Label htmlFor="remote-filter" className="cursor-pointer text-sm">
            Remote only
          </Label>
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-9 gap-1 text-muted-foreground"
          >
            <XIcon size={14} />
            Clear filters
          </Button>
        )}

        <span className="ml-auto text-sm text-muted-foreground">
          {totalCount} {totalCount === 1 ? "job" : "jobs"}
        </span>
      </div>
    </div>
  );
}