import { z } from "zod";
import { todayIso } from "@/shared/utils/date";

export const fridgeFormSchema = z.object({
  food_id: z.string().min(1, "Chọn thực phẩm."),
  quantity: z.coerce.number().positive("Số lượng phải lớn hơn 0."),
  expiry_date: z.string().min(1, "Chọn hạn sử dụng.").refine((value) => value >= todayIso(), "Hạn sử dụng phải từ hôm nay trở đi."),
  location: z.enum(["Ngăn mát", "Ngăn đông", "Kệ thường"]),
});
