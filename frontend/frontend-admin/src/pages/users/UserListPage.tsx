import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Edit2, Trash2, Lock, Unlock, KeyRound, UserPlus, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@/types";
import { adminUserApi } from "@/api/adminUserApi";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { FilterBar, type FilterConfig } from "@/components/shared/FilterBar";
import { BulkActionBar } from "@/components/shared/BulkActionBar";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminAuthStore } from "@/store/authStore";

export function UserListPage() {
  const navigate = useNavigate();
  const currentAdmin = useAdminAuthStore((state) => state.user);

  // States
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Dialog States
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [lockTarget, setLockTarget] = useState<User | null>(null);
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState("User@123");
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Load Data
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminUserApi.list({ limit: 1000 });
      setUsers(data.users);
    } catch (error) {
      toast.error("Không thể tải danh sách người dùng.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterRole, filterStatus]);

  // Filtered & Paginated Data
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.phone && u.phone.includes(searchQuery));

      const matchesRole = filterRole === "ALL" || u.role === filterRole;
      
      const matchesStatus =
        filterStatus === "ALL" ||
        (filterStatus === "LOCKED" && u.is_locked) ||
        (filterStatus === "ACTIVE" && !u.is_locked);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, filterRole, filterStatus]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  // Bulk deletion handler
  const handleBulkDelete = async () => {
    setActionLoading(true);
    try {
      await adminUserApi.bulkDelete(selectedIds.map(Number));
      toast.success(`Đã xóa thành công ${selectedIds.length} người dùng!`);
      setSelectedIds([]);
      setBulkDeleteOpen(false);
      await loadUsers();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Đã xảy ra lỗi khi xóa.";
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle single lock
  const handleToggleLock = async () => {
    if (!lockTarget) return;
    setActionLoading(true);
    try {
      await adminUserApi.toggleLock(lockTarget.id);
      toast.success(
        `${lockTarget.is_locked ? "Mở khóa" : "Khóa"} tài khoản ${lockTarget.full_name} thành công!`
      );
      setLockTarget(null);
      await loadUsers();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Đã xảy ra lỗi.";
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  // Single delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await adminUserApi.delete(deleteTarget.id);
      toast.success(`Đã xóa tài khoản ${deleteTarget.full_name} thành công!`);
      setDeleteTarget(null);
      await loadUsers();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Đã xảy ra lỗi khi xóa.";
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  // Password reset handler
  const handleResetPassword = async () => {
    if (!resetTarget) return;
    if (resetPasswordValue.length < 8) {
      toast.error("Mật khẩu mới phải từ 8 ký tự trở lên.");
      return;
    }
    setActionLoading(true);
    try {
      await adminUserApi.resetPassword(resetTarget.id, resetPasswordValue);
      toast.success(`Đã đặt lại mật khẩu cho ${resetTarget.full_name} thành công!`);
      setResetTarget(null);
      setResetPasswordValue("User@123");
    } catch (error) {
      toast.error("Đặt lại mật khẩu thất bại.");
    } finally {
      setActionLoading(false);
    }
  };

  // Filter Config
  const filterConfigs: FilterConfig[] = [
    {
      key: "role",
      label: "Vai trò",
      value: filterRole,
      onChange: setFilterRole,
      options: [
        { label: "Tất cả vai trò", value: "ALL" },
        { label: "Quản trị viên (ADMIN)", value: "ADMIN" },
        { label: "Người dùng (USER)", value: "USER" },
      ],
    },
    {
      key: "status",
      label: "Trạng thái",
      value: filterStatus,
      onChange: setFilterStatus,
      options: [
        { label: "Tất cả trạng thái", value: "ALL" },
        { label: "Đang hoạt động", value: "ACTIVE" },
        { label: "Đang bị khóa", value: "LOCKED" },
      ],
    },
  ];

  // Column definitions
  const columns: Column<User>[] = useMemo(
    () => [
      {
        key: "full_name",
        header: "Người dùng",
        sortable: true,
        render: (row) => (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-[#eee9f7] border border-primary/20 text-primary flex items-center justify-center font-bold text-sm">
              {row.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                {row.full_name}
                {row.email === currentAdmin?.email && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-primary/10 text-primary border border-primary/20">
                    Bạn
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">{row.email}</div>
            </div>
          </div>
        ),
      },
      {
        key: "phone",
        header: "Số điện thoại",
        className: "hidden md:table-cell",
        render: (row) => <span className="font-semibold text-xs text-foreground/80">{row.phone ?? "—"}</span>,
      },
      {
        key: "role",
        header: "Vai trò",
        sortable: true,
        render: (row) => {
          const isAdmin = row.role === "ADMIN";
          return (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                isAdmin
                  ? "bg-[#eee9f7] text-[#7655aa] border-[#7655aa]/20"
                  : "bg-teal-500/10 text-teal-600 border-teal-500/20"
              }`}
            >
              {isAdmin ? "Quản trị viên" : "Người dùng"}
            </span>
          );
        },
      },
      {
        key: "status",
        header: "Trạng thái",
        render: (row) => (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
              row.is_locked
                ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
            }`}
          >
            {!row.is_locked && (
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
            )}
            {row.is_locked ? "Bị khóa" : "Hoạt động"}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Thao tác",
        render: (row) => {
          const isSelf = row.email === currentAdmin?.email;

          return (
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-[#7655aa] hover:bg-[#7655aa]/15"
                onClick={() => navigate(`/users/${row.id}`)}
                title="Chỉnh sửa"
              >
                <Edit2 className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                disabled={isSelf}
                className={`h-8 w-8 ${
                  row.is_locked ? "text-emerald-600 hover:bg-emerald-500/15" : "text-amber-600 hover:bg-amber-500/15"
                }`}
                onClick={() => setLockTarget(row)}
                title={row.is_locked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
              >
                {row.is_locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-blue-600 hover:bg-blue-500/15"
                onClick={() => setResetTarget(row)}
                title="Đổi mật khẩu nhanh"
              >
                <KeyRound className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                disabled={isSelf}
                className="h-8 w-8 text-destructive hover:bg-destructive/15"
                onClick={() => setDeleteTarget(row)}
                title="Xóa tài khoản"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [currentAdmin, navigate]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản Lý Người Dùng"
        description="Quản lý và cấp quyền cho thành viên tham gia NAT-EAT."
        actions={
          <Button
            onClick={() => navigate("/users/new")}
            className="bg-[#7655aa] hover:bg-[#67489a] font-bold rounded-[8px] flex items-center gap-1.5 h-10 px-4 text-white"
          >
            <UserPlus className="h-4 w-4" />
            Thêm người dùng
          </Button>
        }
      />

      {/* Control Panel */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Tìm kiếm theo họ tên, email hoặc số điện thoại..."
            className="flex-1"
          />
        </div>

        <FilterBar
          filters={filterConfigs}
          onClearAll={() => {
            setFilterRole("ALL");
            setFilterStatus("ALL");
          }}
        />
      </div>

      {/* Data Table */}
      <div className="relative">
        <DataTable
          data={paginatedUsers}
          columns={columns}
          getRowId={(row) => String(row.id)}
          loading={loading}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          emptyMessage="Không tìm thấy người dùng nào phù hợp với bộ lọc."
          emptyActionLabel="Thêm người dùng mới"
          onEmptyAction={() => navigate("/users/new")}
        />

        <Pagination
          total={filteredUsers.length}
          page={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <BulkActionBar
          count={selectedIds.length}
          onDelete={() => setBulkDeleteOpen(true)}
          onClear={() => setSelectedIds([])}
        />
      )}

      {/* Dialog: Lock/Unlock */}
      <ConfirmDialog
        open={Boolean(lockTarget)}
        onOpenChange={(open) => !open && setLockTarget(null)}
        title={lockTarget?.is_locked ? "Mở khóa tài khoản?" : "Khóa tài khoản?"}
        description={
          lockTarget?.is_locked
            ? `Tài khoản của ${lockTarget?.full_name} sẽ được kích hoạt trở lại và có thể đăng nhập bình thường.`
            : `Tài khoản của ${lockTarget?.full_name} sẽ không thể truy cập vào ứng dụng NAT-EAT nữa.`
        }
        primaryLabel={lockTarget?.is_locked ? "Kích hoạt" : "Khóa tài khoản"}
        type={lockTarget?.is_locked ? "confirm" : "warning"}
        onConfirm={handleToggleLock}
        isLoading={actionLoading}
      />

      {/* Dialog: Delete */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Xóa tài khoản của ${deleteTarget?.full_name}?`}
        description={
          <div className="space-y-2">
            <p>Hành động này không thể hoàn tác. Mọi liên kết gia đình sẽ bị xóa vĩnh viễn.</p>
            <div className="flex items-center gap-2 p-3 bg-rose-500/10 text-xs font-bold text-destructive rounded-xl border border-destructive/20">
              <ShieldAlert className="h-4 w-4 shrink-0 animate-bounce" />
              <span>Cảnh báo: Người dùng sẽ mất quyền truy cập tức thì.</span>
            </div>
          </div>
        }
        primaryLabel="Xóa vĩnh viễn"
        type="destructive"
        onConfirm={handleDelete}
        isLoading={actionLoading}
      />

      {/* Dialog: Bulk Delete */}
      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`Xóa vĩnh viễn ${selectedIds.length} người dùng?`}
        description="Hành động này sẽ xóa đồng loạt tất cả các tài khoản được chọn cùng các liên kết gia đình liên quan. Dữ liệu không thể khôi phục."
        primaryLabel="Xóa tất cả"
        type="destructive"
        onConfirm={handleBulkDelete}
        isLoading={actionLoading}
      />

      {/* Dialog: Reset Password */}
      <ConfirmDialog
        open={Boolean(resetTarget)}
        onOpenChange={(open) => !open && setResetTarget(null)}
        title={`Đặt lại mật khẩu cho ${resetTarget?.full_name}`}
        description={
          <div className="space-y-3 pt-2">
            <p className="text-xs font-semibold text-muted-foreground">
              Nhập mật khẩu mới cho người dùng (tối thiểu 8 ký tự):
            </p>
            <Input
              type="text"
              value={resetPasswordValue}
              onChange={(e) => setResetPasswordValue(e.target.value)}
              placeholder="Nhập mật khẩu mới"
              className="h-10 rounded-[8px] font-sans"
            />
          </div>
        }
        primaryLabel="Cập nhật mật khẩu"
        type="confirm"
        onConfirm={handleResetPassword}
        isLoading={actionLoading}
      />
    </div>
  );
}
export default UserListPage;
