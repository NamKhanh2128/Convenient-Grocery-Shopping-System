import { ShoppingCart, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/modules/auth/store/authStore";
import { useMealPlanStore } from "@/modules/meal-plan/store/mealPlanStore";
import { ScreenHeader } from "@/shared/components/ScreenHeader";
import { Button } from "@/components/ui/button";
import { MealPlanCalendar } from "../components/MealPlanCalendar";
import { MealDetailPopup } from "../components/MealDetailPopup";

export function MealPlanPage() {
  const family = useAuthStore((state) => state.family)!;
  const user = useAuthStore((state) => state.user)!;
  const { loadWeek, suggestions, createShoppingFromMissing } = useMealPlanStore();
  const [submitting, setSubmitting] = useState(false);
  const [planMode, setPlanMode] = useState<"daily" | "weekly">("weekly");

  useEffect(() => {
    void loadWeek(family.family_id);
  }, [family.family_id, loadWeek]);

  const totalMissing = suggestions.reduce((acc, s) => acc + s.missing.length, 0);

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

  return (
    <>
      <ScreenHeader
        title="Kế hoạch bữa ăn"
        subtitle="Trung tâm lập thực đơn: xem lịch, chọn món, thay thế món và tạo danh sách mua sắm nguyên liệu thiếu."
        actions={
          totalMissing > 0 ? (
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
          ) : null
        }
      />

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
    </>
  );
}
