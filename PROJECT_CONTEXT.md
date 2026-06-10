# PROJECT_CONTEXT.md
> **System Snapshot — Đóng băng hiện trạng hệ thống**
> Tài liệu này được tạo tự động bằng cách đọc toàn bộ source code hiện có.
> AI Agent mới **PHẢI đọc toàn bộ file này trước** khi thực hiện bất kỳ thay đổi nào.

---

## 1. Tổng quan hệ thống

### Tên dự án
**ITSS-NATEAT** — Convenient Grocery & Meal Planning System (Hệ thống mua sắm tiện lợi & lên thực đơn)

### Nhóm phát triển
Nhóm 27 — Môn ITSS

| Thành viên | MSSV |
|---|---|
| Nguyễn Mạnh Hùng | 20235735 |
| Nguyễn Thiệu Thành | 20235832 |
| Nguyễn Xuân Thành Hưng | 20235743 |
| Nguyễn Quốc Cường | 20235667 |
| Nguyễn Đức Nam Khánh | 20235755 |

### Mục đích dự án
Hệ thống hỗ trợ người dùng:
- Quản lý tài khoản và nhóm gia đình
- Quản lý danh sách mua sắm (tạo, chia sẻ, theo dõi trạng thái mua)
- Quản lý thực phẩm trong tủ lạnh (nhập, theo dõi hạn sử dụng, cảnh báo hết hạn)
- Lên kế hoạch bữa ăn (theo ngày/tuần)
- Gợi ý công thức nấu ăn thông minh từ nguyên liệu có sẵn
- Thống kê tiêu dùng thực phẩm

### Kiến trúc tổng thể
```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT TIER                              │
│                                                             │
│  frontend-user (React + Vite + TypeScript)                  │
│    Port: dev (Vite default)                                 │
│    Deploy: Cloudflare Workers (wrangler.jsonc)              │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/REST (Bearer JWT)
                       │ VITE_API_BASE_URL = http://localhost:3000/api
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                   APPLICATION TIER                          │
│                                                             │
│  backend (Node.js + Express.js)                             │
│    Port: 3000 (configurable via .env PORT)                  │
│    Entry: backend/server.js                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │ pg (node-postgres)
                       │ DATABASE_URL (Supabase PostgreSQL)
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    DATA TIER                                │
│                                                             │
│  Supabase PostgreSQL (hosted)                               │
│  Connection: aws-1-ap-southeast-2.pooler.supabase.com:6543  │
│  DB_POOL_MAX: 10 connections                               │
└─────────────────────────────────────────────────────────────┘
```

### Các module chính
| Module | Frontend | Backend |
|---|---|---|
| Auth | `modules/auth` | `AuthController`, `authService`, `authRoutes` |
| Family | `modules/family` | `FamilyController`, `FamilyModel`, `familyRoutes` |
| Fridge | `modules/fridge` | `FridgeController`, `FridgeItemModel`, `fridgeRoutes` |
| Shopping | `modules/shopping` | `ShoppingController`, `ShoppingModel`, `shoppingRoutes` |
| Recipe | `modules/recipe` | `RecipeController`, `RecipeModel`, `recipeRoutes` |
| Meal Plan | `modules/meal-plan` | `MealPlanController`, `MealPlanModel`, `mealPlanRoutes` |
| Statistics | `modules/statistics` | — (frontend only) |
| Food Catalog | `shared/api/foodApi` | `FoodController`, `FoodModel`, `foodRoutes` |

---

## 2. Cấu trúc thư mục

