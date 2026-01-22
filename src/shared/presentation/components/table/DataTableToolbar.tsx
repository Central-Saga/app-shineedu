"use client";

import type { ReactNode } from "react";
import { Search, ArrowUpDown, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface DataTableFilterConfig {
  key: string;
  label: string;
  options: ReadonlyArray<{ readonly label: string; readonly value: string }>;
  value: string | null;
  onChange: (value: string | null) => void;
}

export interface DataTableSortConfig {
  value: string;
  options: ReadonlyArray<{ readonly label: string; readonly value: string }>;
  onChange: (value: string) => void;
  direction: "asc" | "desc";
  onToggleDirection: () => void;
  defaultValue?: string;
  defaultDirection?: "asc" | "desc";
  onDirectionChange?: (d: "asc" | "desc") => void;
}

export interface DataTableToolbarProps {
  title?: string;
  searchValue: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  filters: DataTableFilterConfig[];
  sort: DataTableSortConfig;
  rightSlot?: ReactNode;
}

function isAtDefaults(
  searchValue: string,
  filters: DataTableFilterConfig[],
  sort: DataTableSortConfig
): boolean {
  if (searchValue !== "") return false;
  if (filters.some((f) => f.value != null)) return false;
  if (
    sort.defaultValue != null &&
    (sort.value !== sort.defaultValue ||
      (sort.defaultDirection != null && sort.direction !== sort.defaultDirection))
  )
    return false;
  return true;
}

export function DataTableToolbar({
  title,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Cari…",
  filters,
  sort,
  rightSlot,
}: DataTableToolbarProps) {
  const showReset = !isAtDefaults(searchValue, filters, sort);

  function handleReset() {
    onSearchChange("");
    filters.forEach((f) => f.onChange(null));
    sort.onChange(sort.defaultValue ?? sort.options[0]?.value ?? "");
    if (sort.onDirectionChange && sort.defaultDirection != null) {
      sort.onDirectionChange(sort.defaultDirection);
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative flex-1 sm:max-w-xs">
        <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {filters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="text-muted-foreground hidden size-4 sm:block" />
          {filters.map((f) => (
            <Select
              key={f.key}
              value={f.value ?? "__all__"}
              onValueChange={(v) => f.onChange(v === "__all__" ? null : v)}
            >
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue placeholder={f.label} />
              </SelectTrigger>
              <SelectContent>
                {f.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Select value={sort.value} onValueChange={sort.onChange}>
          <SelectTrigger className="h-9 w-[130px]">
            <SelectValue placeholder="Urutkan" />
          </SelectTrigger>
          <SelectContent>
            {sort.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9 shrink-0"
          onClick={sort.onToggleDirection}
          title={sort.direction === "asc" ? "Urut naik" : "Urut turun"}
        >
          <ArrowUpDown className="size-4" />
          <span className="sr-only">Toggle urutan</span>
        </Button>

        {showReset && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 gap-1"
            onClick={handleReset}
          >
            <X className="size-4" />
            Reset
          </Button>
        )}

        {rightSlot != null && <div className="flex items-center">{rightSlot}</div>}
      </div>
    </div>
  );
}
