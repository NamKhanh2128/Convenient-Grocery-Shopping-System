# Schema ↔ Admin Mapping (Phase 1)

Source of truth: `database/supabase/database-schema.md` (READ-ONLY). This document maps every
schema table to the admin frontend (`frontend/frontend-admin`) and admin backend
(`backend/src/{models,controllers,routes}/Admin*`) so that Phases 2-13 can be executed without
guesswork. "Status" reflects the state BEFORE this refactor.

---

## 1. users
- **Columns**: id, email, password_hash, full_name, phone, role, is_locked, failed_login_attempts, last_login, created_at, updated_at
- **FKs**: referenced by refresh_tokens.user_id, group_members.user_id, family_groups.created_by, family_invitations.*, shopping_lists.user_id/assigned_user_id, shopping_list_items.purchased_by, meal_plans.user_id, favorite_recipes.user_id, notifications.user_id
- **Admin Screens**: UserListPage, UserFormPage
- **Admin APIs**: `GET/POST /api/admin/users`, `GET/PUT/DELETE /api/admin/users/:id`, `POST /:id/toggle-lock`, `POST /:id/reset-password`, `POST /bulk-delete`
- **DTOs/Models**: `AdminUserModel._mapUser` (currently aliases `id`→`user_id`, `is_locked`→`locked`, drops `failed_login_attempts`/`last_login`/`updated_at`) — **NEEDS FIX (Phase 3)**
- **Forms**: UserFormPage (email, full_name, phone, role, password, `locked` ⇒ rename `is_locked`)
- **Types**: `User` in `database.ts` (currently `user_id`, `avatar_url`(absent but flagged), `locked`) — **NEEDS REWRITE (Phase 10)**
- **Services**: `adminUserApi.ts` — **NEEDS FIX**
- **Cross-cutting**: `authStore.ts` + `mockDb.ts` use a separate localStorage-based mock `User` shape (`user_id`, `password`, `locked`) for admin login session. Decision: keep this as an internal `MockUser` type local to `mockDb.ts`/`authStore.ts` (not exported from `database.ts`), and have `authStore` expose the schema-aligned `User` (id/is_locked) to the rest of the app. This avoids polluting the schema-true `User` type while preserving the existing (working, via `mock-token-` bypass in `authRequired`) login flow.

## 2. roles
- **Columns**: role_id, role_name
- **Admin usage**: none found. `users.role` is a free-text varchar (`USER`/`ADMIN`), not FK'd to `roles` in admin code. Out of scope — no admin screen references this table.

## 3. refresh_tokens
- **Admin usage**: none. Not surfaced in admin UI/API.

## 4. family_groups
- **Columns**: id, name, created_by, created_at, updated_at, code
- **Admin Screens**: FamilyListPage (list + members modal)
- **Admin APIs**: `GET /api/admin/families`, `GET /api/admin/families/:id/members`, `DELETE /api/admin/families/:id`
- **DTOs/Models**: `AdminFamilyModel.list/_mapFamily` aliases `id`→`family_id`, `name`→`family_name`. `AdminStatsModel.getFamilies` does the same aliasing for the dashboard modal.
- **Issue**: `AdminFamilyModel.delete()` issues `DELETE FROM family_activities WHERE family_id = $1` — **ghost table, will throw (Phase 2)**
- **Types**: `Family` (family_id/family_name/created_by) in database.ts, `FamilyWithMembers` in adminFamilyApi.ts
- **Decision**: family_groups is not in the explicit Phase 3-9 "allowed fields" list, but Phase 10/11 "no aliases" applies broadly. Will rename to `id`/`name` per schema while keeping the feature otherwise intact (Phase 10/11/12, done alongside Phase 2 cleanup since the delete() bug must be fixed anyway).

## 5. group_members
- **Columns**: id, group_id, user_id, joined_at, role
- **Admin Screens**: FamilyListPage members modal (via `AdminFamilyModel.getMembers`)
- **Status**: query is schema-correct (joins users for full_name/email). Minor: returned shape uses aliases for display — acceptable as a join projection, not a ghost field issue.

## 6. family_invitations
- **Admin usage**: none. No admin screen/API references this table. Out of scope.

## 7. food_categories
- **Columns**: id, name_vi, name_en, description
- **Admin usage**: joined into `AdminFoodModel` (foods.category display) and `AdminStatsModel.foodsByCategory`. No dedicated CRUD screen — out of explicit phase scope (not user/recipe/shopping/stats/mealplan/notification/danh_muc_cong_thuc). Left as-is except where it intersects recipe_ingredients.category_id (Phase 4/5).

