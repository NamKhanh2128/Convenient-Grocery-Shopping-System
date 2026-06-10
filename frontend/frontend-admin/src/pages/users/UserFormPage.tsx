import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Save, ArrowLeft, Loader2, UserPlus, Edit2 } from "lucide-react";
import type { User } from "@/types";
import { adminUserApi } from "@/api/adminUserApi";
import { passwordRule } from "@/schemas/auth";
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
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface UserFormPageProps {
  mode: "create" | "edit";
}

export function UserFormPage({ mode }: UserFormPageProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Zod Schemas based on Create vs Edit Mode
  const formSchema = z.object({
    full_name: z.string().min(1, "Họ và tên là bắt buộc."),
    email: z.string().min(1, "Email là bắt buộc.").email("Email không hợp lệ."),
    phone: z.string().min(9, "Số điện thoại tối thiểu 9 số.").optional().or(z.literal("")),
    role: z.enum(["ADMIN", "USER"]),
    locked: z.boolean().default(false),
    // Only validate password in Create Mode
    password: mode === "create" ? passwordRule : z.string().optional().or(z.literal("")),
  });

  type FormValues = z.infer<typeof formSchema>;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    mode: "onChange",
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      role: "USER",
      locked: false,
      password: "",
    },
  });

  // Load User Data in Edit Mode
  useEffect(() => {
    if (mode === "edit" && id) {
      async function fetchUser() {
        setLoading(true);
        try {
          const user = await adminUserApi.getById(id!);
          reset({
            full_name: user.full_name,
            email: user.email,
            phone: user.phone || "",
            role: user.role,
            locked: user.locked || false,
            password: "", // Leave blank in Edit
          });
        } catch (error) {
          toast.error("Không thể tải thông tin người dùng.");
          navigate("/users");
        } finally {
          setLoading(false);
        }
      }
      fetchUser();
    } else {
      reset({
        full_name: "",
        email: "",
        phone: "",
        role: "USER",
        locked: false,
        password: "",
      });
    }
  }, [mode, id, reset, navigate]);

  // Submit Handler
  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      if (mode === "create") {
        await adminUserApi.create({
          full_name: values.full_name,
          email: values.email,
          phone: values.phone || undefined,
          role: values.role,
          locked: values.locked,
          password: values.password || "User@123", // fallback
        });
        toast.success("Thêm người dùng mới thành công!");
      } else if (mode === "edit" && id) {
        const updatePayload: Partial<User> = {
          full_name: values.full_name,
          email: values.email,
          phone: values.phone || undefined,
          role: values.role,
          locked: values.locked,
        };
        // Only update password if provided
        if (values.password) {
          updatePayload.password = values.password;
        }
        await adminUserApi.update(id, updatePayload);
        toast.success("Cập nhật thông tin thành công!");
      }
      navigate("/users");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const breadcrumbs = [
    { label: "Quản lý người dùng", to: "/users" },
    { label: mode === "create" ? "Thêm mới" : "Chỉnh sửa" },
  ];

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
        <div className="rounded-[20px] bg-card/60 p-6 shadow-card border border-border/40">
          <div className="h-4 w-1/3 rounded-lg bg-muted mb-2" />
          <div className="h-8 w-2/3 rounded-lg bg-muted mb-2" />
          <div className="h-3 w-1/2 rounded-lg bg-muted" />
        </div>
        <div className="rounded-[20px] bg-card/60 p-6 shadow-card border border-border/40 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
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
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title={mode === "create" ? "Thêm Người Dùng" : "Chỉnh Sửa Người Dùng"}
        description={
          mode === "create"
            ? "Tạo tài khoản thành viên mới cho hệ thống quản trị hoặc ứng dụng người dùng."
            : "Chỉnh sửa hồ sơ thông tin cá nhân và vai trò của thành viên."
        }
        breadcrumbs={breadcrumbs}
      />

      <Card className="rounded-[20px] border-border/50 bg-card shadow-card overflow-hidden">
        <CardHeader className="border-b border-border/40 pb-4 flex flex-row items-center gap-3">
          <div className={`p-2 rounded-xl text-white ${mode === "create" ? "bg-primary" : "bg-emerald-500"}`}>
            {mode === "create" ? <UserPlus className="h-5 w-5" /> : <Edit2 className="h-5 w-5" />}
          </div>
          <div>
            <CardTitle className="text-base font-bold">Thông tin tài khoản</CardTitle>
            <CardDescription className="text-xs">Vui lòng điền đầy đủ các thông tin bắt buộc dưới đây.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="full_name" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Họ và tên <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="full_name"
                  placeholder="Nhập họ và tên..."
                  {...register("full_name")}
                  className={cn(
                    "h-10 rounded-[8px] font-sans",
                    errors.full_name && "border-destructive focus-visible:ring-destructive"
                  )}
                />
                {errors.full_name && (
                  <p className="text-xs font-bold text-destructive mt-1.5">{errors.full_name.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Địa chỉ Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@nateat.vn"
                  {...register("email")}
                  className={cn(
                    "h-10 rounded-[8px] font-sans",
                    errors.email && "border-destructive focus-visible:ring-destructive"
                  )}
                />
                {errors.email && (
                  <p className="text-xs font-bold text-destructive mt-1.5">{errors.email.message}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Số điện thoại
                </Label>
                <Input
                  id="phone"
                  placeholder="09xxxxxxxx"
                  {...register("phone")}
                  className={cn(
                    "h-10 rounded-[8px] font-sans",
                    errors.phone && "border-destructive focus-visible:ring-destructive"
                  )}
                />
                {errors.phone && (
                  <p className="text-xs font-bold text-destructive mt-1.5">{errors.phone.message}</p>
                )}
              </div>

              {/* Role select */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Vai trò hệ thống <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch("role")}
                  onValueChange={(val: "ADMIN" | "USER") => setValue("role", val, { shouldValidate: true })}
                >
                  <SelectTrigger className="h-10 rounded-[8px] border-border bg-card font-semibold text-sm">
                    <SelectValue placeholder="Chọn vai trò..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER" className="font-semibold text-xs text-teal-600">
                      Người dùng (USER) - Sử dụng app mobile
                    </SelectItem>
                    <SelectItem value="ADMIN" className="font-semibold text-xs text-[#7655aa]">
                      Quản trị viên (ADMIN) - Sử dụng trang quản trị
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Password */}
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="password" className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                  <span>
                    Mật khẩu {mode === "create" && <span className="text-destructive">*</span>}
                  </span>
                  {mode === "edit" && <span className="text-[10px] lowercase font-medium text-muted-foreground/70">(để trống nếu không muốn thay đổi)</span>}
                </Label>
                <Input
                  id="password"
                  type="text"
                  placeholder={mode === "create" ? "Nhập mật khẩu..." : "Nhập mật khẩu mới nếu muốn đổi..."}
                  {...register("password")}
                  className={cn(
                    "h-10 rounded-[8px] font-sans",
                    errors.password && "border-destructive focus-visible:ring-destructive"
                  )}
                />
                {errors.password && (
                  <p className="text-xs font-bold text-destructive mt-1.5">{errors.password.message}</p>
                )}
                {mode === "create" && (
                  <p className="text-[10px] font-medium text-muted-foreground leading-relaxed bg-muted/30 p-2.5 rounded-lg border border-border/30">
                    ⚠️ <strong>Yêu cầu bảo mật:</strong> Tối thiểu 8 ký tự, chứa ít nhất 1 chữ viết hoa và 1 chữ số.
                  </p>
                )}
              </div>
            </div>

            {/* Status locked */}
            <div className="flex items-center gap-2.5 py-2 border-t border-border/40">
              <Checkbox
                id="locked"
                checked={watch("locked")}
                onCheckedChange={(checked) => setValue("locked", Boolean(checked), { shouldValidate: true })}
              />
              <Label htmlFor="locked" className="text-xs font-bold text-destructive cursor-pointer select-none">
                KHÓA TÀI KHOẢN NÀY
              </Label>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
              <Button
                type="button"
                variant="outline"
                className="rounded-[8px] h-10 px-4 flex items-center gap-1.5"
                onClick={() => navigate("/users")}
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
                {mode === "create" ? "Tạo tài khoản" : "Cập nhật"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
export default UserFormPage;
