import * as React from "react";
import { AppModal } from "./AppModal";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  primaryLabel?: string;
  secondaryLabel?: string;
  onConfirm: () => void | Promise<void>;
  type?: "confirm" | "warning" | "destructive" | "info";
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  primaryLabel = "Xác nhận",
  secondaryLabel = "Hủy",
  onConfirm,
  type = "confirm",
  isLoading = false,
}: ConfirmDialogProps) {
  // Map type to AppModal type
  // AppModal type: "confirm" | "success" | "error" | "warning" | "info"
  const modalType = type === "destructive" ? "warning" : type;

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      type={modalType}
      title={title}
      primaryLabel={primaryLabel}
      secondaryLabel={secondaryLabel}
      onPrimary={onConfirm}
    >
      <div className="space-y-2 py-1">
        <div className="text-sm font-semibold text-[#746d82]">{description}</div>
        {isLoading && (
          <div className="text-xs text-muted-foreground animate-pulse">
            Đang xử lý, vui lòng chờ...
          </div>
        )}
      </div>
    </AppModal>
  );
}
