import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Edit2,
  Trash2,
  Plus,
  Clock,
  Flame,
  Users,
  Globe,
  Lock,
  List,
  Grid as GridIcon,
  BookOpen,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import type { RecipeWithIngredients } from "@/api/adminRecipeApi";
import { adminRecipeApi } from "@/api/adminRecipeApi";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function RecipeListPage() {
  const navigate = useNavigate();

  // States
  const [recipes, setRecipes] = useState<RecipeWithIngredients[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Dialogs
  const [deleteTarget, setDeleteTarget] = useState<RecipeWithIngredients | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Load Data
  const loadRecipes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminRecipeApi.list();
      setRecipes(data);
    } catch (error) {
      toast.error("Không thể tải danh sách công thức.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  // Reset page
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Filtering
  const filteredRecipes = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return recipes.filter((r) =>
      r.name_vi.toLowerCase().includes(q) ||
      r.name_en.toLowerCase().includes(q) ||
      (r.description ?? "").toLowerCase().includes(q)
    );
  }, [recipes, searchQuery]);

  // Pagination
  const paginatedRecipes = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecipes.slice(start, start + pageSize);
  }, [filteredRecipes, currentPage, pageSize]);

  // Delete Single
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await adminRecipeApi.delete(deleteTarget.id);
      toast.success(`Đã xóa công thức ${deleteTarget.name_vi} thành công!`);
      setDeleteTarget(null);
      await loadRecipes();
    } catch (error) {
      toast.error("Không thể xóa công thức món ăn.");
    } finally {
      setActionLoading(false);
    }
  };


  // Columns for Table View
  const columns: Column<RecipeWithIngredients>[] = useMemo(
    () => [
      {
        key: "name_vi",
        header: "Tên công thức",
        sortable: true,
        render: (row) => (
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border/40 bg-muted flex items-center justify-center">
              {row.image_url ? (
                <img
                  src={row.image_url}
                  alt={row.name_vi}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <BookOpen className="h-5 w-5 text-muted-foreground/40" />
              )}
            </div>
            <div>
              <div className="font-bold text-sm text-foreground">{row.name_vi}</div>
              <div className="text-xs font-semibold text-muted-foreground">{row.name_en}</div>
              {row.description && (
                <div className="text-xs text-muted-foreground truncate max-w-[250px]">{row.description}</div>
              )}
            </div>
          </div>
        ),
      },
      {
        key: "prep_time",
        header: "Thời gian",
        sortable: true,
        render: (row) => (
          <div className="space-y-1 text-xs font-semibold text-foreground/80">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-[#7655aa]" />
              <span>Chuẩn bị {row.prep_time ?? 0} phút</span>
            </div>
            <div className="flex items-center gap-1">
              <Flame className="h-3 w-3 text-amber-500" />
              <span>Nấu {row.cook_time ?? 0} phút</span>
            </div>
          </div>
        ),
      },
      {
        key: "servings",
        header: "Khẩu phần",
        sortable: true,
        render: (row) => (
          <span className="inline-flex items-center gap-1 font-semibold text-xs text-foreground/80">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            {row.servings ?? 0}
          </span>
        ),
      },
      {
        key: "is_public",
        header: "Hiển thị",
        render: (row) =>
          row.is_public ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              <Globe className="h-3 w-3" /> Công khai
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-muted text-muted-foreground border-border">
              <Lock className="h-3 w-3" /> Riêng tư
            </span>
          ),
      },
      {
        key: "ingredients_count",
        header: "Nguyên liệu",
        className: "hidden md:table-cell",
        render: (row) => <span className="font-bold text-xs text-primary">{row.ingredients.length} món</span>,
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
              onClick={() => navigate(`/recipes/${row.id}`)}
              title="Chỉnh sửa công thức"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:bg-destructive/15"
              onClick={() => setDeleteTarget(row)}
              title="Xóa công thức"
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
        title="Quản Lý Công Thức Món Ăn"
        description="Quản lý kho công thức nấu ăn thông minh chuẩn dành cho các hộ gia đình."
        actions={
          <Button
            onClick={() => navigate("/recipes/new")}
            className="bg-[#7655aa] hover:bg-[#67489a] font-bold rounded-[8px] flex items-center gap-1.5 h-10 px-4 text-white animate-fade-in"
          >
            <Plus className="h-4 w-4" />
            Thêm công thức
          </Button>
        }
      />

      {/* Controls */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Tìm công thức theo tên hoặc mô tả..."
          className="flex-1"
        />

        {/* View mode toggle */}
        <div className="flex items-center gap-1.5 bg-card border border-border/50 p-1 rounded-xl self-end">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={() => setViewMode("grid")}
            title="Dạng lưới"
          >
            <GridIcon className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={() => setViewMode("table")}
            title="Dạng danh sách"
          >
            <List className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Grid or Table list */}
      <div className="relative">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="rounded-[20px] h-[340px] animate-pulse bg-card/60" />
            ))}
          </div>
        ) : viewMode === "grid" ? (
          filteredRecipes.length === 0 ? (
              <div className="h-60 border border-dashed border-border rounded-[20px] flex flex-col items-center justify-center gap-2 text-muted-foreground bg-card/40">
              <BookOpen className="h-10 w-10 opacity-30" />
              <span className="text-sm font-semibold">Không tìm thấy công thức nào.</span>
              <Button
                type="button"
                onClick={() => navigate("/recipes/new")}
                className="mt-2 bg-[#7655aa] hover:bg-[#67489a] text-white text-xs font-bold rounded-[8px] h-8 px-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Thêm công thức mới
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedRecipes.map((recipe) => (
                <Card
                  key={recipe.id}
                  className="rounded-[20px] overflow-hidden border-border/50 bg-card shadow-card flex flex-col justify-between group transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div>
                    {/* Header */}
                    <div className="relative h-32 w-full bg-muted border-b border-border/30 overflow-hidden flex items-center justify-center">
                      {recipe.image_url ? (
                        <img
                          src={recipe.image_url}
                          alt={recipe.name_vi}
                          className="absolute inset-0 h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : null}
                      <BookOpen className="h-10 w-10 text-muted-foreground/40" />

                      <div className="absolute top-3 left-3 bg-[#4b3178]/80 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[10px] font-bold border border-white/10">
                        {recipe.ingredients.length} nguyên liệu
                      </div>

                      <div className="absolute top-3 right-3">
                        {recipe.is_public ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-500/90 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                            <Globe className="h-3 w-3" /> Công khai
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-muted-foreground/80 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                            <Lock className="h-3 w-3" /> Riêng tư
                          </span>
                        )}
                      </div>
                    </div>

                    <CardContent className="p-5 space-y-2">
                      <h3 className="font-extrabold text-base text-foreground leading-tight line-clamp-1">
                        {recipe.name_vi}
                      </h3>
                      <p className="text-xs font-semibold text-muted-foreground leading-relaxed line-clamp-1">
                        {recipe.name_en}
                      </p>
                      {recipe.description && (
                        <p className="text-xs font-semibold text-muted-foreground line-clamp-2 leading-relaxed h-8">
                          {recipe.description}
                        </p>
                      )}

                      {/* Meta information tags */}
                      <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] font-bold text-muted-foreground">
                        <div className="flex items-center gap-1 bg-[#eee9f7] text-[#7655aa] px-2 py-0.5 rounded-lg">
                          <Clock className="h-3 w-3 shrink-0" />
                          <span>{recipe.prep_time ?? 0} phút</span>
                        </div>
                        <div className="flex items-center gap-1 bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-lg">
                          <Flame className="h-3.5 w-3.5 shrink-0" />
                          <span>{recipe.cook_time ?? 0} phút</span>
                        </div>
                        <div className="flex items-center gap-1 bg-teal-500/10 text-teal-600 px-2 py-0.5 rounded-lg">
                          <Users className="h-3.5 w-3.5 shrink-0" />
                          <span>{recipe.servings ?? 0} phần</span>
                        </div>
                      </div>
                    </CardContent>
                  </div>

                  {/* Actions footer */}
                  <div className="p-4 border-t border-border/40 bg-muted/20 flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-[8px] h-8 px-2.5 text-xs text-[#7655aa] hover:bg-[#7655aa]/10"
                      onClick={() => navigate(`/recipes/${recipe.id}`)}
                    >
                      <Edit2 className="h-3.5 w-3.5 mr-1" />
                      Sửa
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-[8px] h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteTarget(recipe)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Xóa
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )
        ) : (
          <DataTable
            data={paginatedRecipes}
            columns={columns}
            getRowId={(row) => String(row.id)}
            loading={loading}
            emptyMessage="Không tìm thấy công thức nấu ăn nào."
            emptyActionLabel="Thêm công thức mới"
            onEmptyAction={() => navigate("/recipes/new")}
          />
        )}

        <Pagination
          total={filteredRecipes.length}
          page={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Delete confirm dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Xóa công thức ${deleteTarget?.name_vi}?`}
        description={
          <div className="space-y-2">
            <p>Hành động này sẽ gỡ bỏ hoàn toàn công thức này ra khỏi hệ thống.</p>
            <div className="flex items-center gap-2 p-3 bg-rose-500/10 text-xs font-bold text-destructive rounded-xl border border-destructive/20">
              <AlertTriangle className="h-4 w-4 shrink-0 animate-bounce" />
              <span>
                Lưu ý: Mọi kế hoạch thực đơn bữa ăn gia đình chứa món này cũng sẽ bị hủy bỏ!
              </span>
            </div>
          </div>
        }
        primaryLabel="Xóa công thức"
        type="destructive"
        onConfirm={handleDelete}
        isLoading={actionLoading}
      />
    </div>
  );
}
export default RecipeListPage;
