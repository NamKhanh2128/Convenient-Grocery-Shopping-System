import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { useAuthStore } from "@/modules/auth/store/authStore";
import { AppModal } from "@/shared/components/AppModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/shared/store/languageStore";
import { registerSchema } from "../schemas";

type FormValues = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const registerUser = useAuthStore((state) => state.register);
  const loading = useAuthStore((state) => state.loading);
  const t = useT();
  const [successOpen, setSuccessOpen] = useState(false);
  const { register, handleSubmit, watch, setError, formState: { errors, isValid } } = useForm<FormValues>({ resolver: zodResolver(registerSchema), mode: "onChange" });
  const password = watch("password") ?? "";
  const strength = useMemo(() => {
    const score = [/[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((rule) => rule.test(password)).length + (password.length >= 8 ? 1 : 0);
    if (score <= 2) return { label: t("strengthWeak"), className: "bg-red-500", width: "33%" };
    if (score <= 4) return { label: t("strengthMedium"), className: "bg-orange-500", width: "66%" };
    return { label: t("strengthStrong"), className: "bg-green-500", width: "100%" };
  }, [password, t]);

  async function onSubmit(values: FormValues) {
    try {
      await registerUser({ full_name: values.full_name, email: values.email, phone: values.phone, password: values.password });
      setSuccessOpen(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Đăng ký thất bại.";
      if (message.includes("Email")) setError("email", { message: "Email đã tồn tại" });
      else toast.error(message);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[#7655aa] px-4">
      <div className="w-full max-w-lg rounded-[8px] bg-white p-8 shadow-[0_24px_70px_rgba(37,28,52,0.28)]">
        <h1 className="text-3xl font-extrabold">{t("registerTitle")}</h1>
        <p className="mt-1 text-sm text-[#746d82]">{t("registerSubtitle")}</p>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <Field error={errors.full_name?.message}><Input placeholder={t("fieldFullName")} {...register("full_name")} /></Field>
          <Field error={errors.email?.message}><Input placeholder={t("fieldEmail")} {...register("email")} /></Field>
          <Field error={errors.phone?.message}><Input placeholder={t("fieldPhone")} {...register("phone")} /></Field>
          <Field error={errors.password?.message}>
            <Input type="password" placeholder={t("fieldPassword")} {...register("password")} />
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#eee9f7]"><div className={`h-full ${strength.className}`} style={{ width: strength.width }} /></div>
            <p className="mt-1 text-xs font-bold text-[#746d82]">{t("strengthLabel")}: {strength.label}</p>
          </Field>
          <Field error={errors.confirm_password?.message}><Input type="password" placeholder={t("fieldConfirmPassword")} {...register("confirm_password")} /></Field>
          <Button className="h-11 w-full rounded-[8px] bg-[#ffb11f] text-white hover:bg-[#f0a316]" disabled={!isValid || loading}>
            <UserPlus className="mr-2 h-4 w-4" /> {loading ? t("registerLoading") : t("registerButton")}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-[#746d82]">{t("hasAccount")} <Link className="font-bold text-[#7655aa]" to="/login">{t("loginLink")}</Link></p>
      </div>
      <AppModal open={successOpen} onOpenChange={setSuccessOpen} type="success" title="Tạo tài khoản thành công" primaryLabel="Đăng nhập ngay" secondaryLabel={t("cancel")} onPrimary={() => navigate("/login", { replace: true })} />
    </div>
  );
}

function Field({ children, error }: { children: React.ReactNode; error?: string }) {
  return <div>{children}{error && <p className="mt-1 text-xs text-destructive">{error}</p>}</div>;
}
