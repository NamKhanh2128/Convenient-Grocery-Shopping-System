import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, LogIn, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { useAuthStore } from "@/modules/auth/store/authStore";
import { AppModal } from "@/shared/components/AppModal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useT } from "@/shared/store/languageStore";
import heroDish from "@/assets/hero-dish.jpg";
import { loginSchema } from "../schemas";

type FormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);
  const t = useT();
  const remembered = useMemo(() => localStorage.getItem("nateat.remembered_email") ?? "", []);
  const [lockedOpen, setLockedOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, watch, setValue, formState: { errors, isValid } } = useForm<FormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: { email: remembered, password: "", remember: Boolean(remembered) },
  });

  async function onSubmit(values: FormValues) {
    try {
      await login(values.email, values.password, values.remember);
      toast.success("Đăng nhập thành công");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Email hoặc mật khẩu không đúng";
      if (message.toLowerCase().includes("khóa")) setLockedOpen(true);
      else toast.error("Email hoặc mật khẩu không đúng");
    }
  }

  return (
    <div className="grid min-h-screen bg-[#7655aa] lg:grid-cols-[1.08fr_0.92fr]">
      <section className="hidden min-h-screen items-center justify-center p-10 lg:flex">
        <div className="max-w-xl text-white">
          <div className="mb-8 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#ffb11f]"><Plus /></div>
            <div className="text-3xl font-extrabold">NATEAT</div>
          </div>
          <img src={heroDish} alt="minh họa thực phẩm" className="h-[360px] w-full rounded-[28px] object-cover shadow-[0_30px_80px_rgba(0,0,0,0.25)]" />
          <h1 className="mt-8 text-4xl font-extrabold">{t("loginHeroTitle")}</h1>
          <p className="mt-3 text-white/75">{t("loginHeroSubtitle")}</p>
        </div>
      </section>
      <section className="grid place-items-center bg-white px-5">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#ffb11f] text-white"><Plus /></div>
            <div className="text-2xl font-extrabold text-[#5b368d]">NATEAT</div>
          </div>
          <h1 className="text-3xl font-extrabold">{t("loginTitle")}</h1>
          <p className="mt-2 text-sm text-[#746d82]">{t("loginSubtitle")}</p>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4">
            <div>
              <Input placeholder={t("fieldEmail")} {...register("email")} />
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} placeholder={t("fieldPassword")} {...register("password")} />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-2.5 text-[#9188a1]"><Eye className="h-4 w-4" /></button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <Checkbox checked={watch("remember")} onCheckedChange={(checked) => setValue("remember", Boolean(checked), { shouldValidate: true })} />
                {t("rememberMe")}
              </label>
              <button type="button" onClick={() => toast.info("Tính năng quên mật khẩu đang được phát triển.")} className="font-bold text-[#7655aa]">{t("forgotPassword")}</button>
            </div>
            <Button className="h-11 w-full rounded-[8px] bg-[#7655aa] hover:bg-[#67489a]" disabled={!isValid || loading}>
              <LogIn className="mr-2 h-4 w-4" /> {loading ? t("loginLoading") : t("loginButton")}
            </Button>
          </form>
          <Button asChild variant="outline" className="mt-3 h-11 w-full rounded-[8px]">
            <Link to="/register">{t("registerLink")}</Link>
          </Button>
        </div>
      </section>
      <AppModal open={lockedOpen} onOpenChange={setLockedOpen} type="error" title="Tài khoản bị khóa" primaryLabel="Liên hệ hỗ trợ" secondaryLabel={t("close")} onPrimary={() => { toast.info("Đã mở yêu cầu hỗ trợ tài khoản."); }}>
        Bạn đã nhập sai quá 5 lần.
      </AppModal>
    </div>
  );
}
