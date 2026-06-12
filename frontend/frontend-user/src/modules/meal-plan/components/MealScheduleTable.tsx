import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useMealPlanStore } from "@/modules/meal-plan/store/mealPlanStore";
import type { MealSlot } from "@/modules/meal-plan/store/mealPlanStore";
import { Button } from "@/components/ui/button";
import { todayIso } from "@/shared/utils/date";

const SLOTS: MealSlot[] = ["Sáng", "Trưa", "Tối"];

const DAY_LABELS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];

export function MealScheduleTable() {
  const { weekDays, loading, prevWeek, nextWeek, goToCurrentWeek, openEdit, getSlotRecipes, removeRecipeFromSlot } = useMealPlanStore();

  const today = todayIso();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={prevWeek} className="flex h-9 w-9 items-center justify-center rounded-lg border bg-white shadow-sm transition hover:bg-[#f1edf7]">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={nextWeek} className="flex h-9 w-9 items-center justify-center rounded-lg border bg-white shadow-sm transition hover:bg-[#f1edf7]">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <Button variant="outline" size="sm" onClick={goToCurrentWeek}>Tuần này</Button>
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-xl bg-white" />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b bg-[#f8f6fb]">
                <th className="py-3 pl-4 text-left font-bold text-[#5b368d]">Ngày</th>
                {SLOTS.map((slot) => (
                  <th key={slot} className="py-3 px-3 text-left font-bold text-[#5b368d]">{slot}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weekDays.map((date, i) => {
                const isToday = date === today;
                const d = new Date(date);
                return (
                  <tr key={date} className={`border-b last:border-0 ${isToday ? "bg-[#f3f0fb]" : "hover:bg-[#faf9fd]"}`}>
                    <td className="py-3 pl-4">
                      <div className={`font-bold ${isToday ? "text-[#7655aa]" : "text-[#3d3051]"}`}>{DAY_LABELS[i]}</div>
                      <div className="text-xs text-[#9188a1]">{d.getDate()}/{d.getMonth() + 1}</div>
                    </td>
                    {SLOTS.map((slot) => {
                      const slotRecipes = getSlotRecipes(date, slot);
                      return (
                        <td key={slot} className="px-3 py-2 align-top">
                          <div className="space-y-1">
                            {slotRecipes.map((recipe) => (
                              <div key={recipe.recipe_id} className="flex items-center gap-1.5 rounded-lg bg-[#f8f6fb] px-2 py-1.5">
                                <span className="min-w-0 flex-1 truncate text-xs font-semibold text-[#3d3051]">{recipe.recipe_name}</span>
                                <button
                                  onClick={() => removeRecipeFromSlot(date, slot, recipe.recipe_id)}
                                  className="shrink-0 text-[#9188a1] transition hover:text-red-500"
                                  title="Xóa món"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => openEdit(date, slot)}
                              className="flex w-full items-center gap-1 rounded-lg border border-dashed border-[#c9bfe0] px-2 py-1 text-xs text-[#9188a1] transition hover:border-[#7655aa] hover:text-[#7655aa]"
                            >
                              <Plus className="h-3 w-3" />
                              <span>Thêm món</span>
                            </button>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
