# Báo cáo kiểm tra hệ thống Authentication (Đăng ký / Đăng nhập / Quên mật khẩu / Đổi mật khẩu)

Ngày kiểm tra: 2026-06-11
Phạm vi: `backend/src/{controllers,services,routes,middleware,middlewares,models}`, `frontend/frontend-user/src/modules/auth`, `frontend/frontend-admin/src/{store,pages,lib}`.

---

## TÓM TẮT MỨC ĐỘ NGHIÊM TRỌNG

| # | Vấn đề | Mức độ | Khu vực |
|---|---|---|---|
| 1 | Admin frontend không render `AdminRouter` — toàn bộ UI đăng nhập admin không thể truy cập | 🔴 Nghiêm trọng (Blocker) | frontend-admin |
| 2 | Bất kỳ token `mock-token-*` đều được backend coi là **ADMIN** → bypass toàn bộ `/api/admin/*` | 🔴 Nghiêm trọng (Bảo mật) | backend |
| 3 | Đăng nhập Admin (frontend) hoàn toàn là mock localStorage, không gọi backend thật | 🔴 Nghiêm trọng (Bảo mật/Logic) | frontend-admin |
| 4 | "Quên mật khẩu" chưa được implement (cả backend lẫn frontend) | 🟠 Cao (Tính năng thiếu) | backend + cả 2 frontend |
| 5 | "Đổi mật khẩu" (user) — UI đầy đủ nhưng API là stub luôn `throw`, backend không có route | 🟠 Cao (Tính năng thiếu) | backend + frontend-user |
| 6 | `is_locked` / `failed_login_attempts` không được kiểm tra khi login | 🟡 Trung bình (Logic) | backend |
| 7 | 3 middleware xác thực khác nhau, không đồng nhất (`middleware/auth.js`, `middlewares/authMiddleware.js`, inline trong `fridgeRoutes.js`) | 🟡 Trung bình (Bảo trì) | backend |
| 8 | `backend/src/models/UserModel.js` là dead code, logic khác với `authService` đang dùng | 🟢 Thấp (Dọn dẹp) | backend |
| 9 | `frontend/frontend-user/src/App.js` và `src/views/LoginPage.js` là code cũ không dùng | 🟢 Thấp (Dọn dẹp) | frontend-user |

---

## 1. 🔴 Admin frontend: `App.tsx` không render `AdminRouter`

**File:** `frontend/frontend-admin/src/App.tsx` (đang có thay đổi chưa commit)

`src/main.tsx` render `<App />`, nhưng `App.tsx` hiện tại (working tree, chưa commit) là một trang test kết nối Supabase ("Supabase Todos Connection Test") — **không** chứa `<AdminRouter />` và `<Toaster />` như bản đã commit (`HEAD`, commit `efe02a5 FULL_ADMIN_FE+BE`).

```diff
- import { Toaster } from "sonner";
- import { AdminRouter } from "./router/AdminRouter";
- export function App() {
-   return (<><AdminRouter /><Toaster .../></>);
- }
+ import { useState, useEffect } from 'react'
+ import { supabase } from './utils/supabase'
+ export function App() {
+   // Supabase Todos Connection Test ...
+ }
```

➡ **Hậu quả:** Trang `LoginPage` của admin (`/login`), `AdminRouter`, `AdminProtectedRoute`, toàn bộ dashboard/users/foods/... **không bao giờ được render**. App build thành công (Docker build pass) nhưng khi chạy chỉ hiển thị trang test Supabase trống.

✅ **Đã có sẵn file backup đúng:** `frontend/frontend-admin/src/App.original.tsx` chứa đúng nội dung cần khôi phục (giống hệt `HEAD`).

**Đề xuất fix** (chưa áp dụng — chờ xác nhận vì đây là sửa code, không phải Docker):
```tsx
import { Toaster } from "sonner";
import { AdminRouter } from "./router/AdminRouter";

export function App() {
  return (
    <>
      <AdminRouter />
      <Toaster position="top-right" richColors />
    </>
  );
}
export default App;
```
(và xóa `App.original.tsx`, `src/utils/supabase.ts` nếu không còn dùng nơi khác)

---

## 2. 🔴 Lỗ hổng bypass xác thực Admin qua `mock-token-*`