```
Convenient-Grocery-Shopping-System/
│
├── README.md
├── package.json                        # Root workspace package
├── package-lock.json
├── .gitignore
│
├── backend/                            # Node.js Express API Server
│   ├── server.js                       # Entry point — đăng ký tất cả routes
│   ├── package.json                    # Backend dependencies
│   ├── .env.example                    # Template biến môi trường
│   └── src/
│       ├── config/
│       │   ├── db.js                   # PostgreSQL Pool (pg)
│       │   ├── authSchema.js           # Env-driven column mapping cho users
│       │   ├── familySchema.js         # Env-driven column mapping cho family
│       │   ├── fridgeSchema.js         # Hard-coded column mapping cho fridge
│       │   ├── mealPlanSchema.js       # Column mapping cho meal_plans
│       │   └── recipeSchema.js         # Column mapping cho recipes
│       ├── controllers/
│       │   ├── AuthController.js
│       │   ├── FamilyController.js
│       │   ├── FoodController.js
│       │   ├── FridgeController.js
│       │   ├── MealPlanController.js
│       │   ├── RecipeController.js
│       │   └── ShoppingController.js
│       ├── middleware/
│       │   └── auth.js                 # authRequired — dùng cho recipe, shopping, food, meal-plan
│       ├── middlewares/
│       │   └── authMiddleware.js       # authMiddleware — dùng cho authRoutes
│       ├── models/
│       │   ├── FamilyModel.js          # SQL queries cho family_groups, group_members, invitations
│       │   ├── FoodModel.js            # SQL queries cho foods table
│       │   ├── FridgeItemModel.js      # SQL queries cho fridge_items
│       │   ├── MealPlanModel.js        # SQL queries cho meal_plans
│       │   ├── RecipeModel.js          # SQL queries cho recipes, recipe_ingredients
│       │   ├── ShoppingModel.js        # SQL queries cho shopping_lists, shopping_list_items
│       │   └── UserModel.js            # SQL queries cho users
│       ├── routes/
│       │   ├── authRoutes.js           # POST /register, /login, /refresh, GET /me, POST /logout
│       │   ├── familyRoutes.js         # GET/POST /api/family/*
│       │   ├── foodRoutes.js           # GET /api/foods
│       │   ├── fridgeRoutes.js         # GET/POST/PUT/PATCH/DELETE /api/fridge/items/*
│       │   ├── mealPlanRoutes.js       # GET/POST/DELETE/PATCH /api/meal-plans
│       │   ├── recipeRoutes.js         # Full CRUD /api/recipes
│       │   └── shoppingRoutes.js       # Full CRUD /api/shopping-lists
│       ├── services/
│       │   ├── authService.js          # Business logic auth (register, login, refresh, logout)
│       │   └── ShoppingService.js      # Business logic shopping list
│       └── utils/
│           ├── response.js             # Helper response format
│           └── shoppingBridge.js       # Bridge resolve IDs giữa mock-db và real-db
│
├── frontend/
│   └── frontend-user/                  # React SPA (Vite + TypeScript)
│       ├── index.html
│       ├── package.json
│       ├── vite.config.ts
│       ├── tsconfig.json
│       ├── components.json             # shadcn/ui config
│       ├── .env.example
│       ├── fix_fe.md                   # Ghi chú fix FE (đang dở)
│       └── src/
│           ├── main.tsx                # React entry point
│           ├── App.js                  # Legacy JS entry (tồn tại song song)
│           ├── index.js                # Legacy JS entry
│           ├── styles.css              # Global CSS
│           ├── app/
│           │   ├── router/
│           │   │   └── AppRouter.tsx   # Định nghĩa toàn bộ routes React
│           │   └── providers/
│           │       └── AppProviders.tsx # QueryClient + Toaster wrapper
│           ├── layouts/
│           │   └── MainLayout.tsx      # Header + BottomNav + Outlet
│           ├── pages/                  # Top-level pages
│           │   ├── DashboardPage.tsx   # Trang chủ — aggregate view
│           │   ├── SplashPage.tsx      # Splash screen
│           │   └── OnboardingPage.tsx  # Tạo/tham gia gia đình sau login
│           ├── modules/
│           │   ├── auth/
│           │   │   ├── api/authApi.ts
│           │   │   ├── store/authStore.ts   # Zustand store
│           │   │   ├── pages/
│           │   │   │   ├── LoginPage.tsx
│           │   │   │   ├── RegisterPage.tsx
│           │   │   │   ├── ProfilePage.tsx
│           │   │   │   └── ChangePasswordPage.tsx
│           │   │   └── schemas.ts
│           │   ├── family/
│           │   │   ├── api/familyApi.ts
│           │   │   └── pages/FamilyPage.tsx
│           │   ├── fridge/
│           │   │   ├── api/fridgeApi.ts
│           │   │   ├── store/fridgeStore.ts
│           │   │   ├── schema.ts
│           │   │   └── pages/
│           │   │       ├── FridgePage.tsx
│           │   │       └── FridgeFormPage.tsx
│           │   ├── shopping/
│           │   │   ├── api/shoppingApi.ts
│           │   │   ├── store/shoppingStore.ts
│           │   │   └── pages/
│           │   │       ├── ShoppingPage.tsx
│           │   │       ├── ShoppingCreatePage.tsx
│           │   │       └── ShoppingDetailPage.tsx
│           │   ├── recipe/
│           │   │   ├── api/recipeApi.ts
│           │   │   ├── store/
│           │   │   └── pages/
│           │   │       ├── RecipeListPage.tsx
│           │   │       ├── RecipeDetailPage.tsx
│           │   │       ├── RecipeFormPage.tsx
│           │   │       ├── RecipeFavoritesPage.tsx
│           │   │       ├── RecipePublicPage.tsx
│           │   │       └── RecipeSuggestionsPage.tsx
│           │   ├── meal-plan/
│           │   │   ├── api/mealApi.ts
│           │   │   ├── store/
│           │   │   ├── components/
│           │   │   │   ├── MealPlanCalendar.tsx
│           │   │   │   ├── MealPlanDayCell.tsx
│           │   │   │   ├── MealDetailPopup.tsx
│           │   │   │   ├── MealScheduleTable.tsx
│           │   │   │   └── RecipePicker.tsx
│           │   │   └── pages/MealPlanPage.tsx
│           │   └── statistics/
│           │       ├── api/
│           │       └── pages/StatisticsPage.tsx
│           ├── shared/
│           │   ├── api/
│           │   │   ├── apiClient.ts        # Axios instance với JWT interceptor
│           │   │   └── foodApi.ts          # Food catalog API
│           │   ├── components/
│           │   │   ├── AppModal.tsx
│           │   │   ├── BottomNav.tsx
│           │   │   ├── FlowSteps.tsx
│           │   │   ├── NotificationDropdown.tsx
│           │   │   ├── PageActions.tsx
│           │   │   └── ScreenHeader.tsx
│           │   ├── constants/
│           │   │   ├── endpoints.ts        # API endpoint strings
│           │   │   └── options.ts
│           │   ├── hooks/
│           │   │   └── use-mobile.tsx
│           │   ├── lib/
│           │   │   ├── mockDb.ts           # In-memory mock database (localStorage)
│           │   │   ├── i18n.ts             # Bản dịch VI/EN
│           │   │   └── supabaseClient.ts
│           │   ├── store/
│           │   │   └── languageStore.ts    # Zustand language state
│           │   └── utils/
│           ├── types/
│           │   ├── index.ts                # Re-export
│           │   └── database.ts             # All TypeScript type definitions
│           ├── components/
│           │   └── ui/                     # shadcn/ui components
│           ├── controllers/                # Legacy JS controllers
│           ├── models/                     # Legacy JS models
│           ├── services/                   # Legacy JS services
│           ├── assets/                     # Images (hero-dish.jpg, meal-*.jpg, ...)
│           ├── lib/                        # Legacy lib
│           └── views/                      # Legacy views (JS)
│               ├── DashboardPage.js
│               ├── LandingPage.js
│               └── LoginPage.js
│
├── database/
│   ├── sql_server_scripts/
│   │   └── 01_init_schema.sql          # (Rỗng — chưa implement)
│   └── supabase/
│       └── README.md                   # Hướng dẫn setup Supabase
│
├── deploy/
│   └── docker/
│       └── docker-compose.yml          # Docker Compose config
│
└── docs/
    ├── README.md
    ├── api-spec.md                     # REST API Specification
    ├── database-schema.md              # Database Schema Design
    ├── NATEAT_Design_Spec.md           # Landing Page Design Spec
    ├── topic.md                        # Project topic overview
    ├── srs/                            # Software Requirements Specification
    └── uc/                             # Use Case diagrams
```

---

## 3. Danh sách file quan trọng

### Backend

---

#### `/backend/server.js`
**Vai trò:** Entry point Express application. Đăng ký tất cả routes, global error handler, graceful shutdown.

**Route mapping:**
```
/auth, /api/auth     → authRoutes
/api/family          → familyRoutes
/api/fridge          → fridgeRoutes
/api/recipes         → recipeRoutes
/api/shopping-lists  → shoppingRoutes
/api/foods           → foodRoutes
/api/meal-plans      → mealPlanRoutes
/shopping-lists      → shoppingRoutes  (backward-compat alias)
/foods               → foodRoutes      (backward-compat alias)
/meal-plans          → mealPlanRoutes  (backward-compat alias)
/api/users           → inline handler (lấy danh sách users, dev only)
/health              → inline handler
/health/db           → inline handler
```

**Phụ thuộc:** `express`, `cors`, `dotenv`, `./src/config/db`, tất cả routes

**Mức độ quan trọng:** 🔴 Critical

---

#### `/backend/src/config/db.js`
**Vai trò:** Tạo PostgreSQL connection pool (pg). Export `pool`, `query`, `testConnection`, `closePool`.

**Config:** Đọc từ `DATABASE_URL`, `DB_POOL_MAX` (default 10), `DB_SSL` (default true).

**Mức độ quan trọng:** 🔴 Critical

---

#### `/backend/src/middleware/auth.js`
**Vai trò:** `authRequired` middleware cho recipe, shopping, food, meal-plan routes. Hỗ trợ cả mock-token (dev) và real JWT.

**Logic đặc biệt:** Tự động lookup `family_id` từ database nếu không có trong JWT payload. Sử dụng in-memory cache.

