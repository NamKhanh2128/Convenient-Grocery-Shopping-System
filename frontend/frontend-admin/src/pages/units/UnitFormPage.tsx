import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Save, ArrowLeft, Loader2, Ruler, Edit3 } from "lucide-react";
import { adminUnitApi } from "@/api/adminUnitApi";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface UnitFormPageProps {
  mode: "create" | "edit";
}

const schema = z.object({
  name: z.string().min(1, "Tên đơn vị là bắt buộc."),
  symbol: z.string().min(1, "Ký hiệu là bắt buộc.").max(10, "Ký hiệu quá dài."),
});

type FormValues = z.infer<typeof schema>;

export function UnitFormPage({ mode }: UnitFormPageProps) {
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
    defaultValues: { name: "", symbol: "" },
  });

  useEffect(() => {
    if (mode === "edit" && id) {
      async function fetchUnit() {
        setLoading(true);
        try {
          const unit = await adminUnitApi.getById(Number(id));
          reset({ name: unit.name, symbol: unit.symbol });
        } catch {
          toast.error("Không thể tải thông tin đơn vị.");
          navigate("/units");
        } finally {
          setLoading(false);
        }
      }
      fetchUnit();
    } else {
      reset({ name: "", symbol: "" });
    }
  }, [mode, id, reset, navigate]);

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const payload = { name: values.name.trim(), symbol: values.symbol.trim() };
      if (mode === "create") {
        await adminUnitApi.create(payload);
        toast.success("Thêm đơn vị tính thành công!");
      } else if (mode === "edit" && id) {
        await adminUnitApi.update(Number(id), payload);
        toast.success("Cập nhật đơn vị tính thành công!");
      }
      navigate("/units");
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
        <div className="rounded-[20px] bg-card/60 p-6 shadow-card border border-border/40 h-48" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <PageHeader
        title={mode === "create" ? "Thêm Đơn Vị Tính" : "Cập Nhật Đơn Vị Tính"}
        description="Quản lý đơn vị đo lường chuẩn hóa cho thực phẩm."
        breadcrumbs={[
          { label: "Đơn vị tính", to: "/units" },
          { label: mode === "create" ? "Thêm mới" : "Chỉnh sửa" },
        ]}
      />

      <Card className="rounded-[20px] border-border/50 bg-card shadow-card overflow-hidden">
        <CardHeader className="border-b border-border/40 pb-4 flex flex-row items-center gap-3">
          <div className={`p-2 rounded-xl text-white ${mode === "create" ? "bg-primary" : "bg-[#ffb11f]"}`}>
            {mode === "create" ? <Ruler className="h-5 w-5" /> : <Edit3 className="h-5 w-5" />}
          </div>
          <div>
            <CardTitle className="text-base font-bold">Thông tin đơn vị</CardTitle>
            <CardDescription className="text-xs">Tên và ký hiệu phải duy nhất trong hệ thống.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Tên đơn vị <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Ví dụ: Kilogram, Lít..."
                {...register("name")}
                className={cn("h-10 rounded-[8px]", errors.name && "border-destructive")}
              />
              {errors.name && <p className="text-xs font-bold text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="symbol" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Ký hiệu <span className="text-destructive">*</span>
              </Label>
              <Input
                id="symbol"
                placeholder="Ví dụ: kg, l, g..."
                {...register("symbol")}
                className={cn("h-10 rounded-[8px]", errors.symbol && "border-destructive")}
              />
              {errors.symbol && <p className="text-xs font-bold text-destructive">{errors.symbol.message}</p>}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
              <Button type="button" variant="outline" className="rounded-[8px] h-10" onClick={() => navigate("/units")}>
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Quay lại
              </Button>
              <Button
                type="submit"
                disabled={!isValid || saving}
                className="bg-[#7655aa] hover:bg-[#67489a] font-bold rounded-[8px] text-white h-10 px-5"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
                {mode === "create" ? "Tạo đơn vị" : "Cập nhật"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
export default UnitFormPage;
