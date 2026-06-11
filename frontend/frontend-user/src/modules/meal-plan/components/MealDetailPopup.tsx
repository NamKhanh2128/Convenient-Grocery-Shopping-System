import { AlertTriangle, CheckCircle2, ChefHat, Clock, Eye, Flame, Plus, ShoppingCart, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/modules/auth/store/authStore";
import { type MealSlot, useMealPlanStore } from "@/modules/meal-plan/store/mealPlanStore";
import type { RecipeDetail } from "@/modules/recipe/api/recipeApi";
import { recipeApi } from "@/modules/recipe/api/recipeApi";
import { RecipePicker } from "./RecipePicker";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useT } from "@/shared/store/languageStore";

const SLOTS: MealSlot[] = ["Sáng", "Trưa", "Tối"];

const FALLBACK_IMG = "https://placehold.co/400x300/9B59B6/white?text=Món+ăn";

function recipeImgSrc(url: string | undefined) {
  return url && url.trim() ? url : FALLBACK_IMG;
}

function handleImgError(e: React.SyntheticEvent<HTMLImageElement>, name?: string) {
  const label = name ? encodeURIComponent(name.slice(0, 20)) : "Món+ăn";
  (e.currentTarget as HTMLImageElement).src = `https://placehold.co/400x300/9B59B6/white?text=${label}`;
}

