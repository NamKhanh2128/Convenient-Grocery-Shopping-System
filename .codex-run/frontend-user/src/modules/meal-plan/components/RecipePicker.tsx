import { AlertTriangle, CheckCircle2, Clock, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useMealPlanStore } from "@/modules/meal-plan/store/mealPlanStore";
import type { RecipeDetail } from "@/modules/recipe/api/recipeApi";
import { Input } from "@/components/ui/input";

const FILTERS = ["Tất cả", "Thịt", "Rau", "Lành mạnh", "Ít tinh bột", "Nhanh"] as const;
type Filter = (typeof FILTERS)[number];

export function RecipePicker({ onSelect, disabled = false }: { onSelect: (recipe: RecipeDetail) => void; disabled?: boolean }) {
  const { recipes, suggestions } = useMealPlanStore();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("Tất cả");

  const sorted = useMemo(() => {
    return recipes
      .filter((recipe) => {
        const haystack = `${recipe.recipe_name} ${recipe.description}`.toLowerCase();
        const matchesQuery = haystack.includes(query.toLowerCase());
        const matchesFilter =
          filter === "Tất cả" ||
          (filter === "Nhanh" && recipe.time_minutes <= 30) ||
          haystack.includes(filter.toLowerCase());
        return matchesQuery && matchesFilter;
      })
      .sort((a, b) => {
        const aMissing = suggestions.find((s) => s.recipe.recipe_id === a.recipe_id)?.missing.length ?? 99;
        const bMissing = suggestions.find((s) => s.recipe.recipe_id === b.recipe_id)?.missing.length ?? 99;
        return aMissing - bMissing;
      });
  }, [recipes, suggestions, query, filter]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9188a1]" />
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm công thức..." className="pl-9" />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${filter === item ? "bg-[#7655aa] text-white" : "bg-[#f3f0f8] text-[#7655aa] hover:bg-[#e9e3f7]"}`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
        {sorted.length === 0 && <div className="py-8 text-center text-sm text-[#9188a1]">Không tìm thấy công thức phù hợp</div>}
        {sorted.map((recipe) => {
          const suggestion = suggestions.find((s) => s.recipe.recipe_id === recipe.recipe_id);
          const missingCount = suggestion?.missing.length ?? recipe.ingredients.length;
          const total = recipe.ingredients.length || 1;
          const matched = Math.round(((suggestion?.available_food_ids.length ?? 0) / total) * 100);
          const canCook = missingCount === 0;

          return (
            <button
              key={recipe.recipe_id}
              type="button"
              onClick={() => onSelect(recipe)}
              disabled={disabled}
              className="flex w-full items-center gap-3 rounded-xl border bg-white p-3 text-left transition hover:border-[#7655aa] hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              <img src={recipe.image_url} alt={recipe.recipe_name} className="h-14 w-14 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <span className="truncate font-semibold text-[#3d3051]">{recipe.recipe_name}</span>
                  {canCook ? <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" /> : <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />}
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-[#9188a1]">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{recipe.time_minutes} phút</span>
                  <span>{recipe.difficulty}</span>
                  <span className={canCook ? "text-green-600" : "text-amber-600"}>{canCook ? "Đủ nguyên liệu" : `Thiếu ${missingCount} nguyên liệu`}</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#f3f0f8]">
                  <div className="h-full rounded-full bg-[#7655aa] transition-all" style={{ width: `${matched}%` }} />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
