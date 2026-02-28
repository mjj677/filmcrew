import { useRef, useState, useEffect } from "react";
import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { POSITIONS, AVAILABILITY_OPTIONS, PREDEFINED_SKILLS } from "@/lib/constants";
import type { CrewFilters as Filters } from "@/hooks/useCrewDirectory";

type CrewFiltersProps = {
  filters: Filters;
  hasActiveFilters: boolean;
  onFilterChange: (updates: Partial<Filters>) => void;
  onClear: () => void;
  totalCount: number;
};

// Sentinel value for "all" since shadcn Select doesn't support empty string values
const ALL = "__all__";

export function CrewFilters({
  filters,
  hasActiveFilters,
  onFilterChange,
  onClear,
  totalCount,
}: CrewFiltersProps) {
  // Debounced search — local state tracks the input, we only push to URL after a delay
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
          placeholder="Search by name, username, or role..."
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={filters.position || ALL}
          onValueChange={(v) => handleSelectChange("position", v)}
        >
          <SelectTrigger className="w-40 cursor-pointer">
            <SelectValue placeholder="Position" />
          </SelectTrigger>
          <SelectContent position="popper" className="max-h-60">
            <SelectItem value={ALL} className="cursor-pointer">
              All positions
            </SelectItem>
            {POSITIONS.map((pos) => (
              <SelectItem key={pos} value={pos} className="cursor-pointer">
                {pos}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.availability || ALL}
          onValueChange={(v) => handleSelectChange("availability", v)}
        >
          <SelectTrigger className="w-37.5 cursor-pointer">
            <SelectValue placeholder="Availability" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value={ALL} className="cursor-pointer">
              All availability
            </SelectItem>
            {AVAILABILITY_OPTIONS.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                className="cursor-pointer"
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.skill || ALL}
          onValueChange={(v) => handleSelectChange("skill", v)}
        >
          <SelectTrigger className="w-40 cursor-pointer">
            <SelectValue placeholder="Skill" />
          </SelectTrigger>
          <SelectContent position="popper" className="max-h-60">
            <SelectItem value={ALL} className="cursor-pointer">
              All skills
            </SelectItem>
            {PREDEFINED_SKILLS.map((skill) => (
              <SelectItem key={skill} value={skill} className="cursor-pointer">
                {skill}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
          {totalCount} {totalCount === 1 ? "member" : "members"}
        </span>
      </div>
    </div>
  );
}