**Phụ thuộc:** `jsonwebtoken`, `shoppingBridge.js`, `ShoppingModel`, `FridgeItemModel`

**Mức độ quan trọng:** 🔴 Critical

---

#### `/backend/src/middlewares/authMiddleware.js`
**Vai trò:** Middleware đơn giản hơn, chỉ dùng cho `authRoutes`. Verify JWT và gắn `req.user`.

**Mức độ quan trọng:** 🔴 Critical

---

#### `/backend/src/services/authService.js`
**Vai trò:** Business logic register/login/logout/refresh. Quản lý `refresh_tokens` table. Export `authService` và `authTokenService`.

**Phụ thuộc:** `bcryptjs`, `jsonwebtoken`, `authSchema`, `db`

**Mức độ quan trọng:** 🔴 Critical

---

#### `/backend/src/models/FamilyModel.js`
**Vai trò:** Tất cả SQL queries cho `family_groups`, `group_members`, `family_invitations`. Bao gồm `ensureSchema()` để tự động migrate DB.

**Phụ thuộc:** `familySchema`, `db`

**Mức độ quan trọng:** 🔴 Critical

---

#### `/backend/src/models/ShoppingModel.js`
**Vai trò:** SQL queries cho `shopping_lists`, `shopping_list_items`. Có phương thức `insertNotification` để ghi notifications.

**Phụ thuộc:** `db`, `FridgeItemModel`

**Mức độ quan trọng:** 🔴 Critical

---

#### `/backend/src/models/FridgeItemModel.js`
**Vai trò:** SQL queries cho `fridge_items`. Có `resolveGiaDinhId()` để resolve family ID.

**Phụ thuộc:** `fridgeSchema`, `db`

**Mức độ quan trọng:** 🔴 Critical

---

#### `/backend/src/utils/shoppingBridge.js`
**Vai trò:** Bridge layer giải quyết ID mismatch giữa mock frontend và real database. Tự động tạo group/user nếu chưa có.

**Mức độ quan trọng:** 🟠 High

---

### Frontend

---

#### `/frontend/frontend-user/src/app/router/AppRouter.tsx`
**Vai trò:** Định nghĩa toàn bộ routing React Router v6. Có `ProtectedRoute` component kiểm tra auth + family.

**Logic routing:**
- `/` → SplashPage
- `/login`, `/register` → public
- Tất cả routes khác → ProtectedRoute → cần `user` + `family` trong authStore
- Nếu `user` nhưng không có `family` → redirect `/onboarding`

**Mức độ quan trọng:** 🔴 Critical

---

#### `/frontend/frontend-user/src/modules/auth/store/authStore.ts`
**Vai trò:** Zustand store toàn cục cho auth state. Quản lý `user`, `family`, `loading`, `error`.

**Actions:** `bootstrap`, `login`, `register`, `logout`, `refreshFamily`, `updateProfile`, `changePassword`

**⚠️ Lưu ý:** `updateProfile` và `changePassword` hiện **throw Error** — chưa kết nối backend.

**Mức độ quan trọng:** 🔴 Critical

---

#### `/frontend/frontend-user/src/modules/auth/api/authApi.ts`
**Vai trò:** Tất cả HTTP calls cho auth. Lưu token vào localStorage với key `nateat.token` và `nateat.refreshToken`.

**⚠️ Lưu ý:** `updateProfile` và `changePassword` **chưa implement** — throw Error với message "chua duoc ket noi backend".

**Mức độ quan trọng:** 🔴 Critical

---

#### `/frontend/frontend-user/src/shared/api/apiClient.ts`
**Vai trò:** Axios instance với base URL `VITE_API_BASE_URL || http://localhost:3000/api`. Tự động thêm Bearer token từ localStorage key `nateat.token`.

**Export:** `apiClient`, `unwrapApiData<T>`

**Mức độ quan trọng:** 🔴 Critical

---

#### `/frontend/frontend-user/src/layouts/MainLayout.tsx`
**Vai trò:** Shell layout. Chứa header (NATEAT brand, nav links, NotificationDropdown, profile button, logout), main content area (Outlet), BottomNav.

**Nav items:** Dashboard, Tủ lạnh, Danh sách mua sắm, Kế hoạch bữa ăn, Công thức, Thống kê, Gia đình, Hồ sơ

**Mức độ quan trọng:** 🔴 Critical

---

#### `/frontend/frontend-user/src/types/database.ts`
**Vai trò:** Tất cả TypeScript type/interface definitions. Source of truth cho data shapes.

**Types:** `User`, `Food`, `Recipe`, `RecipeIngredient`, `Family`, `FamilyMember`, `ShoppingList`, `ShoppingListItem`, `FridgeItem`, `MealPlan`, `MealPlanGroup`, `FamilyActivity`, `AuthSession`, `RecipeSuggestion`

**Mức độ quan trọng:** 🔴 Critical

---

#### `/frontend/frontend-user/src/shared/lib/mockDb.ts`
**Vai trò:** In-memory mock database (localStorage key `nateat.db.v2`). Seed data cho development. Vẫn được dùng bởi `apiClient.ts` để lấy session token.

**⚠️ Lưu ý:** Không phải toàn bộ features đã switch sang real API. `getSession()` và `setSession()` vẫn được dùng.

**Mức độ quan trọng:** 🟠 High

---

#### `/frontend/frontend-user/src/shared/constants/endpoints.ts`
**Vai trò:** Centralized API endpoint strings.

**⚠️ Không nhất quán:** `endpoints.fridge = '/fridge-items'` nhưng backend serve tại `/api/fridge/items`. Một số module dùng `apiClient` với `endpoints`, một số dùng `fetch` trực tiếp với hardcoded paths.

**Mức độ quan trọng:** 🟠 High

---

## 4. Component Map

### Pages (Route-level)

