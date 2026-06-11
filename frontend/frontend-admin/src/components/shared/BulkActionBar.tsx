import type { ReactNode } from "react";
import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BulkActionBarProps {
  count: number;
  onDelete: () => void;
  onClear: () => void;
  className?: string;
  /** Optional extra action buttons rendered before the delete button */
  extraActions?: ReactNode;
}

export function BulkActionBar({ count, onDelete, onClear, className, extraActions }: BulkActionBarProps) {
  return (
    // ⚠️ Slide-up animation khi appear
    <div
      className={cn(
        "fixed bottom-6 left-1/2 z-50 -translate-x-1/2",
        "flex items-center gap-3 rounded-[14px] bg-[#3d2a5c] px-5 py-3 shadow-[0_8px_32px_rgba(37,28,52,0.35)]",
        "animate-in slide-in-from-bottom-4 duration-200",
        className,
      )}
    >
      <span className="text-sm font-semibold text-white">
        Đã chọn <span className="rounded-full bg-white/20 px-2 py-0.5 font-bold">{count}</span> mục
      </span>

      <div className="h-5 w-px bg-white/20" />

      {extraActions}

      <Button
        variant="destructive"
        size="sm"
        className="h-8 rounded-[8px] bg-destructive hover:bg-destructive/90"
        onClick={onDelete}
      >
        <Trash2 className="h-4 w-4" />
        Xóa tất cả
      </Button>

      <button
        type="button"
        onClick={onClear}
        className="text-white/60 hover:text-white transition-colors"
        title="Bỏ chọn"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