## 8. units
- **Columns**: id, name, symbol
- **Admin usage**: joined for display in `AdminFoodModel`/`AdminRecipeModel`. recipe_ingredients.unit_id (Phase 4) requires a unit picker sourced from this table.

## 9. foods
- **Columns**: id, food_name, unit_id, category_id, icon, created_at
- **Admin Screens**: FoodListPage, FoodFormPage
- **Admin APIs**: `/api/admin/foods` CRUD
- **Status**: `AdminFoodModel` aliases `id`→`food_id`, joins category/unit names. Not in explicit Phase 3-9 list (no strict "allowed fields" given for `foods`). Left largely as-is for this refactor pass — flagged as a remaining-risk in Phase 13 report rather than rewritten, to keep scope bounded to the 13 named phases. constants/options.ts `foodCategories`/`foodUnits` (hardcoded Vietnamese enums) likewise flagged but not replaced.

## 10. fridge_items / 11. fridge_item_storage_locations
- **Admin usage**: none (no admin screen). `mockDb`/`notificationStore` reference fridge items for the admin's own notification bell (separate from the `notifications` table) — not a schema-table admin screen, out of phase scope.

## 12. shopping_lists
- **Columns**: id, user_id, group_id, list_type, name, plan_date, status, assigned_user_id, created_at, updated_at
- **Admin Screens**: **NONE EXIST** — build new (Phase 6)
- **Admin APIs**: **NONE EXIST** — build `AdminShoppingModel`/`AdminShoppingController`/`adminShoppingRoutes`
- **Types**: current `ShoppingList` in database.ts uses `shopping_list_id/family_id/title/created_by/list_type` — **rewrite (Phase 6/10)**
- **Frontend**: new `adminShoppingApi.ts`, `ShoppingListPage`/`ShoppingListDetailPage` (or similar), router + nav entries

## 13. shopping_list_items
- **Columns**: id, shopping_list_id, food_id, name, quantity, unit_id, category_id, is_purchased, purchased_by, purchased_at, bought_quantity, remaining_quantity, item_status, inventory_synced_quantity, bought_status, created_at
- **Admin Screens**: part of new Shopping Management (Phase 6) — view items inside a list detail view
- **Status**: `AdminSettingsController.exportData` queries this table with ghost columns (`food_id, quantity, is_checked` only — incomplete/wrong) — **fix in Phase 6/11**

## 14. recipes
- **Columns**: id, name_vi, name_en, description, instructions, prep_time, cook_time, servings, created_by, is_public, created_at, updated_at
- **Admin Screens**: RecipeListPage, RecipeFormPage
- **Admin APIs**: `/api/admin/recipes` CRUD
- **Status**: `AdminRecipeModel` aliases `id`→`recipe_id`, computes `recipe_name`=COALESCE(name_vi,name_en), collapses `prep_time+cook_time`→`time_minutes`. Controller accepts ghost fields `image_url`/`calories`/`difficulty`. **NEEDS FULL REWRITE (Phase 4)**

## 15. recipe_ingredients
- **Columns**: id, recipe_id, name, quantity, unit_id, category_id
- **Status**: SELECT queries already join `units` correctly, but INSERT (`create`/`update`) only sets `(recipe_id, name, quantity)` — **never sets unit_id/category_id, violates "unit_id always provided" (Phase 4)**
- **Frontend**: RecipeFormPage ingredient rows currently `{food_id, quantity}` (food_id is a ghost FK for this table) — **rewrite to `{name, quantity, unit_id, category_id}` (Phase 4)**

## 16. meal_plans / 17. meal_plan_items
- **Columns (meal_plans)**: id, user_id, plan_type, start_date, end_date, status, created_at, updated_at
- **Columns (meal_plan_items)**: id, meal_plan_id, recipe_id, meal_date, meal_type, is_cooked, created_at
- **Admin Screens**: **NONE EXIST** — build new (Phase 8)
- **Admin APIs**: **NONE EXIST** — build `AdminMealPlanModel`/`AdminMealPlanController`/`adminMealPlanRoutes` with `is_cooked` view/update/filter
- **Existing non-admin code**: `backend/src/models/MealPlanModel.js`, `MealPlanController.js`, `mealPlanRoutes.js`, `config/mealPlanSchema.js` exist for the end-user app — admin versions are net-new but can reuse query patterns/column names.
- **Status note**: `AdminStatsModel.mealsByDay()` already queries `meal_plan_items.meal_date` correctly (fixed in a prior commit). `AdminSettingsController.exportData` queries `meal_plans` with ghost columns (`family_group_id, recipe_id, meal_date, meal_type` — these belong to meal_plan_items, and meal_plans has no family_group_id) — **fix in Phase 8/11**

