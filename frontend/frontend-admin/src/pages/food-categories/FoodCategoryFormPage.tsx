import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Save, ArrowLeft, Loader2, Tags, Edit3 } from "lucide-react";
import { adminFoodCategoryApi } from "@/api/adminFoodCategoryApi";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FoodCategoryFormPageProps {
  mode: "create" | "edit";
}

const schema = z.object({
  name_vi: z.string().min(1, "Tên tiếng Việt là bắt buộc."),
  name_en: z.string().min(1, "Tên tiếng Anh là bắt buộc."),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function FoodCategoryFormPage({ mode }: FoodCategoryFormPageProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { name_vi: "", name_en: "", description: "" },
  });

  useEffect(() => {
    if (mode === "edit" && id) {
      async function fetchCategory() {
        setLoading(true);
        try {
          const category = await adminFoodCategoryApi.getById(Number(id));
          reset({
            name_vi: category.name_vi,
            name_en: category.name_en,
            description: category.description ?? "",
          });
        } catch {
          toast.error("Không thể tải thông tin danh mục.");
          navigate("/food-categories");
        } finally {
          setLoading(false);
        }
      }
      fetchCategory();
    } else {
      reset({ name_vi: "", name_en: "", description: "" });
    }
  }, [mode, id, reset, navigate]);

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const payload = {
        name_vi: values.name_vi.trim(),
        name_en: values.name_en.trim(),
        description: values.description?.trim() ? values.description.trim() : null,
      };
      if (mode === "create") {
        await adminFoodCategoryApi.create(payload);
        toast.success("Thêm danh mục thực phẩm thành công!");
      } else if (mode === "edit" && id) {
        await adminFoodCategoryApi.update(Number(id), payload);
        toast.success("Cập nhật danh mục thực phẩm thành công!");
      }
      navigate("/food-categories");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Đã xảy ra lỗi.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto space-y-6 animate-pulse">
        <div className="rounded-[20px] bg-card/60 p-6 shadow-card border border-border/40 h-32" />
        <div className="rounded-[20px] bg-card/60 p-6 shadow-card border border-border/40 h-64" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <PageHeader
        title={mode === "create" ? "Thêm Loại Thực Phẩm" : "Cập Nhật Loại Thực Phẩm"}
        description="Quản lý danh mục phân loại thực phẩm chuẩn hóa trong hệ thống."
        breadcrumbs={[
          { label: "Loại thực phẩm", to: "/food-categories" },
          { label: mode === "create" ? "Thêm mới" : "Chỉnh sửa" },
        ]}
      />

      <Card className="rounded-[20px] border-border/50 bg-card shadow-card overflow-hidden">
        <CardHeader className="border-b border-border/40 pb-4 flex flex-row items-center gap-3">
          <div className={`p-2 rounded-xl text-white ${mode === "create" ? "bg-primary" : "bg-[#ffb11f]"}`}>
            {mode === "create" ? <Tags className="h-5 w-5" /> : <Edit3 className="h-5 w-5" />}
          </div>
          <div>
            <CardTitle className="text-base font-bold">Thông tin danh mục</CardTitle>
            <CardDescription className="text-xs">Tên danh mục phải duy nhất trong hệ thống.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name_vi" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Tên tiếng Việt <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name_vi"
                placeholder="Ví dụ: Rau củ, Thịt cá..."
                {...register("name_vi")}
                className={cn("h-10 rounded-[8px]", errors.name_vi && "border-destructive")}
              />
              {errors.name_vi && <p className="text-xs font-bold text-destructive">{errors.name_vi.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name_en" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Tên tiếng Anh <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name_en"
                placeholder="Ví dụ: Vegetables, Meat & Fish..."
                {...register("name_en")}
                className={cn("h-10 rounded-[8px]", errors.name_en && "border-destructive")}
              />
              {errors.name_en && <p className="text-xs font-bold text-destructive">{errors.name_en.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Mô tả
              </Label>
              <Textarea
                id="description"
                rows={3}
                placeholder="Mô tả ngắn gọn..."
                {...register("description")}
                className="rounded-[8px] resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
              <Button type="button" variant="outline" className="rounded-[8px] h-10" onClick={() => navigate("/food-categories")}>
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Quay lại
              </Button>
              <Button
                type="submit"
                disabled={!isValid || saving}
                className="bg-[#7655aa] hover:bg-[#67489a] font-bold rounded-[8px] text-white h-10 px-5"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
                {mode === "create" ? "Tạo danh mục" : "Cập nhật"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
export default FoodCategoryFormPage;