| Route | Component | File |
|---|---|---|
| `/` | SplashPage | `src/pages/SplashPage.tsx` |
| `/login` | LoginPage | `src/modules/auth/pages/LoginPage.tsx` |
| `/register` | RegisterPage | `src/modules/auth/pages/RegisterPage.tsx` |
| `/onboarding` | OnboardingPage | `src/pages/OnboardingPage.tsx` |
| `/dashboard` | DashboardPage | `src/pages/DashboardPage.tsx` |
| `/fridge` | FridgePage | `src/modules/fridge/pages/FridgePage.tsx` |
| `/fridge/add` | FridgeFormPage (add) | `src/modules/fridge/pages/FridgeFormPage.tsx` |
| `/fridge/:id` | FridgeFormPage (edit) | `src/modules/fridge/pages/FridgeFormPage.tsx` |
| `/shopping` | ShoppingPage | `src/modules/shopping/pages/ShoppingPage.tsx` |
| `/shopping/create` | ShoppingCreatePage | `src/modules/shopping/pages/ShoppingCreatePage.tsx` |
| `/shopping/:id` | ShoppingDetailPage | `src/modules/shopping/pages/ShoppingDetailPage.tsx` |
| `/meal-planner` | MealPlanPage | `src/modules/meal-plan/pages/MealPlanPage.tsx` |
| `/recipes` | RecipeListPage | `src/modules/recipe/pages/RecipeListPage.tsx` |
| `/recipes/explore` | RecipePublicPage | `src/modules/recipe/pages/RecipePublicPage.tsx` |
| `/recipes/suggestions` | RecipeSuggestionsPage | `src/modules/recipe/pages/RecipeSuggestionsPage.tsx` |
| `/recipes/add` | RecipeFormPage | `src/modules/recipe/pages/RecipeFormPage.tsx` |
| `/recipes/edit/:id` | RecipeFormPage | `src/modules/recipe/pages/RecipeFormPage.tsx` |
| `/recipes/:id` | RecipeDetailPage | `src/modules/recipe/pages/RecipeDetailPage.tsx` |
| `/favorites` | RecipeFavoritesPage | `src/modules/recipe/pages/RecipeFavoritesPage.tsx` |
| `/statistics` | StatisticsPage | `src/modules/statistics/pages/StatisticsPage.tsx` |
| `/family` | FamilyPage | `src/modules/family/pages/FamilyPage.tsx` |
| `/profile` | ProfilePage | `src/modules/auth/pages/ProfilePage.tsx` |
| `/change-password` | ChangePasswordPage | `src/modules/auth/pages/ChangePasswordPage.tsx` |

### Redirect routes
- `/meal-plan`, `/meal-plan/create`, `/meal-plan/calendar` → `/meal-planner`
- `/meal-planner/create`, `/meal-planner/calendar` → `/meal-planner`
- `/suggestions` → `/recipes/suggestions`
- `/settings` → `/profile`
- `*` → `/dashboard`

### Layout Components

```
AppRouter
  └── SplashPage, LoginPage, RegisterPage (public)
  └── ProtectedRoute (private)
      ├── OnboardingPage (no layout)
      └── MainLayout
          ├── Header
          │   ├── NotificationDropdown
          │   ├── AppModal (logout confirm)
          │   └── NavLink (nav items)
          ├── main > Outlet (page content)
          └── BottomNav
```

### Shared Components

| Component | File | Mô tả |
|---|---|---|
| AppModal | `shared/components/AppModal.tsx` | Generic modal (info/confirm) |
| BottomNav | `shared/components/BottomNav.tsx` | Mobile bottom navigation |
| NotificationDropdown | `shared/components/NotificationDropdown.tsx` | Notification bell dropdown |
| ScreenHeader | `shared/components/ScreenHeader.tsx` | In-page section header |
| PageActions | `shared/components/PageActions.tsx` | Action buttons container |
| FlowSteps | `shared/components/FlowSteps.tsx` | Step indicator |

### Meal Plan Components (sub-components)

| Component | File |
|---|---|
| MealPlanCalendar | `modules/meal-plan/components/MealPlanCalendar.tsx` |
| MealPlanDayCell | `modules/meal-plan/components/MealPlanDayCell.tsx` |
| MealDetailPopup | `modules/meal-plan/components/MealDetailPopup.tsx` |
| MealScheduleTable | `modules/meal-plan/components/MealScheduleTable.tsx` |
| RecipePicker | `modules/meal-plan/components/RecipePicker.tsx` |

### Zustand Stores

| Store | File | State |
|---|---|---|
| `useAuthStore` | `modules/auth/store/authStore.ts` | `user`, `family`, `loading`, `error` |
| `useFridgeStore` | `modules/fridge/store/fridgeStore.ts` | Fridge UI state |
| `useShoppingStore` | `modules/shopping/store/shoppingStore.ts` | Shopping list state |
| `useLanguageStore` | `shared/store/languageStore.ts` | `lang` ('vi'/'en') |

---

## 5. API Map

> Base URL: `http://localhost:3000`

### Auth (`/auth` và `/api/auth`)

| Method | Endpoint | Request Body | Response | Sử dụng bởi |
|---|---|---|---|---|
| POST | `/auth/register` | `{full_name, email, password}` | `{message, user}` | RegisterPage, authApi.register |
| POST | `/auth/login` | `{email, password}` | `{message, accessToken, refreshToken, user}` | LoginPage, authApi.login |
| POST | `/auth/refresh` | `{refreshToken}` | `{accessToken}` | authApi |
| GET | `/auth/me` | Header: Bearer | `{user}` | authApi.current |
| POST | `/auth/logout` | `{refreshToken}` | `{message}` | authApi.logout |

### Family (`/api/family`)

| Method | Endpoint | Request | Response | Sử dụng bởi |
|---|---|---|---|---|
| GET | `/api/family/me` | Bearer | `{family}` | familyApi.me, authStore.bootstrap |
| POST | `/api/family` | `{name}` | `{family}` | familyApi.createFamily, OnboardingPage |
| POST | `/api/family/join` | `{code}` | `{family}` | familyApi.joinFamilyById, OnboardingPage |
| PATCH | `/api/family/me` | `{name}` | `{family}` | familyApi.rename, FamilyPage |
| GET | `/api/family/members` | Bearer | `User[]` | familyApi.members, DashboardPage |
| POST | `/api/family/members` | `{email}` hoặc `{user_id}` | `SentFamilyInvitation` | familyApi.addMember, FamilyPage |
| DELETE | `/api/family/members/:id` | Bearer | — | familyApi.removeMember, FamilyPage |
| DELETE | `/api/family/leave` | Bearer | — | familyApi.leaveFamily, FamilyPage |
| PATCH | `/api/family/admin/transfer` | `{targetUserId}` | — | familyApi.transferAdmin, FamilyPage |
| GET | `/api/family/invitations/sent` | Bearer | `SentFamilyInvitation[]` | familyApi.sentInvitations, FamilyPage |
| GET | `/api/family/invitations/received` | Bearer | `ReceivedFamilyInvitation[]` | familyApi.receivedInvitations, FamilyPage |
| POST | `/api/family/invitations/:id/accept` | Bearer | `{family}` | familyApi.acceptInvitation, FamilyPage |
| POST | `/api/family/invitations/:id/reject` | Bearer | — | familyApi.rejectInvitation, FamilyPage |

### Fridge (`/api/fridge`)

| Method | Endpoint | Request | Response | Sử dụng bởi |
|---|---|---|---|---|
| GET | `/api/fridge/items` | Bearer | `FridgeRow[]` | fridgeApi.list, FridgePage, DashboardPage |
| POST | `/api/fridge/items` | Bearer + body | `FridgeRow` | fridgeApi.add, FridgeFormPage |
| PUT | `/api/fridge/items/:id` | Bearer + body | `FridgeRow` | fridgeApi.update, FridgeFormPage |
| PATCH | `/api/fridge/items/:id/quantity` | `{quantity}` | `FridgeRow` | fridgeApi.updateQuantity |
| DELETE | `/api/fridge/items/:id` | Bearer | — | fridgeApi.remove, FridgePage |
| DELETE | `/api/fridge/items/bulk` | `{ids[]}` | — | fridgeApi.bulkDelete |
| GET | `/api/fridge/items/expiring` | Bearer | `FridgeRow[]` | fridgeApi.expiring |
| GET | `/api/fridge/items/available-ingredients` | Bearer | — | — |
| GET | `/api/fridge/storage-suggestion` | Bearer | — | — |
| GET | `/api/fridge/items/export` | Bearer | CSV | — |

