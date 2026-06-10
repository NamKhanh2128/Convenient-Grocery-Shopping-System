# 🛡️ NATEAT Admin Portal — `frontend_admin`

Trang quản trị hệ thống **NATEAT** — quản lý người dùng, thực phẩm, công thức nấu ăn, lịch sử bữa ăn và thống kê toàn hệ thống.

> ⚠️ Dành **riêng cho quản trị viên (ADMIN)**. Người dùng thông thường không có quyền truy cập.

---

## 🖥️ Tech Stack

| Thành phần | Công nghệ |
|---|---|
| Framework | [React 19](https://react.dev/) + [Vite 8](https://vitejs.dev/) |
| Ngôn ngữ | TypeScript 6 |
| Routing | React Router DOM v7 |
| Styling | Tailwind CSS v4 + `tw-animate-css` |
| UI Components | Radix UI (headless) |
| Form & Validation | React Hook Form v7 + Zod v4 |
| State Management | Zustand v5 |
| Charts | Recharts v3 |
| Notifications | Sonner v2 |
| Icons | Lucide React |
| Data Layer | Mock DB (LocalStorage) — chia sẻ với `frontend_user` |

---

## 🚀 Bắt đầu

### Cài đặt dependencies

```bash
cd frontend_admin
npm install
```

### Chạy development server

```bash
npm run dev
```

Mở trình duyệt tại: **http://localhost:5174**

### Build production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

---

## 🔐 Tài khoản đăng nhập demo

| Email | Mật khẩu | Vai trò |
|---|---|---|
| `admin@nateat.vn` | `Admin@123` | Quản trị viên ✅ |
| `user@nateat.vn` | `User@123` | Người dùng ❌ (bị từ chối) |

> Tài khoản ADMIN duy nhất có thể đăng nhập vào trang quản trị. Tài khoản USER thường sẽ bị từ chối với thông báo lỗi.

---

## 📁 Cấu trúc thư mục

```
frontend_admin/
├── public/                     # Tài nguyên tĩnh
├── src/
│   ├── api/                    # Mock API layer (đọc/ghi LocalStorage)
│   │   ├── adminFamilyApi.ts   # API quản lý gia đình
│   │   ├── adminFoodApi.ts     # API quản lý thực phẩm
│   │   ├── adminMealApi.ts     # API quản lý bữa ăn
│   │   ├── adminRecipeApi.ts   # API quản lý công thức
│   │   ├── adminShoppingApi.ts # API danh sách mua sắm
│   │   ├── adminStatsApi.ts    # API thống kê & báo cáo
│   │   └── adminUserApi.ts     # API quản lý người dùng
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AdminHeader.tsx  # Thanh header (thông tin user, logout)
│   │   │   ├── AdminLayout.tsx  # Layout chính (sidebar + header + content)
│   │   │   └── AdminSidebar.tsx # Sidebar điều hướng có thể thu gọn
│   │   ├── shared/             # Components dùng chung
│   │   │   ├── AdminErrorBoundary.tsx
│   │   │   ├── AppModal.tsx
│   │   │   ├── BulkActionBar.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   ├── DataTable.tsx   # Bảng dữ liệu có sort, select, skeleton
│   │   │   ├── FilterBar.tsx
│   │   │   ├── PageHeader.tsx  # Header trang với breadcrumb
│   │   │   ├── Pagination.tsx
│   │   │   ├── SearchInput.tsx
│   │   │   └── StatCard.tsx
│   │   └── ui/                 # Radix UI components (button, input, dialog...)
│   ├── constants/
│   │   └── options.ts          # Các tùy chọn enum (danh mục, đơn vị, độ khó...)
│   ├── lib/
│   │   ├── date.ts             # Tiện ích xử lý ngày tháng
│   │   ├── i18n.ts             # Bộ dịch đa ngôn ngữ (vi/en)
│   │   ├── mockDb.ts           # Mock database (LocalStorage)
│   │   ├── storage.ts          # Tiện ích LocalStorage, uid, wait
│   │   └── utils.ts            # cn() utility
│   ├── pages/
│   │   ├── LoginPage.tsx       # Trang đăng nhập admin
│   │   ├── DashboardPage.tsx   # Trang tổng quan & thống kê nhanh
│   │   ├── foods/
│   │   │   ├── FoodListPage.tsx    # Danh sách thực phẩm
│   │   │   └── FoodFormPage.tsx    # Thêm/sửa thực phẩm
│   │   ├── meals/
│   │   │   └── MealListPage.tsx    # Lịch sử bữa ăn & xuất CSV
│   │   ├── recipes/
│   │   │   ├── RecipeListPage.tsx  # Danh sách công thức (grid/table)
│   │   │   └── RecipeFormPage.tsx  # Thêm/sửa công thức + nguyên liệu
│   │   ├── settings/
│   │   │   └── SettingsPage.tsx    # Cài đặt cá nhân, đổi mật khẩu, reset data
│   │   ├── statistics/
│   │   │   └── StatisticsPage.tsx  # Biểu đồ thống kê chi tiết
│   │   └── users/
│   │       ├── UserListPage.tsx    # Danh sách người dùng, khóa/mở khóa
│   │       └── UserFormPage.tsx    # Thêm/sửa tài khoản người dùng
│   ├── router/
│   │   └── AdminRouter.tsx     # Định nghĩa routes & protected route
│   ├── schemas/
│   │   └── auth.ts             # Zod schemas (login, profile, changePassword)
│   ├── store/
│   │   ├── authStore.ts        # Zustand store xác thực admin
│   │   └── languageStore.ts    # Zustand store ngôn ngữ (vi/en)
│   ├── types/
│   │   ├── database.ts         # Type definitions (User, Food, Recipe...)
│   │   └── index.ts
│   ├── App.tsx                 # Root component
│   ├── main.tsx                # Entry point
│   └── styles.css              # Global styles & Tailwind theme tokens
├── index.html
├── package.json
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

---

## ✨ Tính năng

### 🔒 Xác thực & Phân quyền
- Đăng nhập bảo mật — chỉ chấp nhận tài khoản có role `ADMIN`
- Session lưu qua LocalStorage, tự động khôi phục khi tải lại trang
- Ghi nhớ email đăng nhập ("Ghi nhớ đăng nhập")
- Protected routes — tự động redirect về `/login` nếu chưa xác thực

### 👥 Quản lý Người dùng
- Xem danh sách người dùng với filter vai trò (ADMIN/USER) và trạng thái (hoạt động/bị khóa)
- Tìm kiếm theo họ tên, email hoặc số điện thoại
- Thêm mới / chỉnh sửa thông tin người dùng
- Khóa / Mở khóa tài khoản (không thể tự khóa chính mình)
- Đặt lại mật khẩu nhanh cho người dùng
- Xóa đơn lẻ hoặc xóa hàng loạt (bulk delete)

### 🥦 Quản lý Thực phẩm
- Quản lý danh mục thực phẩm chuẩn của hệ thống
- Filter theo danh mục (Rau củ, Thịt cá, Đồ khô, Sữa & Trứng, Gia vị, Khác)
- Bộ chọn emoji trực quan cho biểu tượng thực phẩm
- Xóa hàng loạt

### 📖 Quản lý Công thức
- Xem ở dạng **lưới (grid)** hoặc **bảng (table)**
- Quản lý thông tin: tên, mô tả, hình ảnh, thời gian, calo, độ khó
- Quản lý **nguyên liệu động** (thêm/xóa từng dòng)
- Quản lý **các bước thực hiện** (thêm/xóa, kéo lên/xuống)

### 🍽️ Quản lý Bữa ăn
- Xem lịch sử kế hoạch bữa ăn của tất cả gia đình
- Filter theo bữa (Sáng/Trưa/Tối/Bữa phụ) và theo ngày
- **Xuất báo cáo CSV** với encoding UTF-8 (hỗ trợ tiếng Việt)
- In danh sách trực tiếp từ trình duyệt

### 📊 Thống kê
- Tổng số người dùng, thực phẩm, công thức, gia đình
- Biểu đồ bữa ăn theo 7 ngày gần nhất
- Biểu đồ phân bố thực phẩm theo danh mục (Pie chart)
- Top công thức được dùng nhiều nhất
- Biểu đồ hoạt động hệ thống (7 ngày)

### ⚙️ Cài đặt
- Chỉnh sửa thông tin cá nhân (họ tên, email, số điện thoại)
- Đổi mật khẩu
- Chuyển đổi ngôn ngữ (Tiếng Việt / English)
- Reset toàn bộ dữ liệu về trạng thái ban đầu
- Xuất toàn bộ dữ liệu dưới dạng JSON

---

## 🗃️ Data Layer — Mock Database

Admin portal **chia sẻ cùng dữ liệu** với `frontend_user` thông qua LocalStorage.

| Key | Mô tả |
|---|---|
| `nateat.db.v2` | Toàn bộ dữ liệu ứng dụng (users, foods, recipes...) |
| `nateat.session` | Session đăng nhập hiện tại |
| `nateat.token` | Token xác thực |

> ⚠️ **Quan trọng:** `DB_KEY` và `SESSION_KEY` trong `mockDb.ts` của admin **phải khớp chính xác** với `frontend_user` để hai ứng dụng cùng thao tác trên một bộ dữ liệu.

Dữ liệu khởi tạo bao gồm:
- **5 người dùng** (4 USER + 1 ADMIN)
- **12 loại thực phẩm** chuẩn
- **4 công thức** nấu ăn mẫu
- **1 gia đình** với 4 thành viên
- Dữ liệu tủ lạnh, danh sách mua sắm, kế hoạch bữa ăn mẫu

---

## 🏗️ Kiến trúc

### Authentication Flow

```
Truy cập URL
    ↓
AdminProtectedRoute
    ↓
bootstrap() — đọc session từ LocalStorage
    ↓
Có session & user.role === "ADMIN"?
    ├── ✅ → AdminLayout (dashboard, users, ...)
    └── ❌ → Redirect /login
```

### Route Structure

```
/ (AdminRouter, BrowserRouter)
├── /login              → LoginPage (public)
└── / (AdminProtectedRoute — ADMIN only)
    ├── /               → redirect /dashboard
    ├── /dashboard      → DashboardPage
    ├── /users          → UserListPage
    ├── /users/new      → UserFormPage (mode=create)
    ├── /users/:id      → UserFormPage (mode=edit)
    ├── /foods          → FoodListPage
    ├── /foods/new      → FoodFormPage (mode=create)
    ├── /foods/:id      → FoodFormPage (mode=edit)
    ├── /recipes        → RecipeListPage
    ├── /recipes/new    → RecipeFormPage (mode=create)
    ├── /recipes/:id    → RecipeFormPage (mode=edit)
    ├── /meals          → MealListPage
    ├── /statistics     → StatisticsPage
    ├── /settings       → SettingsPage
    └── /*              → redirect /dashboard
```

---

## 🎨 Design System

Trang admin sử dụng **design tokens** chia sẻ với `frontend_user` — cùng bộ màu, border-radius và shadow.

**Màu chủ đạo:** Purple — `oklch(0.52 0.22 290)` (`#7655aa`)

**Font:** Inter (Google Fonts)

**CSS Variables** được khai báo trong [`styles.css`](./src/styles.css) và được Tailwind CSS v4 consume thông qua `@theme inline`.

---

## 🌐 Đa ngôn ngữ (i18n)

File [`src/lib/i18n.ts`](./src/lib/i18n.ts) định nghĩa tất cả chuỗi dịch cho **Tiếng Việt** và **English**.

```ts
// Sử dụng trong component
const t = useT();
<span>{t("userManagement")}</span>
```

Ngôn ngữ được lưu vào LocalStorage và thay đổi ngay lập tức không cần tải lại trang.

---

## 🔧 Cấu hình

### `vite.config.ts`
- Plugin: `@vitejs/plugin-react`, `@tailwindcss/vite`
- Alias: `@` → `./src`
- Port dev: **5174**

### `tsconfig.app.json`
- Target: ES2020, strict mode
- Path alias: `@/*` → `./src/*`
- `noUncheckedIndexedAccess: true` — bật kiểm tra index safety
- `allowArbitraryExtensions: true` — cho phép import CSS

---

## 📝 Ghi chú phát triển

- Khi thêm translation key mới, phải thêm vào **cả hai** locale `vi` và `en` trong `i18n.ts`
- Tất cả thao tác API đều là **async** và giả lập độ trễ 250ms (`wait()`) để thực tế hơn
- `mockDb.ts` của admin là bản sao của `frontend_user` — **không thay đổi `DB_KEY` và `SESSION_KEY`**
- Mỗi route được wrap bởi `<AdminErrorBoundary>` và `<Suspense>` để xử lý lỗi và lazy loading
- Sidebar có thể **thu gọn** để tăng không gian làm việc trên màn hình nhỏ
