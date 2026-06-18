import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type ModalType = "confirm" | "success" | "error" | "warning" | "info";

const iconMap = {
  confirm: AlertTriangle,
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap = {
  confirm: "text-[#ffad1f]",
  success: "text-[#31c875]",
  error: "text-destructive",
  warning: "text-[#ff8a00]",
  info: "text-[#3488ed]",
};

export function AppModal({
  open,
  type = "info",
  title,
  children,
  primaryLabel,
  secondaryLabel = "Đóng",
  onPrimary,
  onSecondary,
  onOpenChange,
  closeOnPrimary = true,
  closeOnSecondary = true,
}: {
  open: boolean;
  type?: ModalType;
  title: string;
  children?: ReactNode;
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimary?: () => void | Promise<void>;
  onSecondary?: () => void;
  onOpenChange: (open: boolean) => void;
  // Set to false for multi-step flows (e.g. a cooking-steps wizard) where the
  // primary/secondary action should just advance/go-back state without
  // closing the dialog — the caller closes it explicitly when actually done.
  closeOnPrimary?: boolean;
  closeOnSecondary?: boolean;
}) {
  const Icon = iconMap[type];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[8px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Icon className={`h-7 w-7 ${colorMap[type]}`} />
            <DialogTitle>{title}</DialogTitle>
          </div>
        </DialogHeader>
        <div className="text-sm text-[#5f586d]">{children}</div>
        <DialogFooter>
          <Button
            variant="outline"
            className="rounded-[8px]"
            onClick={() => { onSecondary?.(); if (closeOnSecondary) onOpenChange(false); }}
          >
            {secondaryLabel}
          </Button>
          {primaryLabel && (
            <Button
              className="rounded-[8px] bg-[#7655aa]"
              onClick={async () => { await onPrimary?.(); if (closeOnPrimary) onOpenChange(false); }}
            >
              {primaryLabel}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
