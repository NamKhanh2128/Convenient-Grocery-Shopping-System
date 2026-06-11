import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Save, ArrowLeft, Loader2, Apple, Edit3 } from "lucide-react";
import type { Unit, FoodCategory } from "@/types";
import { adminFoodApi } from "@/api/adminFoodApi";
import { adminRecipeApi } from "@/api/adminRecipeApi";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface FoodFormPageProps {
  mode: "create" | "edit";
}

const foodFormSchema = z.object({
  food_name: z.string().min(1, "Tên thực phẩm là bắt buộc."),
  category_id: z.string().min(1, "Vui lòng chọn danh mục thực phẩm."),
  unit_id: z.string().min(1, "Vui lòng chọn đơn vị tính."),
  icon: z.string().min(1, "Vui lòng cung cấp biểu tượng emoji.").emoji("Chỉ chấp nhận duy nhất 1 ký tự biểu tượng emoji."),
});

type FormValues = z.infer<typeof foodFormSchema>;

export function FoodFormPage({ mode }: FoodFormPageProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [categories, setCategories] = useState<FoodCategory[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(foodFormSchema),
    mode: "onChange",
    defaultValues: {
      food_name: "",
      category_id: "",
      unit_id: "",
      icon: "🥦",
    },
  });

  // Load reference data & old food if editing
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [unitsData, categoriesData] = await Promise.all([
          adminRecipeApi.getUnits(),
          adminRecipeApi.getCategories(),
        ]);
        setUnits(unitsData);
        setCategories(categoriesData);

        if (mode === "edit" && id) {
          const food = await adminFoodApi.getById(Number(id));
          reset({
            food_name: food.food_name,
            category_id: food.category_id ? String(food.category_id) : "",
            unit_id: food.unit_id ? String(food.unit_id) : "",
            icon: food.icon || "🥦",
          });
        }
      } catch (error) {
        toast.error("Không thể tải thông tin thực phẩm.");
        navigate("/foods");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [mode, id, reset, navigate]);

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const payload = {
        food_name: values.food_name,
        category_id: Number(values.category_id),
        unit_id: Number(values.unit_id),
        icon: values.icon,
      };
      if (mode === "create") {
        await adminFoodApi.create(payload);
        toast.success("Thêm thực phẩm chuẩn thành công!");
      } else if (mode === "edit" && id) {
        await adminFoodApi.update(Number(id), payload);
        toast.success("Cập nhật thực phẩm thành công!");
      }
      navigate("/foods");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Đã xảy ra lỗi.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const breadcrumbs = [
    { label: "Quản lý thực phẩm", to: "/foods" },
    { label: mode === "create" ? "Thêm mới" : "Chỉnh sửa" },
  ];

  // Common quick emoji presets
  const emojiPresets = ["🥦", "🍅", "🧅", "🧄", "🥛", "🥚", "🐟", "🥩", "🌶️", "🧂", "🍜", "🌾", "🍎", "🍗", "🦐", "🥕"];

  if (loading) {
    return (
      <div className="max-w-xl mx-auto space-y-6 animate-pulse">
        <div className="rounded-[20px] bg-card/60 p-6 shadow-card border border-border/40">
          <div className="h-4 w-1/3 rounded-lg bg-muted mb-2" />
          <div className="h-8 w-2/3 rounded-lg bg-muted mb-2" />
          <div className="h-3 w-1/2 rounded-lg bg-muted" />
        </div>
        <div className="rounded-[20px] bg-card/60 p-6 shadow-card border border-border/40 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-1/4 rounded bg-muted" />
              <div className="h-10 w-full rounded-[8px] bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <PageHeader
        title={mode === "create" ? "Thêm Thực Phẩm Chuẩn" : "Cập Nhật Thực Phẩm"}
        description={
          mode === "create"
            ? "Đăng ký thêm nguyên liệu thực phẩm mới vào danh mục tra cứu chung."
            : "Chỉnh sửa thông số danh mục phân loại hoặc đơn vị đo chuẩn của thực phẩm."
        }
        breadcrumbs={breadcrumbs}
      />

      <Card className="rounded-[20px] border-border/50 bg-card shadow-card overflow-hidden">
        <CardHeader className="border-b border-border/40 pb-4 flex flex-row items-center gap-3">
          <div className={`p-2 rounded-xl text-white ${mode === "create" ? "bg-primary" : "bg-[#ffb11f]"}`}>
            {mode === "create" ? <Apple className="h-5 w-5" /> : <Edit3 className="h-5 w-5" />}
          </div>
          <div>
            <CardTitle className="text-base font-bold">Thuộc tính thực phẩm</CardTitle>
            <CardDescription className="text-xs">
              Thiết lập thông số chuẩn hóa để hỗ trợ bộ tìm kiếm thông minh của app di động.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Food Name */}
              <div className="space-y-1.5">
                <Label htmlFor="food_name" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Tên thực phẩm <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="food_name"
                  placeholder="Ví dụ: Thịt gà tây, Cải kale..."
                  {...register("food_name")}
                  className={cn(
                    "h-10 rounded-[8px] font-sans",
                    errors.food_name && "border-destructive focus-visible:ring-destructive"
                  )}
                />
                {errors.food_name && (
                  <p className="text-xs font-bold text-destructive mt-1.5">{errors.food_name.message}</p>
                )}
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Danh mục phân loại <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch("category_id")}
                  onValueChange={(val) => setValue("category_id", val, { shouldValidate: true })}
                >
                  <SelectTrigger className={cn("h-10 rounded-[8px] border-border bg-card font-semibold text-sm", errors.category_id && "border-destructive focus:ring-destructive")}>
                    <SelectValue placeholder="Chọn danh mục phân loại..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)} className="font-semibold text-xs">
                        {c.name_vi}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category_id && (
                  <p className="text-xs font-bold text-destructive mt-1.5">{errors.category_id.message}</p>
                )}
              </div>

              {/* Unit */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Đơn vị tính chuẩn <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch("unit_id")}
                  onValueChange={(val) => setValue("unit_id", val, { shouldValidate: true })}
                >
                  <SelectTrigger className={cn("h-10 rounded-[8px] border-border bg-card font-semibold text-sm", errors.unit_id && "border-destructive focus:ring-destructive")}>
                    <SelectValue placeholder="Chọn đơn vị đo lường..." />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((u) => (
                      <SelectItem key={u.id} value={String(u.id)} className="font-semibold text-xs">
                        {u.symbol} ({u.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.unit_id && (
                  <p className="text-xs font-bold text-destructive mt-1.5">{errors.unit_id.message}</p>
                )}
              </div>

              {/* Icon Picker (Emoji) */}
              <div className="space-y-1.5">
                <Label htmlFor="icon" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Biểu tượng Emoji <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="icon"
                    placeholder="Nhập 1 ký tự emoji..."
                    {...register("icon")}
                    className={cn(
                      "h-10 w-24 text-center text-xl rounded-[8px] font-sans",
                      errors.icon && "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                  
                  {/* Visual Picker Panel */}
                  <div className="flex-1 flex flex-wrap items-center gap-1.5 p-2 bg-muted/30 border border-border/40 rounded-xl max-h-[85px] overflow-y-auto">
                    {emojiPresets.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setValue("icon", emoji, { shouldValidate: true })}
                        className={`h-7 w-7 rounded-lg text-lg flex items-center justify-center transition border ${
                          watch("icon") === emoji
                            ? "bg-primary/20 border-primary scale-110"
                            : "bg-card border-border/40 hover:scale-105"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                {errors.icon && (
                  <p className="text-xs font-bold text-destructive mt-1.5">{errors.icon.message}</p>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
              <Button
                type="button"
                variant="outline"
                className="rounded-[8px] h-10 px-4 flex items-center gap-1.5"
                onClick={() => navigate("/foods")}
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại
              </Button>

              <Button
                type="submit"
                disabled={!isValid || saving}
                className="bg-[#7655aa] hover:bg-[#67489a] font-bold rounded-[8px] text-white flex items-center gap-1.5 h-10 px-5 transition-all duration-200"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <Save className="h-4 w-4 text-white" />
                )}
                {mode === "create" ? "Tạo thực phẩm" : "Cập nhật"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
export default FoodFormPage;