**File:** `backend/src/middleware/auth.js` (`authRequired`, dùng cho **toàn bộ** route `/api/admin/*`, `/api/foods`, `/api/recipes`, `/api/shopping-lists`, `/api/meal-plans`)

```js
async function resolveMockUser(token) {
  const mockId = token.slice('mock-token-'.length);
  const user_id = await bridge.resolveShoppingUserId(mockId);
  ...
  const user = {
    user_id, id: user_id, ...,
    email: 'dev@nateat.vn',
    full_name: 'Dev User',
    role: 'ADMIN',          // ⚠️ LUÔN LUÔN LÀ ADMIN
  };
  return user;
}

function authRequired(req, res, next) {
  ...
  if (token.startsWith('mock-token-')) {
    resolveMockUser(token).then((user) => { req.user = user; next(); })
    ...
  }
}
```

`adminUserRoutes.js` (và mọi route admin khác) dùng `router.use(authRequired, adminRequired)`. `adminRequired` chỉ kiểm tra `req.user.role === 'ADMIN'`. Vì `resolveMockUser` **luôn gán `role: 'ADMIN'`** bất kể `mock-token-<bất kỳ chuỗi gì>`, nên:

> Bất kỳ ai gửi header `Authorization: Bearer mock-token-anything` đều được coi là **ADMIN** và có toàn quyền với `/api/admin/users` (tạo/sửa/xóa/khóa/reset mật khẩu user khác), `/api/admin/foods`, `/api/admin/recipes`, `/api/admin/families`, `/api/admin/shopping-lists`, `/api/admin/meal-plans`, `/api/admin/stats`, `/api/admin/settings`, `/api/admin/notifications` — **không cần đăng nhập thật**.

➡ Đây là backdoor xác thực còn sót lại từ giai đoạn phát triển mock-data, hiện vẫn hoạt động trên build production.

---

## 3. 🔴 Đăng nhập Admin (frontend) là mock 100%, không gọi backend

**File:** `frontend/frontend-admin/src/store/authStore.ts`

```ts
login: async (email, password) => {
  const state = await db();                       // đọc localStorage mock DB
  const user = state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) throw new Error("Email hoặc mật khẩu không đúng.");
  const expectedPassword = user.password ?? (user.role === "ADMIN" ? "Admin@123" : "User@123");
  if (expectedPassword !== password) throw new Error("Email hoặc mật khẩu không đúng.");
  if (user.role !== "ADMIN") throw new Error("Tài khoản không có quyền quản trị.");
  if (user.locked) throw new Error("Tài khoản đã bị khóa.");
  const token = `mock-token-${user.user_id}`;      // sinh token giả
  setSession({ token, user_id: user.user_id });
  ...
}
```

- Không gọi `POST /auth/login`.
- Mật khẩu mặc định **hardcode**: `Admin@123` cho admin, `User@123` cho user (seed trong `mockDb.ts`, key `nateat.db.v2`).
- Token sinh ra (`mock-token-admin-1`, ...) được `httpClient.ts` gắn vào header `Authorization` cho mọi request `/api/admin/*` thật → kết hợp với mục **#2** ở trên tạo thành chuỗi bypass hoàn chỉnh: đăng nhập giả → token giả → backend coi là ADMIN thật.
- `changePassword` / `updateProfile` của admin (cùng file) cũng chỉ sửa `localStorage`, **không đồng bộ với DB thật** (bảng `users`).

---

## 4. 🟠 "Quên mật khẩu" (Forgot Password) — chưa implement

| Nơi | Hiện trạng |
|---|---|
| `backend/src/routes/authRoutes.js` | Không có route `/auth/forgot-password` hay `/auth/reset-password` |
| `frontend/frontend-user/.../LoginPage.tsx:83` | `onClick={() => toast.info("Tính năng quên mật khẩu đang được phát triển.")}` — chỉ hiện toast |
| `frontend/frontend-admin/.../LoginPage.tsx:164` | `onClick={() => toast.info("Vui lòng liên hệ nhà phát triển hệ thống để được cấp lại quyền.")}` — chỉ hiện toast |

➡ Tính năng "Quên mật khẩu" hoàn toàn chưa tồn tại ở backend, hai nút "Quên mật khẩu" trên FE chỉ là placeholder UI.

---

