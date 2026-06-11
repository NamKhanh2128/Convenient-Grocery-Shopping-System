import { CheckCircle2, Plus, Star } from "lucide-react";
import type { MealSlot } from "@/modules/meal-plan/store/mealPlanStore";
import { useMealPlanStore } from "@/modules/meal-plan/store/mealPlanStore";

const SLOTS: MealSlot[] = ["Sáng", "Trưa", "Tối"] as MealSlot[];

const slotColors: Record<MealSlot, string> = {
  Sáng: "bg-amber-50 border-amber-200 text-amber-700",
  Trưa: "bg-green-50 border-green-200 text-green-700",
  Tối: "bg-violet-50 border-violet-200 text-violet-700",
} as Record<MealSlot, string>;

const slotDots: Record<MealSlot, string> = {
  Sáng: "bg-amber-400",
  Trưa: "bg-green-500",
  Tối: "bg-violet-500",
} as Record<MealSlot, string>;

const DAY_NAMES = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export function MealPlanDayCell({ date, dayIndex }: { date: string; dayIndex: number }) {
  const openEdit = useMealPlanStore((s) => s.openEdit);
  const getSlotRecipes = useMealPlanStore((s) => s.getSlotRecipes);
  const isRecipeCooked = useMealPlanStore((s) => s.isRecipeCooked);
  const groups = useMealPlanStore((s) => s.groups);
  const today = new Date().toISOString().slice(0, 10);
  const isToday = date === today;
  const dateNum = new Date(date).getDate();

  const recipeUsageCount = (recipeId: string) =>
    groups.reduce((acc, g) => acc + (g.recipe_ids.includes(recipeId) ? 1 : 0), 0);

  return (
    <div className={`flex flex-col rounded-xl border-2 ${isToday ? "border-[#7655aa]" : "border-transparent"} bg-white shadow-sm`}>
      <div className={`flex items-center justify-between rounded-t-xl px-3 py-2 ${isToday ? "bg-[#7655aa] text-white" : "bg-[#f8f6fb] text-[#7655aa]"}`}>
        <span className="text-xs font-bold">{DAY_NAMES[dayIndex] ?? ""}</span>
        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-extrabold ${isToday ? "bg-white/20" : ""}`}>{dateNum}</span>
      </div>
      <div className="flex flex-col gap-1.5 p-2">
        {SLOTS.map((slot) => {
          const slotRecipes = getSlotRecipes(date, slot);
          const count = slotRecipes.length;
          const hasFavorite = slotRecipes.some((r) => r.is_favorite);
          const hasFrequent = slotRecipes.some((r) => recipeUsageCount(r.recipe_id) >= 2);
          const allCooked = count > 0 && slotRecipes.every((r) => isRecipeCooked(date, slot, r.recipe_id));
          return (
            <button
              key={slot}
              onClick={() => openEdit(date, slot)}
              className={`flex min-h-[44px] w-full items-start gap-1.5 rounded-lg border px-2 py-1.5 text-left transition hover:opacity-80 ${allCooked ? "border-green-300 bg-green-50 text-green-700" : slotColors[slot]}`}
            >
              <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${allCooked ? "bg-green-400" : slotDots[slot]}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wide">{slot}</span>
                  {hasFavorite && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
                  {hasFrequent && <span className="text-[10px]" title="Thường dùng">🔥</span>}
                  {allCooked && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                </div>
                {count === 0 ? (
                  <div className="flex items-center gap-0.5 text-[10px] opacity-50">
                    <Plus className="h-3 w-3" />
                    <span>Thêm món</span>
                  </div>
                ) : (
                  <div className="text-[11px] font-semibold">{count} món{allCooked ? " ✓" : ""}</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
