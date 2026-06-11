import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Save, ArrowLeft, Loader2, Tags, Edit3 } from "lucide-react";
import { adminRecipeCategoryApi } from "@/api/adminRecipeCategoryApi";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface RecipeCategoryFormPageProps {
  mode: "create" | "edit";
}

const recipeCategoryFormSchema = z.object({
  ten_danh_muc: z.string().min(1, "Tên danh mục là bắt buộc."),
  mo_ta: z.string().optional(),
});

type FormValues = z.infer<typeof recipeCategoryFormSchema>;

export function RecipeCategoryFormPage({ mode }: RecipeCategoryFormPageProps) {
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
    resolver: zodResolver(recipeCategoryFormSchema),
    mode: "onChange",
    defaultValues: {
      ten_danh_muc: "",
      mo_ta: "",
    },
  });

  useEffect(() => {
    if (mode === "edit" && id) {
      async function fetchCategory() {
        setLoading(true);
        try {
          const category = await adminRecipeCategoryApi.getById(Number(id));
          reset({
            ten_danh_muc: category.ten_danh_muc,
            mo_ta: category.mo_ta ?? "",
          });
        } catch (error) {
          toast.error("Không thể tải thông tin danh mục công thức.");
          navigate("/recipe-categories");
        } finally {
          setLoading(false);
        }
      }
      fetchCategory();
    } else {
      reset({ ten_danh_muc: "", mo_ta: "" });
    }
  }, [mode, id, reset, navigate]);

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const payload = {
        ten_danh_muc: values.ten_danh_muc,
        mo_ta: values.mo_ta?.trim() ? values.mo_ta.trim() : null,
      };
      if (mode === "create") {
        await adminRecipeCategoryApi.create(payload);
        toast.success("Thêm danh mục công thức thành công!");
      } else if (mode === "edit" && id) {
        await adminRecipeCategoryApi.update(Number(id), payload);
        toast.success("Cập nhật danh mục công thức thành công!");
      }
      navigate("/recipe-categories");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Đã xảy ra lỗi.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const breadcrumbs = [
    { label: "Danh mục công thức", to: "/recipe-categories" },
    { label: mode === "create" ? "Thêm mới" : "Chỉnh sửa" },
  ];

  if (loading) {
    return (
      <div className="max-w-xl mx-auto space-y-6 animate-pulse">
        <div className="rounded-[20px] bg-card/60 p-6 shadow-card border border-border/40">
          <div className="h-4 w-1/3 rounded-lg bg-muted mb-2" />
          <div className="h-8 w-2/3 rounded-lg bg-muted mb-2" />
          <div className="h-3 w-1/2 rounded-lg bg-muted" />
        </div>
        <div className="rounded-[20px] bg-card/60 p-6 shadow-card border border-border/40 space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
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
        title={mode === "create" ? "Thêm Danh Mục Công Thức" : "Cập Nhật Danh Mục Công Thức"}
        description={
          mode === "create"
            ? "Tạo danh mục mới để phân loại các công thức món ăn trong hệ thống."
            : "Chỉnh sửa tên và mô tả của danh mục công thức."
        }
        breadcrumbs={breadcrumbs}
      />

      <Card className="rounded-[20px] border-border/50 bg-card shadow-card overflow-hidden">
        <CardHeader className="border-b border-border/40 pb-4 flex flex-row items-center gap-3">
          <div className={`p-2 rounded-xl text-white ${mode === "create" ? "bg-primary" : "bg-[#ffb11f]"}`}>
            {mode === "create" ? <Tags className="h-5 w-5" /> : <Edit3 className="h-5 w-5" />}
          </div>
          <div>
            <CardTitle className="text-base font-bold">Thông tin danh mục</CardTitle>
            <CardDescription className="text-xs">
              Tên danh mục là duy nhất và được dùng để phân loại công thức nấu ăn.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="ten_danh_muc" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Tên danh mục <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ten_danh_muc"
                placeholder="Ví dụ: Món chay, Món tráng miệng..."
                {...register("ten_danh_muc")}
                className={cn(
                  "h-10 rounded-[8px] font-sans",
                  errors.ten_danh_muc && "border-destructive focus-visible:ring-destructive"
                )}
              />
              {errors.ten_danh_muc && (
                <p className="text-xs font-bold text-destructive mt-1.5">{errors.ten_danh_muc.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mo_ta" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Mô tả
              </Label>
              <Textarea
                id="mo_ta"
                rows={4}
                placeholder="Mô tả ngắn gọn về danh mục này..."
                {...register("mo_ta")}
                className="rounded-[8px] font-sans resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
              <Button
                type="button"
                variant="outline"
                className="rounded-[8px] h-10 px-4 flex items-center gap-1.5"
                onClick={() => navigate("/recipe-categories")}
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
                {mode === "create" ? "Tạo danh mục" : "Cập nhật"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
export default RecipeCategoryFormPage;