export function MealDetailPopup() {
  const {
    editingDate,
    closeEdit,
    getSlotRecipes,
    getMissingForRecipe,
    addRecipeToSlot,
    removeRecipeFromSlot,
    replaceRecipeInSlot,
    markRecipeCooked,
    isRecipeCooked,
    createShoppingFromMissing,
    removeSuggestion,
    loadWeek,
    familyId,
  } = useMealPlanStore();
  const userId = useAuthStore((s) => s.user?.user_id ?? "user-1");
  const t = useT();
  const [pickerSlot, setPickerSlot] = useState<MealSlot | null>(null);
  const [replaceTarget, setReplaceTarget] = useState<{ slot: MealSlot; recipe: RecipeDetail } | null>(null);
  const [viewingRecipe, setViewingRecipe] = useState<RecipeDetail | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const open = Boolean(editingDate);

  const slotLabels: Record<MealSlot, string> = {
    Sáng: t("mealBreakfast"),
    Trưa: t("mealLunch"),
    Tối: t("mealDinner"),
  };

  function handleClose() {
    setPickerSlot(null);
    setReplaceTarget(null);
    setViewingRecipe(null);
    closeEdit();
  }

  async function handleSelect(recipe: RecipeDetail) {
    if (!editingDate || (!pickerSlot && !replaceTarget)) return;
    setSubmitting(true);
    try {
      if (replaceTarget) {
        await replaceRecipeInSlot(editingDate, replaceTarget.slot, replaceTarget.recipe.recipe_id, recipe.recipe_id);
        toast.success("Đã thay thế món ăn.");
      } else if (pickerSlot) {
        await addRecipeToSlot(editingDate, pickerSlot, recipe.recipe_id);
        toast.success("Đã thêm món vào kế hoạch.");
      }
      setPickerSlot(null);
      setReplaceTarget(null);
    } catch {
      toast.error("Không thể cập nhật kế hoạch. Thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(slot: MealSlot, recipe: RecipeDetail) {
    if (!editingDate) return;
    setSubmitting(true);
    try {
      await removeRecipeFromSlot(editingDate, slot, recipe.recipe_id);
      toast.success("Đã xóa món khỏi kế hoạch.");
    } catch {
      toast.error("Không thể xóa món. Thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleFavorite(recipe: RecipeDetail) {
    try {
      await recipeApi.toggleFavorite(recipe.recipe_id, !recipe.is_favorite);
      if (familyId) void loadWeek(familyId);
      toast.success(recipe.is_favorite ? "Đã bỏ yêu thích." : "Đã thêm vào yêu thích.");
    } catch {
      toast.error("Không thể cập nhật yêu thích.");
    }
  }

  async function handleToggleCooked(slot: MealSlot, recipe: RecipeDetail) {
    if (!editingDate) return;
    const wasCooked = isRecipeCooked(editingDate, slot, recipe.recipe_id);
    setSubmitting(true);
    try {
      await markRecipeCooked(editingDate, slot, recipe.recipe_id, !wasCooked);
      toast.success(wasCooked ? "Đã bỏ đánh dấu nấu." : "Đã đánh dấu đã nấu!");
    } catch {
      toast.error("Không thể cập nhật trạng thái nấu.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateShopping() {
    if (!familyId) return;
    setSubmitting(true);
    try {
      await createShoppingFromMissing(familyId, userId);
      toast.success("Đã tạo danh sách mua sắm nguyên liệu thiếu.");
    } catch {
      toast.error("Không thể tạo danh sách. Thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  const title = viewingRecipe
    ? viewingRecipe.recipe_name
    : pickerSlot || replaceTarget
      ? t("chooseRecipe")
      : t("mealDetail");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b bg-white p-5">
          <DialogTitle className="text-lg font-extrabold text-[#3d3051]">{title}</DialogTitle>
          {editingDate && (
            <div className="text-xs text-[#9188a1]">
              {new Date(editingDate).toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" })}
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5">
          {(pickerSlot || replaceTarget) && (
            <div className="space-y-4">
              <RecipePicker onSelect={handleSelect} disabled={submitting} />
            </div>
          )}

          {viewingRecipe && !pickerSlot && !replaceTarget && (
            <RecipeDetailView
              recipe={viewingRecipe}
              onRemoveSuggestion={() => {
                removeSuggestion(viewingRecipe.recipe_id);
                toast.success("Đã xóa khỏi danh sách gợi ý.");
                setViewingRecipe(null);
              }}
            />
          )}

          {!pickerSlot && !replaceTarget && !viewingRecipe && editingDate && (
            <div className="space-y-5">
              {SLOTS.map((slot) => {
                const recipes = getSlotRecipes(editingDate, slot);
                return (
                  <section key={slot} className="rounded-xl border bg-[#faf9fd] p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h3 className="font-extrabold text-[#3d3051]">{slotLabels[slot]}</h3>
                      <Button size="sm" onClick={() => setPickerSlot(slot)} disabled={submitting} className="gap-1.5 bg-[#7655aa]">
                        <Plus className="h-4 w-4" />
                        {t("addMeal")}
                      </Button>
                    </div>

                    {recipes.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-[#d1c5e8] py-7 text-center text-sm text-[#9188a1]">
                        {t("noMealYet")}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {recipes.map((recipe) => {
                          const missing = getMissingForRecipe(recipe.recipe_id);
                          const cooked = isRecipeCooked(editingDate, slot, recipe.recipe_id);
                          return (
                            <div key={recipe.recipe_id} className={`flex flex-col gap-3 rounded-xl border bg-white p-3 sm:flex-row sm:items-center ${cooked ? "opacity-70 ring-1 ring-green-300" : ""}`}>
                              <div className="relative h-20 w-full shrink-0 sm:w-24">
                                <img
                                  src={recipeImgSrc(recipe.image_url)}
                                  alt={recipe.recipe_name}
                                  className="h-full w-full rounded-lg object-cover"
                                  onError={(e) => handleImgError(e, recipe.recipe_name)}
                                />
                                {cooked && (
                                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-green-500/30">
                                    <CheckCircle2 className="h-8 w-8 text-green-600 drop-shadow" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 font-bold text-[#3d3051]">
                                  {recipe.recipe_name}
                                  {cooked && <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Đã nấu</span>}
                                </div>
                                <div className="mt-1 flex flex-wrap gap-2 text-xs text-[#9188a1]">
                                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{recipe.time_minutes} phút</span>
                                  <span className="inline-flex items-center gap-1"><Flame className="h-3 w-3" />{recipe.calories} kcal</span>
                                  <span>{recipe.difficulty}</span>
                                  <span className={missing.length ? "text-amber-600" : "text-green-600"}>
                                    {missing.length ? `Thiếu ${missing.length} nguyên liệu` : "Đủ nguyên liệu"}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Button size="sm" variant="outline" onClick={() => setViewingRecipe(recipe)}>
                                  <Eye className="mr-1 h-4 w-4" />{t("detailButton")}
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setReplaceTarget({ slot, recipe })}>
                                  {t("replaceButton")}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleToggleFavorite(recipe)}
                                  className={recipe.is_favorite ? "border-yellow-300 text-yellow-600" : ""}
                                >
                                  <Star className={`mr-1 h-4 w-4 ${recipe.is_favorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
                                  {recipe.is_favorite ? "Bỏ thích" : t("favoriteButton")}
                                </Button>
                                <Button
                                  size="sm"
                                  variant={cooked ? "outline" : "default"}
                                  onClick={() => handleToggleCooked(slot, recipe)}
                                  disabled={submitting}
                                  className={cooked ? "border-green-300 text-green-700" : "bg-green-600 hover:bg-green-700"}
                                >
                                  <CheckCircle2 className="mr-1 h-4 w-4" />
                                  {cooked ? "Bỏ đánh dấu" : "Đã nấu"}
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleRemove(slot, recipe)} disabled={submitting}>
                                  <Trash2 className="mr-1 h-4 w-4" />{t("removeButton")}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                );
              })}
              <Button variant="outline" onClick={handleCreateShopping} disabled={submitting} className="gap-1.5">
                <ShoppingCart className="h-4 w-4" />
                {t("addMissingToCart")}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RecipeDetailView({ recipe, onRemoveSuggestion }: { recipe: RecipeDetail; onRemoveSuggestion: () => void }) {
  const missing = useMealPlanStore((s) => s.getMissingForRecipe(recipe.recipe_id));
  const t = useT();

  return (
    <div className="space-y-4">
      <img
        src={recipeImgSrc(recipe.image_url)}
        alt={recipe.recipe_name}
        className="h-56 w-full rounded-xl object-cover"
        onError={(e) => handleImgError(e, recipe.recipe_name)}
      />
      <div className="grid gap-2 text-sm sm:grid-cols-3">
        <span className="inline-flex items-center gap-1 rounded-lg bg-[#f8f6fb] px-3 py-2"><Clock className="h-4 w-4" />{recipe.time_minutes} phút</span>
        <span className="inline-flex items-center gap-1 rounded-lg bg-[#f8f6fb] px-3 py-2"><Flame className="h-4 w-4" />{recipe.calories} kcal</span>
        <span className="inline-flex items-center gap-1 rounded-lg bg-[#f8f6fb] px-3 py-2"><ChefHat className="h-4 w-4" />{recipe.difficulty}</span>
      </div>
      {missing.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <div className="mb-2 flex items-center gap-2 font-bold"><AlertTriangle className="h-4 w-4" />Thiếu nguyên liệu</div>
          {missing.map((item) => <div key={item.food.food_id}>{item.food.food_name}: cần {item.quantity} {item.food.unit}</div>)}
        </div>
      )}
      <section>
        <h3 className="mb-2 font-bold text-[#3d3051]">{t("ingredients")}</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {recipe.ingredients.map((item) => <div key={item.id} className="rounded-lg bg-[#f8f6fb] px-3 py-2 text-sm">{item.food.food_name}: {item.quantity} {item.food.unit}</div>)}
        </div>
      </section>
      <section>
        <h3 className="mb-2 font-bold text-[#3d3051]">{t("cookingSteps")}</h3>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-[#746d82]">
          {recipe.instructions.map((step, index) => <li key={index}>{step}</li>)}
        </ol>
      </section>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={onRemoveSuggestion}>Xóa khỏi gợi ý</Button>
      </div>
    </div>
  );
}