### Shopping Lists (`/api/shopping-lists`)

| Method | Endpoint | Request | Response | Sử dụng bởi |
|---|---|---|---|---|
| GET | `/api/shopping-lists` | Bearer | `ShoppingListDetail[]` | shoppingApi.list, ShoppingPage, DashboardPage |
| POST | `/api/shopping-lists` | Bearer + body | `{id}` | shoppingApi.create, ShoppingCreatePage |
| GET | `/api/shopping-lists/:listId` | Bearer | `ShoppingListDetail` | shoppingApi.detail, ShoppingDetailPage |
| DELETE | `/api/shopping-lists/:listId` | Bearer | — | shoppingApi.delete |
| POST | `/api/shopping-lists/:listId/items` | Bearer + body | `{id}` | shoppingApi.addItem |
| DELETE | `/api/shopping-lists/:listId/items` | `{ids[]}` | — | shoppingApi.deleteItems |
| PATCH | `/api/shopping-lists/:listId/items/:itemId/purchased` | `{boughtQuantity}` | — | shoppingApi.recordPurchase, ShoppingDetailPage |
| PATCH | `/api/shopping-lists/:listId/complete` | Bearer | — | shoppingApi.complete |

### Recipes (`/api/recipes`)

| Method | Endpoint | Request | Response | Sử dụng bởi |
|---|---|---|---|---|
| GET | `/api/recipes/public` | — | `Recipe[]` | recipeApi.listPublic, RecipePublicPage |
| GET | `/api/recipes/public/:id` | — | `RecipeDetail` | recipeApi.detailPublic |
| GET | `/api/recipes` | Bearer | `RecipeDetail[]` | recipeApi.list, RecipeListPage, DashboardPage |
| POST | `/api/recipes` | Bearer + body | `RecipeDetail` | recipeApi.create, RecipeFormPage |
| GET | `/api/recipes/:id` | Bearer | `RecipeDetail` | recipeApi.detail, RecipeDetailPage |
| PUT | `/api/recipes/:id` | Bearer + body | `RecipeDetail` | recipeApi.update, RecipeFormPage |
| DELETE | `/api/recipes/:id` | Bearer | — | recipeApi.remove |
| POST | `/api/recipes/:id/favorite` | Bearer | — | recipeApi.addFavorite |
| DELETE | `/api/recipes/:id/favorite` | Bearer | — | recipeApi.removeFavorite |
| GET | `/api/recipes/favorites` | Bearer | `RecipeDetail[]` | recipeApi.favorites, RecipeFavoritesPage |
| GET | `/api/recipes/suggest/from-fridge` | Bearer | `RecipeSuggestion[]` | recipeApi.suggestions, RecipeSuggestionsPage, DashboardPage |
| GET | `/api/recipes/:id/missing-ingredients` | Bearer | — | recipeApi.missingIngredients, RecipeDetailPage |
| POST | `/api/recipes/:id/mark-cooked` | Bearer | — | recipeApi.markCooked |
| POST | `/api/recipes/:id/shopping-list` | Bearer | — | recipeApi.createShoppingList, RecipeDetailPage |

### Meal Plans (`/api/meal-plans`)

| Method | Endpoint | Request | Response | Sử dụng bởi |
|---|---|---|---|---|
| GET | `/api/meal-plans` | Bearer | `MealPlan[]` | mealApi, MealPlanPage, DashboardPage |
| POST | `/api/meal-plans` | Bearer + `{meal_date, meal_type, recipe_id}` | `MealPlan` | mealApi.add, MealPlanPage |
| DELETE | `/api/meal-plans` | Bearer + `{meal_date, meal_type, recipe_id}` | — | mealApi.remove, MealPlanPage |
| PATCH | `/api/meal-plans/replace` | Bearer + body | `MealPlan` | mealApi.replace |

### Foods (`/api/foods`)

| Method | Endpoint | Request | Response | Sử dụng bởi |
|---|---|---|---|---|
| GET | `/api/foods` | Bearer | `Food[]` | foodApi.list, ShoppingCreatePage, FridgeFormPage |

### Health

| Method | Endpoint | Response | Sử dụng bởi |
|---|---|---|---|
| GET | `/health` | `{status, database}` | — |
| GET | `/health/db` | `{serverTime}` | — |
| GET | `/api/users` | `User[]` | Dev only |

---

## 6. Database Map

> Database: **Supabase PostgreSQL** (hosted, region: ap-southeast-2)
> ORM: **Không có** — raw SQL với `pg` (node-postgres)
> Naming convention: snake_case

### Tables (Active — đang dùng)

#### `users`
| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PK |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| full_name | VARCHAR(255) | NOT NULL |
| phone | VARCHAR(20) | NULL |
| role | VARCHAR | DEFAULT 'user' |
| is_locked | BOOLEAN | DEFAULT FALSE |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | |

#### `refresh_tokens`
| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PK |
| user_id | INT | FK → users.id |
| token | TEXT | UNIQUE |
| expires_at | TIMESTAMP | NOT NULL |
| revoked | BOOLEAN | DEFAULT FALSE |
| created_at | TIMESTAMP | DEFAULT NOW() |

#### `family_groups`
| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PK |
| name | VARCHAR(255) | NOT NULL |
| code | VARCHAR(20) | UNIQUE (added by ensureSchema) |
| created_by | INT | FK → users.id |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | |

#### `group_members`
| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PK |
| group_id | INT | FK → family_groups.id ON DELETE CASCADE |
| user_id | INT | FK → users.id ON DELETE CASCADE |
| role | VARCHAR(20) | DEFAULT 'member' (added by ensureSchema) |
| joined_at | TIMESTAMP | DEFAULT NOW() |

**UNIQUE:** `(group_id, user_id)`

#### `family_invitations`
| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PK |
| group_id | INT | FK → family_groups.id ON DELETE CASCADE |
| inviter_user_id | INT | FK → users.id ON DELETE CASCADE |
| invited_user_id | INT | FK → users.id ON DELETE CASCADE |
| status | VARCHAR(20) | DEFAULT 'pending' (values: pending/accepted/rejected) |
| created_at | TIMESTAMP | DEFAULT NOW() |
| responded_at | TIMESTAMP | NULL |

**UNIQUE:** `(group_id, invited_user_id, status)`

