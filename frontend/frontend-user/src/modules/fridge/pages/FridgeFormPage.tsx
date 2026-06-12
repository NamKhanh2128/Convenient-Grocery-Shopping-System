import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { useAuthStore } from "@/modules/auth/store/authStore";
import { useFridgeStore } from "@/modules/fridge/store/fridgeStore";
import { ScreenHeader } from "@/shared/components/ScreenHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { foodApi } from "@/shared/api/foodApi";
import type { Food } from "@/types";
import { foodLocations } from "@/shared/constants/options";
import { fridgeFormSchema } from "../schema";
import { getErrorMessage } from "@/shared/utils/errors";
import { todayIso } from "@/shared/utils/date";
import { fridgeApi } from "../api/fridgeApi";

type Values = z.infer<typeof fridgeFormSchema>;

export function FridgeFormPage({ mode }: { mode: "add" | "edit" }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const family = useAuthStore((state) => state.family)!;
  const { items, load, create, update } = useFridgeStore();
  const [foods, setFoods] = useState<Food[]>([]);
  const [suggestedLocation, setSuggestedLocation] = useState<{
    location: Values["location"];
    reason: string;
    confidence: "high" | "medium" | "low";
  } | null>(null);
  const current = useMemo(() => items.find((item) => item.fridge_item_id === id), [items, id]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { control, register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(fridgeFormSchema) as any, defaultValues: { food_id: "", quantity: 1, expiry_date: todayIso(), location: "Ngăn mát" } });
  const selectedFoodId = watch("food_id");

  useEffect(() => { void foodApi.list().then(setFoods); void load(family.family_id); }, [family.family_id, load]);
  useEffect(() => { if (current) reset({ food_id: current.food_id, quantity: current.quantity, expiry_date: current.expiry_date, location: current.location }); }, [current, reset]);
  useEffect(() => {
    const selectedFood = foods.find((food) => food.food_id === selectedFoodId);
    if (!selectedFood) {
      setSuggestedLocation(null);
      return;
    }
    void fridgeApi
      .getStorageSuggestion(selectedFood.food_name, selectedFood.category)
      .then((suggestion) => {
        setSuggestedLocation(suggestion);
      })
      .catch(() => {
        setSuggestedLocation(null);
      });
  }, [selectedFoodId, foods]);

  async function onSubmit(values: Values) {
    try {
      if (mode === "add") await create({ ...values, family_id: family.family_id });
      else if (id) await update(id, values, family.family_id);
      toast.success(mode === "add" ? "Đã lưu thực phẩm và cập nhật UI." : "Đã cập nhật thực phẩm.");
      navigate("/fridge");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <>
      <ScreenHeader title={mode === "add" ? "Thêm thực phẩm" : "Cập nhật thực phẩm"} subtitle="Flow: nhập thông tin → validate → lưu database → cập nhật danh sách → success popup." />
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-4 rounded-[8px] bg-white p-6 shadow-card">
        <Controller control={control} name="food_id" render={({ field }) => <Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue placeholder="Chọn food_id từ bảng foods" /></SelectTrigger><SelectContent>{foods.map((food) => <SelectItem key={food.food_id} value={food.food_id}>{food.icon} {food.food_name} · {food.category} · {food.unit}</SelectItem>)}</SelectContent></Select>} />
        {errors.food_id && <p className="text-xs text-destructive">{errors.food_id.message}</p>}
        <Input type="number" step="0.1" placeholder="Số lượng" {...register("quantity")} />
        {errors.quantity && <p className="text-xs text-destructive">{errors.quantity.message}</p>}
        <Input type="date" {...register("expiry_date")} />
        {errors.expiry_date && <p className="text-xs text-destructive">{errors.expiry_date.message}</p>}
        <Controller control={control} name="location" render={({ field }) => <Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{foodLocations.map((loc) => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}</SelectContent></Select>} />
        {suggestedLocation && (
          <div className="rounded-md border border-[#d9d2ec] bg-[#f8f6fc] p-3 text-sm">
            <p className="font-medium text-[#4f3b79]">
              Gợi ý bảo quản: {suggestedLocation.location} ({suggestedLocation.confidence})
            </p>
            <p className="mt-1 text-[#6f6582]">{suggestedLocation.reason}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setValue("location", suggestedLocation.location)}
            >
              Dùng gợi ý này
            </Button>
          </div>
        )}
        <div className="flex gap-2"><Button disabled={isSubmitting} className="rounded-[8px] bg-[#7655aa]"><Save className="mr-2 h-4 w-4" />{isSubmitting ? "Đang lưu..." : "Lưu"}</Button></div>
      </form>
    </>
  );
}
