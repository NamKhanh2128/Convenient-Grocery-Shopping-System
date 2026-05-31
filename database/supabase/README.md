# Supabase – Schema tiếng Việt

Project dùng bảng có sẵn trên Supabase (không bắt buộc chạy `02_fridge_schema.sql`).

## Ánh xạ module Tủ lạnh

| Chức năng | Bảng |
|-----------|------|
| Chi tiết từng món trong tủ | `chi_tiet_tu_lanh` |
| Tủ lạnh theo gia đình | `tu_lanh` |
| Thực phẩm | `thuc_pham` |
| Danh mục | `danh_muc` |
| Đơn vị | `don_vi_tinh` |
| Gia đình | `gia_dinh` |
| Người dùng | `nguoi_dung` |

Cấu hình cột: `backend/src/config/fridgeSchema.js`

Nếu API lỗi `column ... does not exist`, chạy `inspect_vietnamese_schema.sql` trong SQL Editor và sửa `fridgeSchema.js` cho khớp.

## Test FE (Console)

```javascript
await sb.from('chi_tiet_tu_lanh').select('*').limit(3);
await sb.from('thuc_pham').select('*').limit(3);
```
