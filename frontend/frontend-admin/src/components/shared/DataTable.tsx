import * as React from "react";
import { useState, useMemo } from "react";
import { ArrowUpDown, Inbox } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  getRowId: (row: T) => string;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  emptyMessage?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (key: string, direction: "asc" | "desc") => void;
}

export function DataTable<T>({
  data,
  columns,
  loading = false,
  onRowClick,
  getRowId,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  emptyMessage = "Không có dữ liệu.",
  emptyActionLabel,
  onEmptyAction,
  sortKey: externalSortKey,
  sortDirection: externalSortDirection,
  onSort,
}: DataTableProps<T>) {
  // Local sort state if external sorting is not provided
  const [localSortKey, setLocalSortKey] = useState<string>("");
  const [localSortDirection, setLocalSortDirection] = useState<"asc" | "desc">("asc");

  const isSortControlled = externalSortKey !== undefined && onSort !== undefined;
  const activeSortKey = isSortControlled ? externalSortKey : localSortKey;
  const activeSortDirection = isSortControlled ? externalSortDirection : localSortDirection;

  const handleSort = (key: string) => {
    let newDirection: "asc" | "desc" = "asc";
    if (activeSortKey === key) {
      newDirection = activeSortDirection === "asc" ? "desc" : "asc";
    }

    if (isSortControlled) {
      onSort(key, newDirection);
    } else {
      setLocalSortKey(key);
      setLocalSortDirection(newDirection);
    }
  };

  const sortedData = useMemo(() => {
    if (isSortControlled || !activeSortKey) return data;

    return [...data].sort((a, b) => {
      const aVal = (a as any)[activeSortKey];
      const bVal = (b as any)[activeSortKey];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const comparison = String(aVal).localeCompare(String(bVal), "vi", { numeric: true });
      return activeSortDirection === "asc" ? comparison : -comparison;
    });
  }, [data, activeSortKey, activeSortDirection, isSortControlled]);

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      onSelectionChange(data.map((row) => getRowId(row)));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectRow = (rowId: string, checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      onSelectionChange([...selectedIds, rowId]);
    } else {
      onSelectionChange(selectedIds.filter((id) => id !== rowId));
    }
  };

  const isAllSelected = data.length > 0 && selectedIds.length === data.length;
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < data.length;

  return (
    <div className="w-full overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {selectable && (
                <TableHead className="w-[50px] px-4 py-3.5">
                  <Checkbox
                    checked={isAllSelected || (isSomeSelected ? "indeterminate" : false)}
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                    aria-label="Chọn tất cả"
                  />
                </TableHead>
              )}
              {columns.map((col) => (
                <TableHead
                  key={String(col.key)}
                  style={{ width: col.width }}
                  className={cn(
                    "px-4 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider",
                    col.sortable && "cursor-pointer select-none hover:text-foreground",
                    col.className
                  )}
                  onClick={() => col.sortable && handleSort(String(col.key))}
                >
                  <div className="flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && (
                      <ArrowUpDown
                        className={cn(
                          "h-3.5 w-3.5 transition-colors",
                          activeSortKey === col.key
                            ? "text-primary font-bold"
                            : "text-muted-foreground/50 hover:text-muted-foreground"
                        )}
                      />
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <TableRow key={rowIndex} className="border-b border-border/50">
                  {selectable && (
                    <TableCell className="px-4 py-3.5">
                      <Skeleton className="h-4 w-4 rounded" />
                    </TableCell>
                  )}
                  {columns.map((col, colIndex) => (
                    <TableCell key={colIndex} className={cn("px-4 py-3.5", col.className)}>
                      <Skeleton className={cn("h-4", colIndex === 0 ? "w-2/3" : "w-1/2")} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : sortedData.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="h-48 text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Inbox className="h-12 w-12 text-muted-foreground/30 mb-2 animate-bounce" />
                    <span className="text-sm font-bold">{emptyMessage}</span>
                    {onEmptyAction && emptyActionLabel && (
                      <Button
                        type="button"
                        onClick={onEmptyAction}
                        className="mt-3 bg-[#7655aa] hover:bg-[#67489a] text-white text-xs font-bold rounded-[8px] h-8 px-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {emptyActionLabel}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((row) => {
                const rowId = getRowId(row);
                const isSelected = selectedIds.includes(rowId);

                return (
                  <TableRow
                    key={rowId}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      "group border-b border-border/50 transition-all duration-200 hover:bg-[#faf8fd] hover:shadow-[0_4px_12px_-4px_rgba(118,85,170,0.12)] animate-fade-in-row",
                      onRowClick && "cursor-pointer",
                      isSelected && "bg-primary/5 hover:bg-primary/8 border-primary/20"
                    )}
                  >
                    {selectable && (
                      <TableCell
                        className="px-4 py-3.5"
                        onClick={(e) => e.stopPropagation()} // Prevent triggering onRowClick
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectRow(rowId, !!checked)}
                          aria-label={`Chọn hàng ${rowId}`}
                        />
                      </TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell key={String(col.key)} className={cn("px-4 py-3.5 text-sm font-medium text-foreground", col.className)}>
                        {col.render ? col.render(row) : (row as any)[col.key]}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
