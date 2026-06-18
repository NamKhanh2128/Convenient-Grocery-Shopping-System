import { ChefHat, Flame, Heart, Lightbulb, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/modules/auth/store/authStore";
import { useRecipeStore } from "@/modules/recipe/store/recipeStore";
import { ScreenHeader } from "@/shared/components/ScreenHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppModal } from "@/shared/components/AppModal";

const TIME_TAGS = [
  { value: "all", label: "Tất cả" },
  { value: "nhanh", label: "Nhanh <30p" },
  { value: "vua", label: "Vừa 30–60p" },
  { value: "lau", label: "Lâu >60p" },
];

export function RecipeListPage() {
  const navigate = useNavigate();
  const family = useAuthStore((state) => state.family)!;
  const {
    recipes,
    popular,
    loading,
    error,
    search,
    timeTag,
    privacy,
    setSearch,
    setTimeTag,
    setPrivacy,
    load,
    loadPopular,
    remove,
    toggleFavorite,
  } = useRecipeStore();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    void loadPopular(family.family_id);
  }, [family.family_id, loadPopular]);

  useEffect(() => {
    const delay = search.trim() ? 250 : 0;
    const timer = window.setTimeout(() => {
      void load(family.family_id);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [family.family_id, search, timeTag, privacy, load]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  return (
    <>
      <ScreenHeader
        title="Công thức nấu ăn"
        subtitle="Khám phá, tạo và gợi ý món từ nguyên liệu trong tủ lạnh"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate("/recipes/suggestions")}>
              <Lightbulb className="mr-2 h-4 w-4" />
              Gợi ý tủ lạnh
            </Button>
<Button variant="outline" onClick={() => navigate("/favorites")}>
              <Heart className="mr-2 h-4 w-4" />
              Yêu thích
            </Button>
            <Button className="bg-[#31c875]" onClick={() => navigate("/recipes/add")}>
              <Plus className="mr-2 h-4 w-4" />
              Thêm công thức
            </Button>
          </div>
        }
      />

      {popular.length > 0 && (
        <section className="mb-6 rounded-[8px] bg-white p-4 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            <h2 className="text-sm font-bold text-gray-700">Công thức phổ biến</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {popular.map((recipe) => (
              <Link
                key={recipe.recipe_id}
                to={`/recipes/${recipe.recipe_id}`}
                className="group relative w-36 flex-shrink-0 overflow-hidden rounded-xl shadow-sm transition hover:shadow-md"
              >
                <img
                  className="h-24 w-full object-cover"
                  src={recipe.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400"}
                  alt={recipe.recipe_name}
                />
                <div className="bg-white p-2">
                  <p className="line-clamp-2 text-xs font-semibold text-gray-800 group-hover:text-[#7655aa]">
                    {recipe.recipe_name}
                  </p>
                  {(recipe.cook_count ?? 0) > 0 && (
                    <p className="mt-0.5 text-[10px] text-orange-500 font-medium">
                      Đã nấu {recipe.cook_count} lần
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Tìm theo tên..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white p-1">
          {TIME_TAGS.map((tag) => (
            <button
              key={tag.value}
              onClick={() => setTimeTag(tag.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                timeTag === tag.value
                  ? "bg-[#7655aa] text-white"
                  : "text-gray-500 hover:bg-gray-100 hover:text-[#7655aa]"
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>
        <Select value={privacy} onValueChange={setPrivacy}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Quyền" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="SYSTEM">Hệ thống</SelectItem>
            <SelectItem value="PRIVATE">Riêng tư</SelectItem>
            <SelectItem value="FAMILY">Gia đình</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="rounded-[8px] bg-white p-8 text-center shadow-card">Đang tải công thức...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recipes.map((recipe) => (
            <article key={recipe.recipe_id} className="overflow-hidden rounded-[8px] bg-white shadow-card">
              <Link to={`/recipes/${recipe.recipe_id}`}>
                <img
                  className="h-44 w-full object-cover"
                  src={recipe.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800"}
                  alt={recipe.recipe_name}
                />
              </Link>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link to={`/recipes/${recipe.recipe_id}`} className="font-extrabold hover:text-[#7655aa]">
                      {recipe.recipe_name}
                    </Link>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{recipe.description}</p>
                    {recipe.loai_quyen && (
                      <span className="mt-1 inline-block rounded bg-[#f8f6fb] px-2 py-0.5 text-xs text-muted-foreground">
                        {recipe.loai_quyen === "SYSTEM" ? "Hệ thống" : recipe.loai_quyen === "FAMILY" ? "Gia đình" : "Riêng tư"}
                      </span>
                    )}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => void toggleFavorite(recipe.recipe_id, !recipe.is_favorite, family.family_id)}
                  >
                    <Heart className={recipe.is_favorite ? "fill-red-500 text-red-500" : ""} />
                  </Button>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ChefHat className="h-3.5 w-3.5" />
                    {recipe.time_minutes} phút
                  </span>
                  <span>{recipe.ingredient_count ?? recipe.ingredients.length} nguyên liệu</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button className="flex-1 bg-[#7655aa]" onClick={() => navigate(`/recipes/${recipe.recipe_id}`)}>
                    Xem chi tiết
                  </Button>
                  {recipe.loai_quyen !== "SYSTEM" && (
                    <Button size="icon" variant="outline" onClick={() => setDeleteId(recipe.recipe_id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && recipes.length === 0 && (
        <div className="rounded-[8px] bg-white p-8 text-center shadow-card">Chưa có công thức phù hợp.</div>
      )}

      <AppModal
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        type="confirm"
        title="Xóa công thức?"
        primaryLabel="Xóa"
        secondaryLabel="Hủy"
        onPrimary={async () => {
          if (!deleteId) return;
          try {
            await remove(deleteId, family.family_id);
            toast.success("Đã xóa công thức");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Không thể xóa công thức");
          } finally {
            setDeleteId(null);
          }
        }}
      >
        Hành động này không thể hoàn tác.
      </AppModal>
    </>
  );
}
