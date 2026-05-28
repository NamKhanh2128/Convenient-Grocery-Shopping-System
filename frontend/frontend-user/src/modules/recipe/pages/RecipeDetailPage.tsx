import { ChefHat, PackageMinus } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/modules/auth/store/authStore";
import { ScreenHeader } from "@/shared/components/ScreenHeader";
import { Button } from "@/components/ui/button";
import { recipeApi, type RecipeDetail } from "@/modules/recipe/api/recipeApi";
import type { RecipeSuggestion } from "@/types";

export function RecipeDetailPage() {
  const { id } = useParams();
  const family = useAuthStore((state) => state.family)!;
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [suggestion, setSuggestion] = useState<RecipeSuggestion | null>(null);
  useEffect(() => { if (id) { void recipeApi.detail(id).then(setRecipe); void recipeApi.suggestions(family.family_id).then((list) => setSuggestion(list.find((item) => item.recipe.recipe_id === id) ?? null)); } }, [id, family.family_id]);
  if (!recipe) return <ScreenHeader title="Đang tải công thức" />;
  return (
    <>
      <ScreenHeader title={recipe.recipe_name} subtitle={recipe.description} actions={<Button onClick={async () => { await recipeApi.markCooked(family.family_id, recipe.recipe_id); toast.success("Đã nấu ăn và cập nhật lại nguyên liệu trong tủ lạnh."); }} className="bg-[#31c875]"><PackageMinus className="mr-2 h-4 w-4" />Sau khi nấu</Button>} />
      <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <img className="h-80 w-full rounded-[8px] object-cover shadow-card" src={recipe.image_url} alt={recipe.recipe_name} />
        <div className="rounded-[8px] bg-white p-6 shadow-card">
          <h3 className="font-extrabold">Nguyên liệu</h3>
          <ul className="mt-3 space-y-2">{recipe.ingredients.map((item) => <li key={item.id} className="rounded-[8px] bg-[#f8f6fb] p-3">{item.food.icon} {item.food.food_name}: {item.quantity} {item.food.unit}</li>)}</ul>
          <div className="mt-4 rounded-[8px] bg-[#fbfacb] p-3 text-sm"><b>Gợi ý mua thêm:</b> {suggestion?.missing.map((item) => item.food.food_name).join(", ") || "Không thiếu nguyên liệu"}</div>
          <h3 className="mt-6 font-extrabold">Hướng dẫn chế biến</h3>
          <ol className="mt-3 space-y-2">{recipe.instructions.map((step, index) => <li key={step} className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#7655aa] text-xs font-bold text-white">{index + 1}</span>{step}</li>)}</ol>
          <Button className="mt-6 bg-[#ffb11f]"><ChefHat className="mr-2 h-4 w-4" />Bắt đầu nấu</Button>
        </div>
      </section>
    </>
  );
}
