import { z } from "zod";

export const passwordRule = z
  .string()
  .min(8, "Mật khẩu tối thiểu 8 ký tự.")
  .regex(/[A-Z]/, "Cần ít nhất 1 chữ hoa.")
  .regex(/[0-9]/, "Cần ít nhất 1 số.");

export const loginSchema = z.object({
  email: z.string().min(1, "Vui lòng nhập email").email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
  remember: z.boolean().default(false),
});

export const profileSchema = z.object({
  full_name: z.string().min(1, "Họ tên là bắt buộc."),
  phone: z.string().min(9, "Số điện thoại không hợp lệ."),
  email: z.string().email("Email không đúng định dạng."),
});

export const changePasswordSchema = z
  .object({
    old_password: z.string().min(1, "Nhập mật khẩu hiện tại."),
    new_password: passwordRule,
    confirm_password: z.string().min(1, "Xác nhận mật khẩu mới."),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirm_password"],
  });
