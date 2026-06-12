import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaginationProps {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export function Pagination({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <div className={`flex flex-col items-center justify-between gap-4 py-4 sm:flex-row${className ? ` ${className}` : ""}`}>
      <div className="text-sm font-medium text-white/70">
        Hiển thị <span className="font-bold text-white">{from}</span> -{" "}
        <span className="font-bold text-white">{to}</span> trong{" "}
        <span className="font-bold text-white">{total}</span> kết quả
      </div>
      
      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white/70 whitespace-nowrap">Hàng trên trang</span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => {
                onPageSizeChange(Number(val));
                onPageChange(1); // Reset to page 1
              }}
            >
              <SelectTrigger className="h-8 w-[70px] rounded-[8px] border-border bg-card">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((opt) => (
                  <SelectItem key={opt} value={String(opt)}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center gap-1">
          {/* First page */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-[8px] border-border bg-card"
            onClick={() => onPageChange(1)}
            disabled={page === 1}
            title="Trang đầu"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          {/* Previous page */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-[8px] border-border bg-card"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            title="Trang trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Page indicator */}
          <div className="flex items-center justify-center px-3 text-sm font-bold text-white min-w-[70px]">
            {page} / {totalPages}
          </div>

          {/* Next page */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-[8px] border-border bg-card"
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            title="Trang sau"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Last page */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-[8px] border-border bg-card"
            onClick={() => onPageChange(totalPages)}
            disabled={page === totalPages}
            title="Trang cuối"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
