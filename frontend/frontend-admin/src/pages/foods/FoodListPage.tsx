import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Edit2, Trash2, Plus, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { Food } from "@/types";
import { adminFoodApi } from "@/api/adminFoodApi";
import { foodCategories } from "@/constants/options";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { FilterBar, type FilterConfig } from "@/components/shared/FilterBar";
import { BulkActionBar } from "@/components/shared/BulkActionBar";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";

export function FoodListPage() {
  const navigate = useNavigate();

  // States
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Dialog States
  const [deleteTarget, setDeleteTarget] = useState<Food | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Load Data
  const loadFoods = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFoodApi.list();
      setFoods(data);
    } catch (error) {
      toast.error("Không thể tải danh sách thực phẩm.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFoods();
  }, [loadFoods]);

  // Reset page on filters changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCategory]);

  // Filtering
  const filteredFoods = useMemo(() => {
    return foods.filter((f) => {
      const matchesSearch = f.food_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === "ALL" || f.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [foods, searchQuery, filterCategory]);

  // Pagination
  const paginatedFoods = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredFoods.slice(start, start + pageSize);
  }, [filteredFoods, currentPage, pageSize]);

  // Single Delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await adminFoodApi.delete(deleteTarget.food_id);
      toast.success(`Đã xóa thực phẩm ${deleteTarget.food_name} thành công!`);
      setDeleteTarget(null);
      await loadFoods();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra.";
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    setActionLoading(true);
    try {
      await adminFoodApi.bulkDelete(selectedIds);
      toast.success(`Đã xóa thành công ${selectedIds.length} thực phẩm!`);
      setSelectedIds([]);
      setBulkDeleteOpen(false);
      await loadFoods();
    } catch (error) {
      toast.error("Không thể xóa loạt thực phẩm.");
    } finally {
      setActionLoading(false);
    }
  };

  // Filter Bar Configs
  const filterConfigs: FilterConfig[] = [
    {
      key: "category",
      label: "Danh mục",
      value: filterCategory,
      onChange: setFilterCategory,
      options: [
        { label: "Tất cả danh mục", value: "ALL" },
        ...foodCategories.map((c) => ({ label: c, value: c })),
      ],
    },
  ];

  // Column definitions
  const columns: Column<Food>[] = useMemo(
    () => [
      {
        key: "icon",
        header: "Biểu tượng",
        render: (row) => (
          <div className="h-9 w-9 rounded-xl bg-card border border-border/50 flex items-center justify-center text-xl shadow-sm">
            {row.icon ?? "🥦"}
          </div>
        ),
        width: "80px",
      },
      {
        key: "food_name",
        header: "Tên thực phẩm",
        sortable: true,
        render: (row) => <span className="font-bold text-sm text-foreground">{row.food_name}</span>,
      },
      {
        key: "category",
        header: "Danh mục",
        sortable: true,
        render: (row) => {
          const categoryColors: Record<string, string> = {
            "Rau củ": "bg-green-500/10 text-green-600 border-green-500/20",
            "Thịt cá": "bg-rose-500/10 text-rose-600 border-rose-500/20",
            "Đồ khô": "bg-amber-500/10 text-amber-600 border-amber-500/20",
            "Sữa & Trứng": "bg-blue-500/10 text-blue-600 border-blue-500/20",
            "Gia vị": "bg-purple-500/10 text-purple-600 border-purple-500/20",
            "Khác": "bg-slate-500/10 text-slate-600 border-slate-500/20",
          };
          const colorClass = categoryColors[row.category] || categoryColors["Khác"]!;
          return (
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${colorClass}`}>
              {row.category}
            </span>
          );
        },
      },
      {
        key: "unit",
        header: "Đơn vị đo",
        render: (row) => <span className="font-semibold text-xs text-muted-foreground">{row.unit}</span>,
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
              onClick={() => navigate(`/foods/${row.food_id}`)}
              title="Chỉnh sửa thực phẩm"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:bg-destructive/15"
              onClick={() => setDeleteTarget(row)}
              title="Xóa thực phẩm"
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
        title="Quản Lý Thực Phẩm"
        description="Quản lý danh sách thực phẩm chuẩn của hệ thống để đồng bộ lên kho ứng dụng gia đình."
        actions={
          <Button
            onClick={() => navigate("/foods/new")}
            className="bg-[#7655aa] hover:bg-[#67489a] font-bold rounded-[8px] flex items-center gap-1.5 h-10 px-4 text-white"
          >
            <Plus className="h-4 w-4" />
            Thêm thực phẩm
          </Button>
        }
      />

      {/* Controls */}
      <div className="space-y-3">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Tìm tên thực phẩm..."
        />
        <FilterBar
          filters={filterConfigs}
          onClearAll={() => setFilterCategory("ALL")}
        />
      </div>

      {/* Grid Table */}
      <div className="relative">
        <DataTable
          data={paginatedFoods}
          columns={columns}
          getRowId={(row) => row.food_id}
          loading={loading}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          emptyMessage="Không tìm thấy thực phẩm nào phù hợp."
          emptyActionLabel="Thêm thực phẩm chuẩn"
          onEmptyAction={() => navigate("/foods/new")}
        />

        <Pagination
          total={filteredFoods.length}
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

      {/* Delete Single */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Xóa thực phẩm ${deleteTarget?.food_name}?`}
        description={
          <div className="space-y-2">
            <p>Hành động này sẽ xóa vĩnh viễn thực phẩm này khỏi ngân hàng dữ liệu chuẩn.</p>
            <div className="flex items-center gap-2 p-3 bg-rose-500/10 text-xs font-bold text-destructive rounded-xl border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0 animate-pulse" />
              <span>
                Lưu ý: Mọi nguyên liệu trong tủ lạnh và công thức chứa thực phẩm này cũng sẽ bị xóa liên đới!
              </span>
            </div>
          </div>
        }
        primaryLabel="Xóa thực phẩm"
        type="destructive"
        onConfirm={handleDelete}
        isLoading={actionLoading}
      />

      {/* Bulk Delete */}
      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`Xóa loạt ${selectedIds.length} thực phẩm?`}
        description="Toàn bộ các thực phẩm đã chọn sẽ bị loại bỏ vĩnh viễn cùng các liên kết nguyên liệu tủ lạnh & công thức món ăn liên quan. Dữ liệu không thể khôi phục."
        primaryLabel="Xóa đồng loạt"
        type="destructive"
        onConfirm={handleBulkDelete}
        isLoading={actionLoading}
      />
    </div>
  );
}
export default FoodListPage;
