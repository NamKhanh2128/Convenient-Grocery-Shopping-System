import { useEffect, useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import {
  Bell,
  CheckCheck,
  Eye,
  Trash2,
  MailOpen,
} from "lucide-react";
import {
  adminNotificationApi,
  type NotificationWithUser,
} from "@/api/adminNotificationApi";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { FilterBar, type FilterConfig } from "@/components/shared/FilterBar";
import { BulkActionBar } from "@/components/shared/BulkActionBar";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { AppModal } from "@/components/shared/AppModal";

// ── Schema-backed type values ─────────────────────────────────────────────────
// notifications.type — examples from schema description
const TYPE_LABELS: Record<string, string> = {
  expiration: "Hết hạn",
  shopping_update: "Mua sắm",
  meal_plan: "Thực đơn",
  system: "Hệ thống",
  info: "Thông tin",
};

const TYPE_COLORS: Record<string, string> = {
  expiration: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  shopping_update: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  meal_plan: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  system: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  info: "bg-[#eee9f7] text-[#7655aa] border-[#7655aa]/20",
};

const PAGE_SIZE_DEFAULT = 20;

export function NotificationListPage() {
  const [notifications, setNotifications] = useState<NotificationWithUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterIsRead, setFilterIsRead] = useState<string>("ALL");

  // Pagination (server-side)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);

  // Selections
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Dialog states
  const [deleteTarget, setDeleteTarget] = useState<NotificationWithUser | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [detailNotif, setDetailNotif] = useState<NotificationWithUser | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const offset = (currentPage - 1) * pageSize;

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminNotificationApi.list({
        search: searchQuery || undefined,
        type: filterType !== "ALL" ? filterType : undefined,
        is_read: filterIsRead !== "ALL" ? filterIsRead : undefined,
        limit: pageSize,
        offset,
      });
      setNotifications(result.notifications);
      setTotal(result.total);
    } catch {
      toast.error("Không thể tải danh sách thông báo.");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterType, filterIsRead, pageSize, offset]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Reset to page 1 whenever filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType, filterIsRead]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const handleMarkAsRead = async (notif: NotificationWithUser) => {
    try {
      await adminNotificationApi.markAsRead(notif.id);
      toast.success("Đã đánh dấu là đã đọc.");
      await loadNotifications();
    } catch {
      toast.error("Không thể cập nhật trạng thái thông báo.");
    }
  };

  const handleBulkMarkAsRead = async () => {
    setActionLoading(true);
    try {
      await adminNotificationApi.bulkMarkAsRead(selectedIds.map(Number));
      toast.success(`Đã đánh dấu ${selectedIds.length} thông báo là đã đọc.`);
      setSelectedIds([]);
      await loadNotifications();
    } catch {
      toast.error("Không thể cập nhật trạng thái thông báo.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await adminNotificationApi.markAllAsRead();
      toast.success("Đã đánh dấu tất cả thông báo là đã đọc.");
      await loadNotifications();
    } catch {
      toast.error("Không thể cập nhật trạng thái thông báo.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await adminNotificationApi.delete(deleteTarget.id);
      toast.success("Đã xóa thông báo.");
      setDeleteTarget(null);
      setSelectedIds((ids) => ids.filter((id) => id !== String(deleteTarget.id)));
      await loadNotifications();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra.";
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    setActionLoading(true);
    try {
      await adminNotificationApi.bulkDelete(selectedIds.map(Number));
      toast.success(`Đã xóa ${selectedIds.length} thông báo.`);
      setSelectedIds([]);
      setBulkDeleteOpen(false);
      await loadNotifications();
    } catch {
      toast.error("Không thể xóa thông báo.");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Filter configs ───────────────────────────────────────────────────────────

  const filterConfigs: FilterConfig[] = [
    {
      key: "type",
      label: "Loại",
      value: filterType,
      onChange: setFilterType,
      options: [
        { label: "Tất cả loại", value: "ALL" },
        { label: "Hết hạn", value: "expiration" },
        { label: "Mua sắm", value: "shopping_update" },
        { label: "Thực đơn", value: "meal_plan" },
        { label: "Hệ thống", value: "system" },
        { label: "Thông tin", value: "info" },
      ],
    },
    {
      key: "is_read",
      label: "Trạng thái",
      value: filterIsRead,
      onChange: setFilterIsRead,
      options: [
        { label: "Tất cả", value: "ALL" },
        { label: "Chưa đọc", value: "false" },
        { label: "Đã đọc", value: "true" },
      ],
    },
  ];

  // ── Columns ──────────────────────────────────────────────────────────────────

  const unreadInSelection = useMemo(
    () =>
      notifications
        .filter((n) => selectedIds.includes(String(n.id)) && !n.is_read)
        .length > 0,
    [notifications, selectedIds]
  );

  const columns: Column<NotificationWithUser>[] = useMemo(
    () => [
      {
        key: "is_read",
        header: "",
        width: "24px",
        render: (row) =>
          !row.is_read ? (
            <span className="inline-block h-2 w-2 rounded-full bg-rose-500 shrink-0" title="Chưa đọc" />
          ) : (
            <span className="inline-block h-2 w-2 rounded-full bg-transparent shrink-0" />
          ),
      },
      {
        key: "type",
        header: "Loại",
        render: (row) => {
          const colorClass = TYPE_COLORS[row.type] ?? "bg-slate-500/10 text-slate-600 border-slate-500/20";
          return (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border whitespace-nowrap ${colorClass}`}>
              {TYPE_LABELS[row.type] ?? row.type}
            </span>
          );
        },
      },
      {
        key: "title",
        header: "Tiêu đề",
        render: (row) => (
          <div>
            <span className={`text-sm font-bold ${!row.is_read ? "text-foreground" : "text-muted-foreground"}`}>
              {row.title}
            </span>
            <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
              {row.message}
            </div>
          </div>
        ),
      },
      {
        key: "user_name",
        header: "Người dùng",
        render: (row) => (
          <div>
            <span className="text-xs font-bold text-foreground">{row.user_name ?? "—"}</span>
            <div className="text-[10px] text-muted-foreground">{row.user_email ?? ""}</div>
          </div>
        ),
      },
      {
        key: "created_at",
        header: "Ngày tạo",
        render: (row) => (
          <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
            {row.created_at
              ? new Date(row.created_at).toLocaleString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—"}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Thao tác",
        render: (row) => (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {!row.is_read && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-[#7655aa] hover:bg-[#7655aa]/15"
                onClick={() => handleMarkAsRead(row)}
                title="Đánh dấu đã đọc"
              >
                <MailOpen className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[#7655aa] hover:bg-[#7655aa]/15"
              onClick={() => setDetailNotif(row)}
              title="Xem nội dung"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:bg-destructive/15"
              onClick={() => setDeleteTarget(row)}
              title="Xóa thông báo"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [notifications]
  );

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản Lý Thông Báo"
        description="Xem, lọc, và quản lý các thông báo hệ thống gửi đến người dùng."
        actions={
          <Button
            variant="outline"
            className="rounded-[8px] h-10 px-4 flex items-center gap-1.5 text-xs font-bold"
            onClick={handleMarkAllAsRead}
          >
            <CheckCheck className="h-4 w-4" />
            Đọc tất cả
          </Button>
        }
      />

      <div className="space-y-3">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Tìm theo tiêu đề, nội dung hoặc email người dùng..."
        />
        <FilterBar
          filters={filterConfigs}
          onClearAll={() => {
            setFilterType("ALL");
            setFilterIsRead("ALL");
          }}
        />
      </div>

      <div className="relative">
        <DataTable
          data={notifications}
          columns={columns}
          getRowId={(row) => String(row.id)}
          loading={loading}
          onRowClick={(row) => setDetailNotif(row)}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          emptyMessage="Không tìm thấy thông báo nào."
        />

        <Pagination
          total={total}
          page={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Bulk actions bar */}
      {selectedIds.length > 0 && (
        <BulkActionBar
          count={selectedIds.length}
          onDelete={() => setBulkDeleteOpen(true)}
          onClear={() => setSelectedIds([])}
          extraActions={
            unreadInSelection ? (
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-[6px] text-xs font-bold border-[#7655aa]/30 text-[#7655aa] hover:bg-[#7655aa]/10"
                onClick={handleBulkMarkAsRead}
                disabled={actionLoading}
              >
                <MailOpen className="h-3.5 w-3.5 mr-1" />
                Đánh dấu đã đọc
              </Button>
            ) : null
          }
        />
      )}

      {/* ── Detail modal ────────────────────────────────────────────────────── */}
      <AppModal
        open={Boolean(detailNotif)}
        onOpenChange={(open) => !open && setDetailNotif(null)}
        type="info"
        title={detailNotif?.title ?? "Thông báo"}
        primaryLabel="Đóng"
        onPrimary={() => setDetailNotif(null)}
      >
        {detailNotif && (
          <div className="space-y-3 text-sm">
            {/* Type badge */}
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                  TYPE_COLORS[detailNotif.type] ?? "bg-slate-500/10 text-slate-600 border-slate-500/20"
                }`}
              >
                {TYPE_LABELS[detailNotif.type] ?? detailNotif.type}
              </span>
              {!detailNotif.is_read && (
                <span className="flex items-center gap-1 text-[10px] font-extrabold text-rose-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 inline-block" />
                  Chưa đọc
                </span>
              )}
            </div>

            {/* Message */}
            <p className="text-sm font-medium text-foreground leading-relaxed">
              {detailNotif.message}
            </p>

            {/* Meta */}
            <div className="pt-2 border-t border-border/40 space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Bell className="h-3.5 w-3.5 shrink-0" />
                <span>
                  Gửi đến:{" "}
                  <span className="font-bold text-foreground">
                    {detailNotif.user_name ?? "—"}{" "}
                    {detailNotif.user_email ? `(${detailNotif.user_email})` : ""}
                  </span>
                </span>
              </div>
              {detailNotif.related_id && (
                <div className="flex items-center gap-1.5">
                  <span>ID liên quan: <span className="font-bold text-foreground">{detailNotif.related_id}</span></span>
                </div>
              )}
              <div>
                Ngày tạo:{" "}
                <span className="font-bold text-foreground">
                  {detailNotif.created_at
                    ? new Date(detailNotif.created_at).toLocaleString("vi-VN")
                    : "—"}
                </span>
              </div>
              <div>
                Trạng thái:{" "}
                <span className={`font-extrabold ${detailNotif.is_read ? "text-emerald-600" : "text-rose-500"}`}>
                  {detailNotif.is_read ? "Đã đọc" : "Chưa đọc"}
                </span>
              </div>
            </div>

            {/* Quick mark-as-read */}
            {!detailNotif.is_read && (
              <Button
                className="w-full mt-2 bg-[#7655aa] hover:bg-[#67489a] text-white text-xs font-bold rounded-[8px] h-9"
                onClick={async () => {
                  await handleMarkAsRead(detailNotif);
                  setDetailNotif(null);
                }}
              >
                <MailOpen className="h-4 w-4 mr-1.5" />
                Đánh dấu đã đọc
              </Button>
            )}
          </div>
        )}
      </AppModal>

      {/* ── Single delete confirm ────────────────────────────────────────────── */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Xóa thông báo "${deleteTarget?.title ?? ""}"?`}
        description="Thông báo này sẽ bị xóa vĩnh viễn. Người dùng sẽ không còn nhận được thông báo này."
        primaryLabel="Xóa thông báo"
        type="destructive"
        onConfirm={handleDelete}
        isLoading={actionLoading}
      />

      {/* ── Bulk delete confirm ──────────────────────────────────────────────── */}
      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`Xóa ${selectedIds.length} thông báo?`}
        description="Tất cả các thông báo đã chọn sẽ bị xóa vĩnh viễn. Dữ liệu không thể khôi phục."
        primaryLabel="Xóa đồng loạt"
        type="destructive"
        onConfirm={handleBulkDelete}
        isLoading={actionLoading}
      />
    </div>
  );
}

export default NotificationListPage;
