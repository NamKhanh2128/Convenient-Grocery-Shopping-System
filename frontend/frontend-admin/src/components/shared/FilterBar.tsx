import * as React from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface FilterConfig {
  key: string;
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
  placeholder?: string;
}

interface FilterBarProps {
  filters: FilterConfig[];
  onClearAll?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function FilterBar({ filters, onClearAll, className, children }: FilterBarProps) {
  const hasActiveFilters = filters.some((f) => f.value && f.value !== "ALL" && f.value !== "");

  return (
    <div className={`flex flex-wrap items-center gap-3 bg-card p-3 rounded-xl border border-border/50 shadow-card ${className ?? ""}`}>
      {/* Icon Indicator */}
      <div className="flex items-center gap-2 text-muted-foreground mr-1 text-sm font-semibold">
        <SlidersHorizontal className="h-4 w-4 text-primary" />
        <span>Bộ lọc:</span>
      </div>

      {/* Structured Select Filters */}
      <div className="flex flex-wrap flex-1 items-center gap-2.5">
        {filters.map((filter) => (
          <div key={filter.key} className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground hidden lg:inline-block">
              {filter.label}:
            </span>
            <Select value={filter.value} onValueChange={filter.onChange}>
              <SelectTrigger className="h-9 min-w-[130px] w-auto max-w-[200px] rounded-[8px] border-border bg-card text-xs font-semibold">
                <SelectValue placeholder={filter.placeholder ?? filter.label} />
              </SelectTrigger>
              <SelectContent>
                {filter.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs font-medium">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}

        {children}
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && onClearAll && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-9 px-3 rounded-[8px] text-xs font-bold text-destructive hover:bg-destructive/10 transition-colors"
        >
          <X className="mr-1 h-3.5 w-3.5" />
          Xóa tất cả bộ lọc
        </Button>
      )}
    </div>
  );
}
