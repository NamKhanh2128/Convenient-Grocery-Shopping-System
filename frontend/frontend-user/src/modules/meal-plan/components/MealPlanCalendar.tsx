import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useMealPlanStore } from "@/modules/meal-plan/store/mealPlanStore";
import { MealPlanDayCell } from "./MealPlanDayCell";
import { Button } from "@/components/ui/button";
import { todayIso as getTodayIso } from "@/shared/utils/date";

const MONTH_NAMES = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];

export function MealPlanCalendar({ compact = false }: { compact?: boolean }) {
  const { weekDays, loading, prevWeek, nextWeek, goToCurrentWeek } = useMealPlanStore();

  const start = weekDays[0] ? new Date(weekDays[0]) : new Date();
  const end = weekDays[6] ? new Date(weekDays[6]) : new Date();

  const rangeLabel =
    start.getMonth() === end.getMonth()
      ? `${MONTH_NAMES[start.getMonth()]} ${start.getFullYear()}`
      : `${MONTH_NAMES[start.getMonth()]} – ${MONTH_NAMES[end.getMonth()]} ${end.getFullYear()}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] bg-white p-3 shadow-card">
        <div className="flex items-center gap-3">
          <button
            onClick={prevWeek}
            className="flex h-9 w-9 items-center justify-center rounded-lg border bg-white shadow-sm transition hover:bg-[#f1edf7]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-center">
            <div className="text-sm font-bold text-[#5b368d]">{rangeLabel}</div>
            <div className="text-xs text-[#9188a1]">
              {weekDays[0]} → {weekDays[6]}
            </div>
          </div>
          <button
            onClick={nextWeek}
            className="flex h-9 w-9 items-center justify-center rounded-lg border bg-white shadow-sm transition hover:bg-[#f1edf7]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <Button variant="outline" size="sm" onClick={goToCurrentWeek} className="gap-1.5">
          <CalendarDays className="h-4 w-4" />
          Tuần này
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {Array.from({ length: compact ? 1 : 7 }, (_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-white shadow-sm" />
          ))}
        </div>
      ) : (
        <div className={`grid gap-3 ${compact ? "grid-cols-1 max-w-xs" : "grid-cols-2 sm:grid-cols-4 lg:grid-cols-7"}`}>
          {(compact
            ? (() => {
                const todayIso = getTodayIso();
                const todayIdx = weekDays.findIndex((d) => d === todayIso);
                const idx = todayIdx >= 0 ? todayIdx : 0;
                return [{ date: weekDays[idx], dayIndex: idx }];
              })()
            : weekDays.map((date, i) => ({ date, dayIndex: i }))
          ).map(({ date, dayIndex }) => (
            <MealPlanDayCell key={date} date={date} dayIndex={dayIndex} />
          ))}
        </div>
      )}
    </div>
  );
}
