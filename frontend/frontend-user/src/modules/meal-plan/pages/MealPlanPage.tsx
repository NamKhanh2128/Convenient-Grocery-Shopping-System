import { Flame, ShoppingCart, Sparkles, Wand2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/modules/auth/store/authStore";
import { useMealPlanStore } from "@/modules/meal-plan/store/mealPlanStore";
import { useRecipeStore } from "@/modules/recipe/store/recipeStore";
import { ScreenHeader } from "@/shared/components/ScreenHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { MealPlanCalendar } from "../components/MealPlanCalendar";
import { MealDetailPopup } from "../components/MealDetailPopup";

export function MealPlanPage() {
  const family = useAuthStore((state) => state.family)!;
  const user = useAuthStore((state) => state.user)!;
  const { loadWeek, suggestions, planMissing, createShoppingFromMissing, autoGenerateMealPlan } = useMealPlanStore();
  const { popular, loadPopular } = useRecipeStore();
  const [submitting, setSubmitting] = useState(false);
  const [planMode, setPlanMode] = useState<"daily" | "weekly">("weekly");
  const [autoOpen, setAutoOpen] = useState(false);
  const [autoMode, setAutoMode] = useState<"day" | "week">("week");
  const [autoOverwrite, setAutoOverwrite] = useState(false);
  const [autoGenerating, setAutoGenerating] = useState(false);

  useEffect(() => {
    void loadWeek(family.family_id);
    void loadPopular(family.family_id);
  }, [family.family_id, loadWeek, loadPopular]);

  const totalMissing = planMissing.length;

  async function handleCreateShopping() {
    setSubmitting(true);
    try {
      await createShoppingFromMissing(family.family_id, user.user_id);
      toast.success("Đã tạo danh sách mua sắm từ nguyên liệu thiếu.");
    } catch {
      toast.error("Không thể tạo danh sách. Thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAutoGenerate() {
    setAutoGenerating(true);
    try {
      await autoGenerateMealPlan(autoMode, autoOverwrite);
      toast.success(autoMode === "week" ? "Đã tạo kế hoạch tự động cho cả tuần." : "Đã tạo kế hoạch tự động cho hôm nay.");
      setAutoOpen(false);
    } catch {
      toast.error("Không thể tạo kế hoạch tự động. Thử lại.");
    } finally {
      setAutoGenerating(false);
    }
  }

  return (
    <>
      <ScreenHeader
        title="Kế hoạch bữa ăn"
        subtitle="Trung tâm lập thực đơn: xem lịch, chọn món, thay thế món và tạo danh sách mua sắm nguyên liệu thiếu."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoOpen(true)}
              className="gap-1.5 border-violet-300 text-violet-700 hover:bg-violet-50"
            >
              <Wand2 className="h-4 w-4" />
              Tự động tạo
            </Button>
            {totalMissing > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateShopping}
                disabled={submitting}
                className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                <ShoppingCart className="h-4 w-4" />
                {submitting ? "Đang tạo..." : `Mua nguyên liệu thiếu (${totalMissing})`}
              </Button>
            )}
          </div>
        }
      />

      {popular.length > 0 && (
        <section className="mb-5">
          <div className="mb-3 flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            <h2 className="text-sm font-bold text-gray-700">Món ăn hay nấu</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {popular.map((recipe) => (
              <Link
                key={recipe.recipe_id}
                to={`/recipes/${recipe.recipe_id}`}
                className="group relative w-32 flex-shrink-0 overflow-hidden rounded-xl shadow-sm transition hover:shadow-md"
              >
                <img
                  className="h-20 w-full object-cover"
                  src={recipe.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400"}
                  alt={recipe.recipe_name}
                />
                <div className="bg-white p-2">
                  <p className="line-clamp-2 text-xs font-semibold text-gray-800 group-hover:text-[#7655aa]">
                    {recipe.recipe_name}
                  </p>
                  {(recipe.cook_count ?? 0) > 0 && (
                    <p className="mt-0.5 text-[10px] text-orange-500 font-medium">
                      {recipe.cook_count} lần nấu
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border bg-white p-1 shadow-sm">
            {(["daily", "weekly"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setPlanMode(mode)}
                className={`rounded-lg px-3 py-2 text-xs font-bold transition ${planMode === mode ? "bg-[#ffbd2c] text-[#4b3178]" : "text-[#9188a1] hover:text-[#7655aa]"}`}
              >
                {mode === "daily" ? "Theo ngày" : "Theo tuần"}
              </button>
            ))}
          </div>
          {suggestions.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-xl bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
              <Sparkles className="h-3.5 w-3.5" />
              {suggestions.length} gợi ý từ tủ lạnh
            </div>
          )}
        </div>
      </div>

      <MealPlanCalendar compact={planMode === "daily"} />

      <MealDetailPopup />

      <Dialog open={autoOpen} onOpenChange={setAutoOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-violet-600" />
              Tự động tạo kế hoạch bữa ăn
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Tạo cho:</p>
              <div className="flex gap-2">
                {(["day", "week"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setAutoMode(m)}
                    className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${
                      autoMode === m
                        ? "border-violet-400 bg-violet-50 text-violet-700"
                        : "border-gray-200 text-gray-500 hover:border-violet-200 hover:text-violet-600"
                    }`}
                  >
                    {m === "day" ? "Hôm nay" : "Cả tuần này"}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-gray-200 px-3 py-2.5 hover:bg-gray-50">
              <input
                type="checkbox"
                checked={autoOverwrite}
                onChange={(e) => setAutoOverwrite(e.target.checked)}
                className="h-4 w-4 accent-violet-600"
              />
              <span className="text-sm text-gray-700">Ghi đè bữa ăn đã có</span>
            </label>

            <p className="text-xs text-gray-500">
              {autoOverwrite
                ? "Các bữa ăn đã có sẽ bị thay thế bằng công thức ngẫu nhiên."
                : "Chỉ điền vào các khung giờ còn trống."}
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAutoOpen(false)} disabled={autoGenerating}>
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={handleAutoGenerate}
              disabled={autoGenerating}
              className="gap-1.5 bg-violet-600 hover:bg-violet-700"
            >
              <Wand2 className="h-4 w-4" />
              {autoGenerating ? "Đang tạo..." : "Tạo kế hoạch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
