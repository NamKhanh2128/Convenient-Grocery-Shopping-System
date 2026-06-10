import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, LogIn, Plus, AlertCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { useAdminAuthStore } from "@/store/authStore";
import { AppModal } from "@/components/shared/AppModal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useT } from "@/store/languageStore";
import { loginSchema } from "@/schemas/auth";

type FormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAdminAuthStore((state) => state.login);
  const loading = useAdminAuthStore((state) => state.loading);
  const authError = useAdminAuthStore((state) => state.error);
  const t = useT();
  const remembered = useMemo(() => localStorage.getItem("nateat.remembered_email") ?? "", []);
  const [lockedOpen, setLockedOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(loginSchema) as any,
    mode: "onChange",
    defaultValues: {
      email: remembered,
      password: "",
      remember: Boolean(remembered),
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      await login(values.email, values.password);
      if (values.remember) {
        localStorage.setItem("nateat.remembered_email", values.email);
      } else {
        localStorage.removeItem("nateat.remembered_email");
      }
      toast.success("Đăng nhập quản trị thành công!");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tài khoản hoặc mật khẩu không đúng.";
      if (message.toLowerCase().includes("khóa")) {
        setLockedOpen(true);
      } else {
        toast.error(message);
      }
    }
  }

  return (
    <div className="grid min-h-screen bg-[#7655aa] lg:grid-cols-[1.08fr_0.92fr]">
      {/* Hero section */}
      <section className="hidden min-h-screen items-center justify-center p-10 lg:flex">
        <div className="max-w-xl text-white">
          <div className="mb-8 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#ffb11f]">
              <Plus className="h-6 w-6 text-white" />
            </div>
            <div className="text-3xl font-extrabold tracking-tight">NATEAT</div>
          </div>
          
          <div className="relative overflow-hidden rounded-[28px] bg-white/10 p-8 backdrop-blur-md border border-white/20 shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
            <div className="absolute -left-12 -top-12 h-40 w-40 rounded-full bg-yellow-500/20 blur-3xl" />
            <div className="absolute -right-12 -bottom-12 h-40 w-40 rounded-full bg-purple-500/20 blur-3xl" />
            
            <div className="relative flex flex-col items-center justify-center text-center py-12">
              <div className="grid h-20 w-20 place-items-center rounded-full bg-white/15 border border-white/30 shadow-inner mb-6 animate-pulse">
                <LogIn className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-extrabold mb-2">HỆ THỐNG QUẢN TRỊ VIÊN</h2>
              <p className="text-white/80 text-sm max-w-md font-medium leading-relaxed">
                Nền tảng kiểm soát tài nguyên, thống kê số liệu và cấu hình thực đơn thông minh cho các hộ gia đình.
              </p>
            </div>
          </div>

          <h1 className="mt-8 text-4xl font-extrabold leading-tight">NAT-EAT ADMIN PORTAL</h1>
          <p className="mt-3 text-white/75 font-medium">Bảo mật - Tối ưu - Bền vững</p>
        </div>
      </section>

      {/* Form section */}
      <section className="grid place-items-center bg-white px-5 py-12">
        <div className="w-full max-w-md">
          {/* Mobile brand header */}
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#ffb11f] text-white">
              <Plus className="h-5 w-5" />
            </div>
            <div className="text-2xl font-extrabold text-[#5b368d]">NATEAT ADMIN</div>
          </div>

          <h1 className="text-3xl font-extrabold text-[#252033] tracking-tight">{t("loginTitle")}</h1>
          <p className="mt-2 text-sm font-semibold text-[#746d82]">{t("loginSubtitle")}</p>

          {authError && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-destructive/10 p-3.5 border border-destructive/20 text-xs font-bold text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5">
            <div>
              <Input
                placeholder={t("fieldEmail")}
                {...register("email")}
                className="h-11 rounded-[8px]"
              />
              {errors.email && (
                <p className="mt-1 text-xs font-bold text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder={t("fieldPassword")}
                  {...register("password")}
                  className="h-11 rounded-[8px] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-3.5 text-[#9188a1] transition hover:text-foreground"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs font-bold text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-muted-foreground">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <Checkbox
                  checked={watch("remember")}
                  onCheckedChange={(checked) =>
                    setValue("remember", Boolean(checked), { shouldValidate: true })
                  }
                />
                {t("rememberMe")}
              </label>

              <button
                type="button"
                onClick={() => toast.info("Vui lòng liên hệ nhà phát triển hệ thống để được cấp lại quyền.")}
                className="font-bold text-[#7655aa] transition hover:text-[#67489a]"
              >
                {t("forgotPassword")}
              </button>
            </div>

            <Button
              type="submit"
              className="h-11 w-full rounded-[8px] bg-[#7655aa] hover:bg-[#67489a] font-bold text-white transition-all duration-200 flex items-center justify-center gap-2"
              disabled={!isValid || loading}
            >
              <LogIn className="h-4 w-4 shrink-0" />
              {loading ? t("loginLoading") : t("loginButton")}
            </Button>
          </form>
        </div>
      </section>

      {/* Account locked modal */}
      <AppModal
        open={lockedOpen}
        onOpenChange={setLockedOpen}
        type="error"
        title="Tài khoản bị khóa"
        primaryLabel="Liên hệ quản trị cao cấp"
        secondaryLabel={t("close")}
        onPrimary={() => { toast.info("Đã gửi yêu cầu hỗ trợ tài khoản."); }}
      >
        Tài khoản quản trị của bạn đã bị khóa do nhập sai mật khẩu quá 5 lần hoặc vi phạm chính sách bảo mật hệ thống.
      </AppModal>
    </div>
  );
}