## 5. 🟠 "Đổi mật khẩu" (Change Password, user) — UI có nhưng không hoạt động

**Frontend** (`frontend/frontend-user/src/modules/auth`):
- `ChangePasswordPage.tsx` (route `/change-password`) và `ProfilePage.tsx` (modal đổi mật khẩu) đều có form đầy đủ, validate bằng `changePasswordSchema` (Zod).
- Cả hai gọi `useAuthStore().changePassword(...)` → `authApi.changePassword(...)`:

```ts
// authApi.ts
async changePassword(_user_id, _payload) {
  throw new Error("Chuc nang doi mat khau chua duoc ket noi backend.");
},
async updateProfile(_user_id, _payload) {
  throw new Error("Chuc nang cap nhat ho so chua duoc ket noi backend.");
},
```
→ Mọi lần submit đều ném lỗi "Chức năng đổi mật khẩu chưa được kết nối backend." (lỗi này hiện **không được try/catch** trong `ChangePasswordPage.onSubmit`, nên sẽ throw unhandled trong React — toast "Đã đổi mật khẩu." sẽ **không bao giờ chạy tới**).

**Backend:**
- `endpoints.ts` định nghĩa `changePassword: "/auth/change-password"` nhưng **`authRoutes.js` không có route này**, và `authService.js` không có hàm `changePassword`.
- Không có cách nào (qua API) để user tự đổi mật khẩu của chính họ. Chỉ có **Admin** mới đổi được mật khẩu của user khác qua `POST /api/admin/users/:id/reset-password` (`AdminUserModel.resetPassword`) — route này hoạt động đúng (hash bằng bcrypt, update `password_hash`), nhưng route này lại đứng sau lỗ hổng #2.

---

## 6. 🟡 Khóa tài khoản (`is_locked`) không được backend kiểm tra khi login

- `database-schema.md`: bảng `users` có cột `is_locked`, `failed_login_attempts`.
- Admin có thể khóa tài khoản qua `POST /api/admin/users/:id/toggle-lock` → set `is_locked = true`.
- **Nhưng** `authService.findUserByEmail()` (dùng cho `POST /auth/login`) **không SELECT** `is_locked`/`failed_login_attempts`, và `authService.login()` **không kiểm tra** các cờ này.

➡ User bị admin khóa (`is_locked = true`) **vẫn đăng nhập được bình thường** qua `/auth/login`.
➡ Đồng thời, `failed_login_attempts` không bao giờ được tăng/reset ở đâu cả — cột tồn tại trong schema nhưng vô dụng.
➡ Modal "Tài khoản bị khóa" trên cả hai LoginPage (kiểm tra `message.includes("khóa")`) **không bao giờ được kích hoạt** bởi backend thật (chỉ admin-mock-login mới throw message này).

---

## 7. 🟡 Ba middleware xác thực khác nhau, không đồng nhất

