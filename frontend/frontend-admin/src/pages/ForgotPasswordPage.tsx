import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Plus, Send } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
import { useAdminAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/store/languageStore";

const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Vui lòng nhập email").email("Email không hợp lệ"),
});

type FormValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const forgotPassword = useAdminAuthStore((state) => state.forgotPassword);
  const t = useT();
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: FormValues) {
    await forgotPassword(values.email);
    setSent(true);
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[#7655aa] px-5">
      <div className="w-full max-w-md rounded-[8px] bg-white p-8 shadow-card">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#ffb11f] text-white">
            <Plus className="h-5 w-5" />
          </div>
          <div className="text-2xl font-extrabold text-[#5b368d]">NATEAT ADMIN</div>
        </div>

        <h1 className="text-2xl font-extrabold text-[#252033]">Quên mật khẩu</h1>
        <p className="mt-2 text-sm text-[#746d82]">
          Nhập email quản trị đã đăng ký, chúng tôi sẽ gửi cho bạn liên kết đặt lại mật khẩu.
        </p>

        {sent ? (
          <div className="mt-6 rounded-[8px] border border-[#7655aa]/20 bg-[#eee9f7] p-4 text-sm text-[#5b368d]">
            Nếu email tồn tại trong hệ thống, một liên kết đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <Input type="email" placeholder={t("fieldEmail")} {...register("email")} className="h-11 rounded-[8px]" />
              {errors.email && <p className="mt-1 text-xs font-bold text-destructive">{errors.email.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting} className="h-11 w-full rounded-[8px] bg-[#7655aa] hover:bg-[#67489a]">
              <Send className="mr-2 h-4 w-4" /> Gửi liên kết đặt lại
            </Button>
          </form>
        )}

        <div className="mt-6 flex items-center justify-center gap-1 text-sm text-[#746d82]">
          <Mail className="h-4 w-4" />
          <Link to="/login" className="font-bold text-[#7655aa]">Quay lại đăng nhập</Link>
        </div>
      </div>
    </div>
  );
}
