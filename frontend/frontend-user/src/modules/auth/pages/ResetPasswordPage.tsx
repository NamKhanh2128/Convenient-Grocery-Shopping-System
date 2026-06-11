import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { useAuthStore } from "@/modules/auth/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { passwordRule } from "../schemas";

const resetPasswordSchema = z
  .object({
    new_password: passwordRule,
    confirm_password: z.string().min(1, "Xác nhận mật khẩu mới."),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirm_password"],
  });

type FormValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordPage() {
  const resetPassword = useAuthStore((state) => state.resetPassword);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(resetPasswordSchema) });

  async function onSubmit(values: FormValues) {
    try {
      await resetPassword(token, values.new_password);
      toast.success("Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.");
      navigate("/login", { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Liên kết không hợp lệ hoặc đã hết hạn.";
      toast.error(message);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[#7655aa] px-5">
      <div className="w-full max-w-md rounded-[8px] bg-white p-8 shadow-card">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#ffb11f] text-white">
            <Plus className="h-5 w-5" />
          </div>
          <div className="text-2xl font-extrabold text-[#5b368d]">NATEAT</div>
        </div>

        <h1 className="text-2xl font-extrabold text-[#252033]">Đặt lại mật khẩu</h1>
        <p className="mt-2 text-sm text-[#746d82]">Nhập mật khẩu mới cho tài khoản của bạn.</p>

        {!token && (
          <p className="mt-4 text-xs font-bold text-destructive">
            Liên kết không hợp lệ. Vui lòng yêu cầu đặt lại mật khẩu mới.
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <Input type="password" placeholder="Mật khẩu mới" {...register("new_password")} />
            {errors.new_password && <p className="mt-1 text-xs text-destructive">{errors.new_password.message}</p>}
          </div>
          <div>
            <Input type="password" placeholder="Xác nhận mật khẩu mới" {...register("confirm_password")} />
            {errors.confirm_password && <p className="mt-1 text-xs text-destructive">{errors.confirm_password.message}</p>}
          </div>
          <Button type="submit" disabled={isSubmitting || !token} className="h-11 w-full rounded-[8px] bg-[#7655aa] hover:bg-[#67489a]">
            <KeyRound className="mr-2 h-4 w-4" /> Đặt lại mật khẩu
          </Button>
        </form>

        <div className="mt-6 flex items-center justify-center text-sm text-[#746d82]">
          <Link to="/login" className="font-bold text-[#7655aa]">Quay lại đăng nhập</Link>
        </div>
      </div>
    </div>
  );
}