#### `fridge_items`
| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PK |
| user_id | INT | FK → users.id (thực ra là người tạo) |
| name | VARCHAR(255) | NOT NULL (redundant với food_name) |
| food_id | INT | FK → foods.id (nullable) |
| quantity | DECIMAL(10,2) | NOT NULL |
| unit_id | INT | FK → units.id |
| category_id | INT | FK → food_categories.id |
| expiration_date | DATE | NOT NULL |
| storage_location | VARCHAR | (values: 'Ngăn mát', 'Ngăn đông', 'Kệ thường') |
| added_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | |

> **Note:** Backend dùng `resolveGiaDinhId` để lookup `group_members` theo user_id.

#### `foods`
| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PK |
| food_name | VARCHAR(255) | NOT NULL |
| unit_id | INT | FK → units.id |
| category_id | INT | FK → food_categories.id |
| icon | VARCHAR(10) | DEFAULT '🧺' |

#### `food_categories`
| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PK |
| name_vi | VARCHAR(100) | NOT NULL |
| name_en | VARCHAR(100) | NOT NULL |

#### `units`
| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PK |
| name | VARCHAR(50) | NOT NULL |
| symbol | VARCHAR(10) | NOT NULL |

#### `shopping_lists`
| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PK |
| user_id | INT | FK → users.id |
| group_id | INT | FK → family_groups.id |
| list_type | VARCHAR | ('daily', 'weekly') |
| name | VARCHAR(255) | NOT NULL |
| plan_date | DATE | NULL |
| status | VARCHAR | DEFAULT 'active' (values: active/completed) |
| assigned_user_id | INT | FK → users.id (nullable) |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | |

#### `shopping_list_items`
| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PK |
| shopping_list_id | INT | FK → shopping_lists.id ON DELETE CASCADE |
| food_id | INT | FK → foods.id (nullable) |
| name | VARCHAR(255) | NOT NULL |
| quantity | DECIMAL(10,2) | NOT NULL |
| unit_id | INT | FK → units.id (nullable) |
| category_id | INT | FK → food_categories.id (nullable) |
| is_purchased | BOOLEAN | DEFAULT FALSE |
| bought_status | BOOLEAN | DEFAULT FALSE |
| purchased_by | INT | FK → users.id (nullable) |
| purchased_at | TIMESTAMP | NULL |
| bought_quantity | DECIMAL(10,2) | DEFAULT 0 |
| remaining_quantity | DECIMAL(10,2) | |
| item_status | VARCHAR | ('PENDING', 'PARTIAL', 'COMPLETED') |
| inventory_synced_quantity | DECIMAL(10,2) | DEFAULT 0 |
| created_at | TIMESTAMP | DEFAULT NOW() |

#### `recipes`
| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PK |
| recipe_name | VARCHAR(255) | NOT NULL |
| description | TEXT | NULL |
| instructions | JSONB hoặc TEXT | |
| image_url | TEXT | NULL |
| time_minutes | INT | NULL |
| calories | INT | NULL |
| difficulty | VARCHAR(50) | NULL |
| servings | INT | DEFAULT 4 |
| created_by | INT | FK → users.id (nullable) |
| is_public | BOOLEAN | DEFAULT TRUE |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | |

#### `recipe_ingredients`
| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PK |
| recipe_id | INT | FK → recipes.id ON DELETE CASCADE |
| food_id | INT | FK → foods.id (nullable) |
| name | VARCHAR(255) | NOT NULL |
| quantity | DECIMAL(10,2) | NOT NULL |
| unit_id | INT | FK → units.id |

#### `favorite_recipes`
| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PK |
| user_id | INT | FK → users.id ON DELETE CASCADE |
| recipe_id | INT | FK → recipes.id ON DELETE CASCADE |
| created_at | TIMESTAMP | DEFAULT NOW() |

**UNIQUE:** `(user_id, recipe_id)`

#### `meal_plans`
| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PK |
| user_id | INT | FK → users.id |
| group_id | INT | FK → family_groups.id |
| meal_date | DATE | NOT NULL |
| meal_type | VARCHAR | ('Sáng', 'Trưa', 'Tối', 'Bữa phụ') |
| recipe_id | INT | FK → recipes.id |
| created_at | TIMESTAMP | DEFAULT NOW() |

#### `notifications`
| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PK |
| user_id | INT | FK → users.id ON DELETE CASCADE |
| type | VARCHAR | ('expiration', 'meal_reminder', 'shopping_update', 'system') |
| title | VARCHAR(255) | NOT NULL |
| message | TEXT | NOT NULL |
| is_read | BOOLEAN | DEFAULT FALSE |
| related_id | INT | NULL |
| created_at | TIMESTAMP | DEFAULT NOW() |

### Relationships
```
users (1) ──── (N) group_members
users (1) ──── (N) refresh_tokens
users (1) ──── (N) fridge_items
users (1) ──── (N) shopping_lists
users (1) ──── (N) meal_plans
users (1) ──── (N) notifications
users (1) ──── (N) favorite_recipes

family_groups (1) ──── (N) group_members
family_groups (1) ──── (N) shopping_lists
family_groups (1) ──── (N) meal_plans
family_groups (1) ──── (N) family_invitations

shopping_lists (1) ──── (N) shopping_list_items

recipes (1) ──── (N) recipe_ingredients
recipes (1) ──── (N) meal_plans
recipes (1) ──── (N) favorite_recipes

foods (1) ──── (N) shopping_list_items
foods (1) ──── (N) recipe_ingredients
foods (1) ──── (N) fridge_items

food_categories (1) ──── (N) foods
food_categories (1) ──── (N) shopping_list_items

units (1) ──── (N) foods
units (1) ──── (N) shopping_list_items
units (1) ──── (N) recipe_ingredients
units (1) ──── (N) fridge_items
```

---

## 7. Business Flow

### User Flow

#### 7.1 Đăng ký (Register)
1. User điền `full_name`, `email`, `password` tại `/register`
2. `authApi.register()` POST `/auth/register`
3. Backend: kiểm tra email đã tồn tại → hash password bcrypt → INSERT users
4. Response: `{message, user}` (không có token)
5. FE redirect sang `/login`

#### 7.2 Đăng nhập (Login)
1. User điền email, password tại `/login`
2. `authApi.login()` POST `/auth/login`
3. Backend: lookup user → verify password → tạo accessToken (15m) + refreshToken (7d) → lưu refreshToken vào DB
4. FE lưu token vào localStorage (`nateat.token`, `nateat.refreshToken`)
5. `familyApi.me()` được gọi để lấy family info
6. Nếu user chưa có family → redirect `/onboarding`
7. Nếu có family → redirect `/dashboard`

#### 7.3 Onboarding (Tạo/Tham gia gia đình)
1. Sau login, nếu không có family trong authStore → ProtectedRoute redirect `/onboarding`
2. User chọn "Tạo gia đình mới" hoặc "Tham gia gia đình"
3. Tạo: POST `/api/family` với `{name}` → tự generate `code = FAM-XXXX`
4. Tham gia: POST `/api/family/join` với `{code}`
5. `authStore.refreshFamily()` gọi lại `familyApi.me()`
6. Redirect `/dashboard`