| Middleware | File | Dùng cho | Mock-token | JWT secret fallback |
|---|---|---|---|---|
| `authMiddleware` | `middlewares/authMiddleware.js` | `GET /auth/me` | `mock-token-*` → `FamilyModel.resolveUserIdentity` (tự tạo "dev user" nếu chưa có, role lấy từ DB) | Dùng `authTokenService` → throw nếu thiếu `JWT_SECRET_ACCESS`/`JWT_SECRET` |
| `authRequired` | `middleware/auth.js` | `/api/admin/*`, `/api/foods`, `/api/recipes`, `/api/shopping-lists`, `/api/meal-plans` | `mock-token-*` → **luôn role `ADMIN`** (xem mục #2) | Fallback `'dev-secret-change-me'` nếu thiếu env |
| `authMiddleware` (inline) | `routes/fridgeRoutes.js` | `/api/fridge/*` | `mock-token-*` → `req.user = { id: rawId, ... }` (không có role) | Fallback `'dev-secret'` nếu thiếu env |
| `authenticateFamilyRequest` | `routes/familyRoutes.js` | `/api/family/*` | `mock-token-*` → `FamilyModel.resolveUserIdentity` (giống `authMiddleware`) | Dùng `authTokenService` (throw nếu thiếu env) |

➡ 4 cách xử lý `mock-token-*` khác nhau, 2 secret fallback khác nhau (`dev-secret-change-me` vs `dev-secret`), tạo bề mặt tấn công và rủi ro không nhất quán khi role/permission được kiểm tra ở các route khác nhau. Nên hợp nhất về **một** middleware dùng chung.

---

## 8. 🟢 Dead code: `backend/src/models/UserModel.js`

- Không được `require` ở bất kỳ đâu (đã grep toàn bộ `backend/src`).
- Có logic validate riêng (mật khẩu tối thiểu 6 ký tự, role mặc định `'user'` lowercase) **khác** với `authService.js` đang dùng thực tế (không giới hạn độ dài mật khẩu, role hardcode `'user'`).
- Nên xóa để tránh nhầm lẫn cho người maintain sau này.

---

## 9. 🟢 Dead code phía frontend-user

- `frontend/frontend-user/src/App.js` và `src/views/LoginPage.js`: không được import bởi `index.html` → `src/main.tsx` → `AppRouter` (entry point thật dùng `src/modules/auth/pages/LoginPage.tsx`). Có vẻ là tàn dư từ phiên bản cũ trước khi tái cấu trúc sang `src/modules/...` + TanStack/Vite.

---

## ĐÁNH GIÁ CÁC FLOW HOẠT ĐỘNG ĐÚNG

✅ **Đăng ký (`POST /auth/register`)** — `authService.register`: validate input, check email trùng (case-insensitive), hash bcrypt (10 rounds), insert `role='user'`. OK.

✅ **Đăng nhập user (`POST /auth/login`)** — validate input, tìm user theo email, so sánh bcrypt, tạo `accessToken` (15m) + `refreshToken` (7d, lưu DB bảng `refresh_tokens`). OK (trừ vấn đề #6 về `is_locked`).

✅ **Refresh token (`POST /auth/refresh`)** — kiểm tra token tồn tại trong DB, chưa `revoked`, chưa hết hạn, verify JWT, cấp lại `accessToken`. OK.

✅ **Logout (`POST /auth/logout`)** — set `revoked = true` cho refresh token trong DB. OK.

✅ **`GET /auth/me`** — qua `authMiddleware` (`middlewares/authMiddleware.js`), trả về thông tin user hiện tại. OK.

✅ **Admin reset mật khẩu user (`POST /api/admin/users/:id/reset-password`)** — hash bcrypt, update `password_hash`. Logic đúng, nhưng route bị ảnh hưởng bởi lỗ hổng #2.

---

## ĐỀ XUẤT THỨ TỰ ƯU TIÊN XỬ LÝ

1. **Khôi phục `frontend/frontend-admin/src/App.tsx`** từ `App.original.tsx` (1 dòng thay đổi, có sẵn bản backup đúng) — nếu không làm được điều này thì admin không dùng được gì cả.
2. **Vá lỗ hổng `mock-token-*` → `role: ADMIN`** trong `backend/src/middleware/auth.js` — đây là lỗ hổng bảo mật nghiêm trọng nhất, cho phép truy cập admin API không cần xác thực.
3. **Nối `useAdminAuthStore.login` với `POST /auth/login` thật** thay vì mock localStorage, và kiểm tra `role === 'ADMIN'` từ response thật của backend.
4. **Implement `/auth/change-password`** ở backend (verify `old_password` bằng bcrypt rồi update `password_hash`) và nối `authApi.changePassword` ở frontend-user.
5. **Implement "Quên mật khẩu"** (cần quyết định cơ chế: email OTP / reset link — phụ thuộc hạ tầng gửi email chưa có trong project).
6. **Bổ sung kiểm tra `is_locked`** trong `authService.login` (trả lỗi rõ ràng để FE hiện modal "Tài khoản bị khóa").
7. Dọn dẹp: xóa `UserModel.js`, `App.original.tsx`, `frontend-user/src/App.js`, `frontend-user/src/views/LoginPage.js` sau khi xác nhận không còn tham chiếu.
8. Hợp nhất các middleware xác thực thành một module dùng chung.

---

## GHI CHÚ
Báo cáo này **chỉ kiểm tra và ghi nhận**, chưa áp dụng thay đổi nào vào code (theo đúng yêu cầu "kiểm tra lại và tạo báo cáo"). Cho biết nếu muốn tôi tiến hành sửa theo thứ tự ưu tiên ở trên (đặc biệt mục 1 và 2 là khẩn cấp).
