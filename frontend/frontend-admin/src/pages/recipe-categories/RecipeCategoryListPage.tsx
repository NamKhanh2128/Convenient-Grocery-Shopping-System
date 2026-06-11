import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Edit2, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import type { RecipeCategory } from "@/types";
import { adminRecipeCategoryApi } from "@/api/adminRecipeCategoryApi";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { BulkActionBar } from "@/components/shared/BulkActionBar";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";

export function RecipeCategoryListPage() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState<RecipeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [deleteTarget, setDeleteTarget] = useState<RecipeCategory | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminRecipeCategoryApi.list();
      setCategories(data);
    } catch (error) {
      toast.error("Không thể tải danh sách danh mục công thức.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return categories.filter(
      (c) =>
        c.ten_danh_muc.toLowerCase().includes(q) ||
        (c.mo_ta ?? "").toLowerCase().includes(q)
    );
  }, [categories, searchQuery]);

  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCategories.slice(start, start + pageSize);
  }, [filteredCategories, currentPage, pageSize]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await adminRecipeCategoryApi.delete(deleteTarget.danh_muc_cong_thuc_id);
      toast.success(`Đã xóa danh mục ${deleteTarget.ten_danh_muc} thành công!`);
      setDeleteTarget(null);
      await loadCategories();
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
      await adminRecipeCategoryApi.bulkDelete(selectedIds.map(Number));
      toast.success(`Đã xóa thành công ${selectedIds.length} danh mục!`);
      setSelectedIds([]);
      setBulkDeleteOpen(false);
      await loadCategories();
    } catch (error) {
      toast.error("Không thể xóa loạt danh mục.");
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column<RecipeCategory>[] = useMemo(
    () => [
      {
        key: "ten_danh_muc",
        header: "Tên danh mục",
        sortable: true,
        render: (row) => <span className="font-bold text-sm text-foreground">{row.ten_danh_muc}</span>,
      },
      {
        key: "mo_ta",
        header: "Mô tả",
        render: (row) => (
          <span className="text-xs font-semibold text-muted-foreground line-clamp-2 max-w-[320px] block">
            {row.mo_ta || "—"}
          </span>
        ),
      },
      {
        key: "ngay_tao",
        header: "Ngày tạo",
        sortable: true,
        render: (row) => (
          <span className="text-xs font-semibold text-muted-foreground">
            {row.ngay_tao ? new Date(row.ngay_tao).toLocaleDateString("vi-VN") : "—"}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Thao tác",
        render: (row) => (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[#7655aa] hover:bg-[#7655aa]/15"
              onClick={() => navigate(`/recipe-categories/${row.danh_muc_cong_thuc_id}`)}
              title="Chỉnh sửa danh mục"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:bg-destructive/15"
              onClick={() => setDeleteTarget(row)}
              title="Xóa danh mục"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [navigate]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản Lý Danh Mục Công Thức"
        description="Quản lý các danh mục phân loại công thức món ăn trong hệ thống."
        actions={
          <Button
            onClick={() => navigate("/recipe-categories/new")}
            className="bg-[#7655aa] hover:bg-[#67489a] font-bold rounded-[8px] flex items-center gap-1.5 h-10 px-4 text-white"
          >
            <Plus className="h-4 w-4" />
            Thêm danh mục
          </Button>
        }
      />

      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Tìm danh mục theo tên hoặc mô tả..."
      />

      <div className="relative">
        <DataTable
          data={paginatedCategories}
          columns={columns}
          getRowId={(row) => String(row.danh_muc_cong_thuc_id)}
          loading={loading}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          emptyMessage="Không tìm thấy danh mục công thức nào."
          emptyActionLabel="Thêm danh mục mới"
          onEmptyAction={() => navigate("/recipe-categories/new")}
        />

        <Pagination
          total={filteredCategories.length}
          page={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {selectedIds.length > 0 && (
        <BulkActionBar
          count={selectedIds.length}
          onDelete={() => setBulkDeleteOpen(true)}
          onClear={() => setSelectedIds([])}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Xóa danh mục ${deleteTarget?.ten_danh_muc}?`}
        description="Hành động này sẽ xóa vĩnh viễn danh mục công thức này khỏi hệ thống."
        primaryLabel="Xóa danh mục"
        type="destructive"
        onConfirm={handleDelete}
        isLoading={actionLoading}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`Xóa loạt ${selectedIds.length} danh mục?`}
        description="Toàn bộ các danh mục đã chọn sẽ bị loại bỏ vĩnh viễn. Dữ liệu không thể khôi phục."
        primaryLabel="Xóa đồng loạt"
        type="destructive"
        onConfirm={handleBulkDelete}
        isLoading={actionLoading}
      />
    </div>
  );
}
export default RecipeCategoryListPage;