#### 7.4 Quản lý tủ lạnh (Fridge)
1. `FridgePage` hiển thị danh sách fridge items qua `fridgeApi.list(family_id)`
2. Filter theo category/location/keyword
3. Cảnh báo item sắp hết hạn (trong vòng 4 ngày)
4. User thêm item qua `FridgeFormPage (mode=add)` → POST `/api/fridge/items`
5. Sửa: `FridgeFormPage (mode=edit)` → PUT `/api/fridge/items/:id`
6. Xóa: DELETE `/api/fridge/items/:id`

#### 7.5 Tạo danh sách mua sắm (Shopping)
1. `ShoppingPage` hiển thị tất cả shopping lists
2. Tạo mới: `ShoppingCreatePage` → POST `/api/shopping-lists`
3. Thêm items từ food catalog hoặc nhập thủ công
4. `ShoppingDetailPage`: đánh dấu từng item đã mua
   - PATCH `/api/shopping-lists/:id/items/:itemId/purchased`
   - Khi đánh dấu purchased → backend tự động sync vào fridge (gọi `FridgeItemModel.create`)
5. Hoàn tất list: PATCH `/api/shopping-lists/:id/complete`

#### 7.6 Lên kế hoạch bữa ăn (Meal Plan)
1. `MealPlanPage` hiển thị calendar tuần hiện tại
2. Click vào ô ngày/bữa → mở `RecipePicker`
3. Chọn recipe → POST `/api/meal-plans` với `{meal_date, meal_type, recipe_id}`
4. Xóa: DELETE `/api/meal-plans` với cùng payload
5. `MealDetailPopup` hiển thị chi tiết recipe khi click vào meal

#### 7.7 Quản lý công thức (Recipe)
1. `RecipeListPage`: danh sách recipes của gia đình
2. `RecipePublicPage`: recipes công khai (không cần auth)
3. Tạo recipe: `RecipeFormPage` → POST `/api/recipes`
4. `RecipeSuggestionsPage`: gợi ý recipes từ fridge qua GET `/api/recipes/suggest/from-fridge`
5. `RecipeDetailPage`: xem chi tiết, thêm vào meal plan, tạo shopping list từ ingredients

#### 7.8 Mời thành viên gia đình (Family Invitation)
1. Admin vào `FamilyPage` → nhập email → POST `/api/family/members`
2. Backend tạo `family_invitation` với status='pending'
3. Người được mời: nhận invitation trong `FamilyPage`
4. Người được mời: POST `/api/family/invitations/:id/accept` → join family
5. Hoặc POST `/api/family/invitations/:id/reject`

#### 7.9 Đăng xuất (Logout)
1. User click logout button → AppModal confirm
2. `authStore.logout()` → `authApi.logout()`
3. FE: POST `/auth/logout` với refreshToken → server revoke token
4. Xóa localStorage tokens → redirect `/login`

---

## 8. Dependency Map

### Backend Dependencies

| Package | Version | Mục đích |
|---|---|---|
| express | ^4.21.2 | HTTP framework |
| pg | ^8.13.1 | PostgreSQL client |
| bcryptjs | ^3.0.3 | Password hashing |
| jsonwebtoken | ^9.0.3 | JWT generation/verification |
| cors | ^2.8.5 | CORS middleware |
| dotenv | ^16.4.7 | Environment variables |
| nodemon | ^3.1.9 | Dev auto-reload (devDep) |

### Frontend Dependencies

