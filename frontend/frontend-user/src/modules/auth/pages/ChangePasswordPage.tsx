import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useAuthStore } from "@/modules/auth/store/authStore";
import { ScreenHeader } from "@/shared/components/ScreenHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { changePasswordSchema } from "../schemas";

type Values = z.infer<typeof changePasswordSchema>;

export function ChangePasswordPage() {
  const changePassword = useAuthStore((state) => state.changePassword);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(changePasswordSchema) });

  async function onSubmit(values: Values) {
    await changePassword({ old_password: values.old_password, new_password: values.new_password });
    reset();
    toast.success("Đã đổi mật khẩu.");
  }

  return (
    <>
      <ScreenHeader title="Đổi mật khẩu" subtitle="Kiểm tra mật khẩu cũ, xác thực mật khẩu mới rồi lưu." />
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-4 rounded-[8px] bg-white p-6 shadow-card">
        <Input type="password" placeholder="Mật khẩu hiện tại" {...register("old_password")} />
        {errors.old_password && <p className="text-xs text-destructive">{errors.old_password.message}</p>}
        <Input type="password" placeholder="Mật khẩu mới" {...register("new_password")} />
        {errors.new_password && <p className="text-xs text-destructive">{errors.new_password.message}</p>}
        <Input type="password" placeholder="Xác nhận mật khẩu mới" {...register("confirm_password")} />
        {errors.confirm_password && <p className="text-xs text-destructive">{errors.confirm_password.message}</p>}
        <Button disabled={isSubmitting} className="rounded-[8px] bg-[#7655aa]">Đổi mật khẩu</Button>
      </form>
    </>
  );
}