## 18. favorite_recipes
- **Admin usage**: none. Out of phase scope.

## 19. notifications
- **Columns**: id, user_id, type, title, message, is_read, related_id, created_at
- **Admin Screens**: **NONE EXIST** — build new (Phase 9)
- **Admin APIs**: **NONE EXIST** — build `AdminNotificationModel`/`AdminNotificationController`/`adminNotificationRoutes` (list/mark-as-read/delete)
- **Note**: Distinct from `useNotificationStore`/`AdminHeader` bell, which is an in-admin-app UI notification system backed by `mockDb` (fridge expirations etc.) — that is NOT the `notifications` table and is out of scope for Phase 9 (it's admin-tool chrome, not data managed via CRUD). Phase 9 is a new admin **data management** screen for the `notifications` table (viewing/moderating end-user notifications).

## 20. danh_muc_cong_thuc
- **Columns**: danh_muc_cong_thuc_id, ten_danh_muc, mo_ta, ngay_tao
- **Admin Screens**: **NONE EXIST** — build new (Phase 5): List/Create/Edit/Delete
- **Admin APIs**: **NONE EXIST** — build `AdminRecipeCategoryModel`/`AdminRecipeCategoryController`/`adminRecipeCategoryRoutes`
- **Relationship note**: The schema's relationship diagram does **not** define an FK from `recipes` or `recipe_ingredients` to `danh_muc_cong_thuc`. `recipe_ingredients.category_id` → `food_categories.id` (a different table). Therefore Phase 5 implements `danh_muc_cong_thuc` as a **standalone reference-table CRUD** (no FK wiring into recipes), matching what the schema actually defines. No new column/table will be added (per constraints).

---

## Ghost / Broken References Inventory (Phase 2 targets)

| File | Issue |
|---|---|
| `backend/src/models/AdminActivityModel.js` | Entirely built on ghost table `family_activities` — **DELETE** |
| `backend/src/controllers/AdminActivityController.js` | Wrapper around AdminActivityModel — **DELETE** |
| `backend/src/routes/adminActivityRoutes.js` | Routes for activities — **DELETE** |
| `frontend/.../api/adminActivityApi.ts` | Calls `/api/admin/activities` — **DELETE** |
| `frontend/.../pages/activities/ActivityLogPage.tsx` | Entire page — **DELETE** |
| `frontend/.../types/database.ts` → `FamilyActivity` | Ghost type — **DELETE** |
| `AdminRouter.tsx` | `/activities` route — **REMOVE** |
| `AdminHeader.tsx` | `/activities` nav item + `Activity` icon import — **REMOVE** |
| `AdminStatsModel.summary()` | `recentActivities` query joins `family_activities` — **REMOVE/REPLACE** |
| `adminStatsApi.ts` → `SummaryData.recentActivities` | Ghost-shaped type — **REMOVE** |
| `DashboardPage.tsx` | "Hoạt Động Mới Nhất" table renders `summary.recentActivities` — **REMOVE/REPLACE** |
| `AdminFamilyModel.delete()` | `DELETE FROM family_activities WHERE family_id = $1` — **REMOVE** |
| `AdminSettingsController.exportData()` | Queries `family_activities`, plus ghost columns on recipes/recipe_ingredients/shopping_lists/shopping_list_items/meal_plans — **REWRITE (Phase 11)** |
| `AdminSettingsController.resetDatabase()` | `TRUNCATE TABLE family_activities` — **REMOVE** |
| `adminStatsApi.ts` → `getShoppingLists()` stub (`return []`) | Dead code smell — **REMOVE**, superseded by real Shopping Management (Phase 6) |
| `constants/options.ts` → `difficultyOptions` | Ghost concept (`recipes` has no `difficulty`) — **REMOVE (Phase 4)** |

---

## Navigation Plan (Phase 12)

`AdminHeader.tsx navItems` after refactor:
- Dashboard, Users, Families, Foods, Recipes, Recipe Categories (new), Shopping (new), Meal Plans (new), Notifications (new), Statistics, Settings
- Remove: Activities

## New Routes Plan (Phase 12, `AdminRouter.tsx`)
- `/recipe-categories`, `/recipe-categories/new`, `/recipe-categories/:id`
- `/shopping-lists`, `/shopping-lists/:id`
- `/meal-plans`, `/meal-plans/:id`
- `/notifications`
- Remove `/activities`