| Package | Version | Mục đích |
|---|---|---|
| react | ^19.2.0 | UI framework |
| react-dom | ^19.2.0 | React DOM renderer |
| react-router-dom | ^6.30.1 | Client-side routing |
| zustand | ^5.0.13 | State management |
| axios | ^1.16.1 | HTTP client (apiClient.ts) |
| @tanstack/react-query | ^5.83.0 | Server state caching |
| zod | ^3.24.2 | Schema validation |
| react-hook-form | ^7.71.2 | Form management |
| @hookform/resolvers | ^5.2.2 | Zod + react-hook-form bridge |
| lucide-react | ^0.575.0 | Icon library |
| sonner | ^2.0.7 | Toast notifications |
| date-fns | ^4.1.0 | Date utilities |
| recharts | ^2.15.4 | Charts (StatisticsPage) |
| tailwindcss | ^4.2.1 | CSS utility framework |
| @radix-ui/* | various | Headless UI primitives |
| class-variance-authority | ^0.7.1 | Variant class management |
| clsx | ^2.1.1 | Conditional class names |
| tailwind-merge | ^3.5.0 | Merge Tailwind classes |
| @supabase/supabase-js | ^2.106.2 | Supabase client (ít dùng) |
| vite | ^7.3.1 | Build tool |
| typescript | ^5.8.3 | Type system |

---

## 9. SOURCE CODE PROTECTION RULES

> Các quy tắc bắt buộc cho mọi AI Agent tương tác với codebase này.

### ❌ KHÔNG ĐƯỢC

- ❌ Xóa code hiện có
- ❌ Refactor code hiện có
- ❌ Đổi tên biến, function, component hiện có
- ❌ Thay đổi API endpoint đã có
- ❌ Thay đổi database schema hiện có (không DROP COLUMN, không RENAME, không ALTER TYPE)
- ❌ Thay đổi routing hiện có trong `AppRouter.tsx`
- ❌ Thay đổi Zustand store structure hiện có
- ❌ Thay đổi business logic đang hoạt động
- ❌ Sửa đổi `mockDb.ts` seed data (ảnh hưởng đến dev environment)
- ❌ Xóa backward-compatible routes trong `server.js` (`/shopping-lists`, `/foods`, `/meal-plans`)
- ❌ Thay đổi token storage keys (`nateat.token`, `nateat.refreshToken`, `nateat.db.v2`)
- ❌ Thay đổi `authRequired` middleware signature

---

### ✅ CHỈ ĐƯỢC PHÉP

- ✅ Thêm file mới
- ✅ Thêm component mới
- ✅ Thêm API endpoint mới (không đụng endpoints cũ)
- ✅ Thêm module mới
- ✅ Thêm migration mới (chỉ ADD COLUMN, CREATE TABLE, không ALTER/DROP)
- ✅ Thêm logic mới vào controller mới
- ✅ Thêm routes mới vào `server.js`
- ✅ Thêm pages mới vào `AppRouter.tsx`
- ✅ Thêm fields mới vào TypeScript types (không xóa fields cũ)

---

### Khi thêm tính năng mới, AI phải:

1. **Phân tích code hiện tại** — đọc file liên quan trước khi viết bất kỳ dòng nào
2. **Tìm điểm mở rộng** — module nào đang gần nhất, pattern nào đang dùng
3. **Tạo file mới** — không sửa file cũ nếu có thể
4. **Follow pattern hiện có** — xem ví dụ trong `modules/fridge/` hoặc `modules/shopping/`
5. **Giải thích rõ ràng** — nếu buộc phải sửa code cũ, phải nêu lý do cụ thể

---

## 10. Current Development Status

### ✅ Đã hoàn thiện (hoạt động end-to-end)

| Module | Frontend | Backend |
|---|---|---|
| Authentication | ✅ Login, Register, Logout | ✅ JWT + refresh tokens |
| Family Management | ✅ Create, Join, Leave, Invite members | ✅ Full CRUD + invitations |
| Fridge Management | ✅ List, Add, Edit, Delete | ✅ CRUD + CSV export |
| Shopping Lists | ✅ Create, View detail, Mark purchased | ✅ CRUD + inventory sync |
| Recipe CRUD | ✅ List, Create, Edit, Delete | ✅ Full CRUD |
| Recipe Suggestions | ✅ From-fridge suggestions | ✅ Algorithm in backend |
| Meal Planning | ✅ Calendar view, Add/Remove meals | ✅ CRUD |
| Public Recipes | ✅ Browse without login | ✅ Public endpoint |
| Favorite Recipes | ✅ Add/Remove favorites | ✅ Backend |
| Family Invitations | ✅ Send, Accept, Reject | ✅ Full flow |
| Onboarding | ✅ Create/Join family flow | ✅ API backed |
| Notifications | ✅ NotificationDropdown component | ⚠️ Backend viết được nhưng FE chưa poll |

---

### ⚠️ Đang làm dở / Chưa hoàn thiện

| Feature | Trạng thái | Ghi chú |
|---|---|---|
| `authApi.updateProfile` | ❌ Not implemented | Throws "chua duoc ket noi backend" |
| `authApi.changePassword` | ❌ Not implemented | Throws "chua duoc ket noi backend" |
| `ProfilePage` | ⚠️ Partial | UI có nhưng save không hoạt động |
| `ChangePasswordPage` | ⚠️ Partial | UI có nhưng call API chưa hoạt động |
| Statistics | ⚠️ Partial | FE có page, không có backend API |
| Assign shopping task | ❌ Not implemented | `familyApi.assignShoppingTask` throws Error |
| Respond shopping task | ❌ Not implemented | `familyApi.respondShoppingTask` throws Error |
| `sql_server_scripts/01_init_schema.sql` | ❌ Empty | File rỗng (3 bytes) |
| Docker Compose | ⚠️ Exists | Chưa test |
| Mobile (React Native) | ❌ Not started | Planned future |
| Redis cache | ❌ Not implemented | Mentioned in README nhưng không có code |
| Firebase notifications | ❌ Not implemented | Mentioned in README nhưng không có code |
| `fix_fe.md` | ⚠️ TODO notes | Còn các ghi chú fix cần thực hiện |

---

### 🔍 TODO / FIXME trong code

- `authApi.ts:98` — `updateProfile` chưa có backend endpoint
- `authApi.ts:101` — `changePassword` chưa có backend endpoint
- `familyApi.ts:183` — `assignShoppingTask` chưa có API backend
- `familyApi.ts:186` — `respondShoppingTask` chưa có API backend
- `middleware/auth.js` — mockUserCache và jwtUserCache là in-memory, restart server sẽ mất cache
- `shoppingBridge.js` — groupIdCache là in-memory, restart server sẽ mất cache
- `familyRoutes.js` — Mock token support (`mock-token-` prefix) vẫn còn trong production code
- `server.js:73` — `/api/users` endpoint không có auth guard (dev only, cần xóa trước production)

---

## 11. AI Handover Summary

### Kiến trúc

Đây là monorepo với 3 thành phần chính:
1. **Backend** (`/backend`): Node.js + Express REST API, PostgreSQL (Supabase), không có ORM
2. **Frontend User** (`/frontend/frontend-user`): React 19 + Vite + TypeScript, Zustand state, React Router v6
3. **Database**: Supabase PostgreSQL (hosted), raw SQL, không có migration framework

### Pattern quan trọng

**Backend:**
- Mọi controller đọc `req.user` được inject bởi middleware
- `authRequired` (middleware/auth.js) dùng cho shopping/recipe/food/meal-plan
- `authenticateFamilyRequest` (familyRoutes.js) dùng riêng cho family
- Model layer là class/object thuần với raw SQL (không có ORM)
- `ensureSchema()` trong FamilyModel tự động ALTER TABLE nếu cần

**Frontend:**
- `useAuthStore` (Zustand) là source of truth cho `user` và `family`
- Mọi API call có 2 cách: dùng `apiClient` (Axios) hoặc `fetch` trực tiếp — chưa thống nhất
- `mockDb.ts` vẫn còn tồn tại nhưng phần lớn features đã dùng real API
- Token lưu ở `localStorage['nateat.token']` — được đọc bởi cả `apiClient.ts` và `familyApi.ts`
- `AppRouter` kiểm tra `user && family` — cần cả 2 mới vào được app

### Cách bổ sung tính năng mới

#### Thêm API endpoint mới (backend):
1. Tạo method trong model (`/backend/src/models/`)
2. Tạo handler trong controller (`/backend/src/controllers/`)
3. Đăng ký route trong routes file (`/backend/src/routes/`)
4. Mount route trong `server.js` (chỉ nếu cần path prefix mới)

#### Thêm page mới (frontend):
1. Tạo page component trong module tương ứng (`/frontend/frontend-user/src/modules/<module>/pages/`)
2. Tạo API function trong `<module>/api/<module>Api.ts`
3. Thêm route vào `AppRouter.tsx`
4. Thêm nav link vào `MainLayout.tsx` nếu cần

#### Thêm table mới (database):
1. Viết `CREATE TABLE IF NOT EXISTS` script
2. Test trên Supabase trước
3. Cập nhật schema mapping config nếu cần
4. KHÔNG thay đổi các table hiện có

### ⚠️ Những điều cần biết trước khi code

1. **2 middleware song song**: `src/middleware/auth.js` (authRequired) và `src/middlewares/authMiddleware.js` — không được merge hay xóa cái nào
2. **Mock token vẫn hoạt động**: Token dạng `mock-token-<id>` được chấp nhận trong development — không xóa logic này
3. **endpoints.ts không sync với backend**: `endpoints.fridge = '/fridge-items'` nhưng backend serve tại `/api/fridge/items` — cần cẩn thận khi dùng
4. **familyApi.ts dùng fetch không dùng apiClient**: Các API call trong `familyApi.ts` dùng `fetch()` trực tiếp với hardcoded `/api/family` prefix
5. **authApi.ts dùng fetch với BASE URL khác apiClient**: `authApi` dùng `http://localhost:3000` (không có `/api` suffix) còn `apiClient` dùng `http://localhost:3000/api`
6. **statisticsPage không có backend**: Dữ liệu thống kê đang được tổng hợp từ nhiều API gọi song song ở frontend

---

*File này được tạo lúc: 2026-06-10*
*Dựa trên source code snapshot tại: `c:\Users\KHANH\Documents\GitHub\Convenient-Grocery-Shopping-System`*
