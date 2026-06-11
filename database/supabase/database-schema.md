# Database Schema Design

## Overview

PostgreSQL (Supabase) database schema for the Convenient Grocery Shopping System. Follows a relational model with proper foreign key constraints. Data types reflect the actual PostgreSQL column definitions.

## Tables

---

### 1. users
Stores user account information.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | integer | NO | Primary key, unique user identifier |
| email | character varying | NO | Login email (unique) |
| password_hash | character varying | YES | Bcrypt hashed password (NULL for Google-only accounts) |
| full_name | character varying | NO | User's full name |
| phone | character varying | YES | Contact phone number |
| role | character varying | YES | User role — CHECK (`user`, `admin`), default `user` |
| is_locked | boolean | YES | Account lock status (default `false`) |
| failed_login_attempts | integer | YES | Track failed login attempts (default `0`) |
| last_login | timestamp without time zone | YES | Last login timestamp |
| google_id | character varying | YES | Google account id (UNIQUE) for OAuth login |
| avatar_url | character varying | YES | Profile picture URL (from Google or profile update) |
| auth_provider | character varying | NO | Auth source — `local` or `google` (default `local`) |
| created_at | timestamp without time zone | YES | Account creation time |
| updated_at | timestamp without time zone | YES | Last update time |

> **CHECK:** `role IN ('user', 'admin')`.
> **Note:** `google_id`, `avatar_url`, `auth_provider` and the `password_hash` NULL allowance are added lazily at runtime by `ensureOAuthSchema()` in `authService.js` (idempotent `ADD COLUMN IF NOT EXISTS`).

---

### 2. roles
Reference table for named roles.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| role_id | integer | NO | Primary key |
| role_name | character varying | NO | Role name |

---

### 3. refresh_tokens
Stores user refresh tokens for authentication.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | bigint | NO | Primary key |
| user_id | integer | NO | Foreign key → users.id |
| token | text | NO | Refresh token value |
| created_at | timestamp without time zone | NO | Token creation time |
| expires_at | timestamp without time zone | NO | Token expiry time |
| revoked | boolean | NO | Whether the token has been revoked |

---

### 3b. password_reset_tokens
Stores hashed, single-use password-reset tokens. Created lazily at runtime by `ensurePasswordResetSchema()` in `authService.js` (so it may not exist until the first "forgot password" request).

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | integer | NO | Primary key |
| user_id | integer | NO | Foreign key → users.id (ON DELETE CASCADE) |
| token_hash | character varying(64) | NO | SHA-256 hash of the reset token (UNIQUE) |
| expires_at | timestamp without time zone | NO | Token expiry (default 60 minutes) |
| used_at | timestamp without time zone | YES | When the token was consumed (NULL = unused) |
| created_at | timestamp without time zone | NO | Creation time |

---

### 4. family_groups
Stores family group information.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | integer | NO | Primary key |
| name | character varying | NO | Group name |
| created_by | integer | NO | Foreign key → users.id |
| created_at | timestamp without time zone | YES | Creation time |
| updated_at | timestamp without time zone | YES | Last update time |
| code | character varying | YES | Invite/join code for the group |

---

### 5. group_members
Maps users to family groups (many-to-many).

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | integer | NO | Primary key |
| group_id | integer | NO | Foreign key → family_groups.id |
| user_id | integer | NO | Foreign key → users.id |
| joined_at | timestamp without time zone | YES | Timestamp when user joined |
| role | character varying | YES | Role within the group (e.g., `admin`, `member`) |

---

### 6. family_invitations
Tracks invitations sent between users for joining family groups.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | integer | NO | Primary key |
| group_id | integer | NO | Foreign key → family_groups.id |
| inviter_user_id | integer | NO | Foreign key → users.id (sender) |
| invited_user_id | integer | YES | Foreign key → users.id (recipient; NULL when inviting an email that has no account yet) |
| status | character varying | NO | Invitation status (e.g., `pending`, `accepted`, `rejected`), default `pending` |
| created_at | timestamp without time zone | YES | Invitation creation time |
| responded_at | timestamp without time zone | YES | Time when recipient responded |
| invited_email | character varying | YES | Email invited (used for invite-by-email before the user registers) |
| token_hash | character varying | YES | Hash of the email-invitation acceptance token |
| expires_at | timestamp without time zone | YES | Invitation token expiry (≈ 7 days) |

---

### 7. food_categories
Reference table for food categories.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | integer | NO | Primary key |
| name_vi | character varying | NO | Vietnamese category name |
| name_en | character varying | NO | English category name |
| description | character varying | YES | Optional description |

---

### 8. units
Reference table for measurement units.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | integer | NO | Primary key |
| name | character varying | NO | Unit name (e.g., kilogram, liter) |
| symbol | character varying | NO | Short symbol (e.g., kg, l) |

---

### 9. foods
Master catalog of food items.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | integer | NO | Primary key |
| food_name | character varying | NO | Name of the food |
| unit_id | integer | NO | Foreign key → units.id |
| category_id | integer | NO | Foreign key → food_categories.id |
| icon | character varying | YES | Icon identifier or URL |
| created_at | timestamp without time zone | YES | Record creation time |

---

### 10. fridge_items
Stores food items currently in a user's fridge/pantry.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | integer | NO | Primary key |
| user_id | integer | NO | Foreign key → users.id |
| name | character varying | NO | Food name |
| quantity | numeric | NO | Amount stored |
| unit_id | integer | NO | Foreign key → units.id |
| category_id | integer | NO | Foreign key → food_categories.id |
| expiration_date | date | NO | Expiration date |
| storage_location | character varying | YES | Storage code — CHECK (`freezer`, `fridge`, `door`), default `fridge`. See VN↔EN mapping note below |
| added_at | timestamp without time zone | YES | When the item was added |
| updated_at | timestamp without time zone | YES | Last update time |

---

### 11. fridge_item_storage_locations
Tracks storage location history or detail for fridge items.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| chi_tiet_id | integer | NO | Primary key / foreign key → fridge_items.id |
| storage_location | character varying | NO | Storage location value |
| updated_at | timestamp with time zone | NO | Last update time |

---

### 12. shopping_lists
Stores shopping list headers.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | integer | NO | Primary key |
| user_id | integer | NO | Foreign key → users.id (creator) |
| group_id | integer | YES | Foreign key → family_groups.id (shared list) |
| list_type | character varying | NO | Type of list (e.g., `daily`, `weekly`) |
| name | character varying | NO | List name |
| plan_date | date | YES | Planned shopping date |
| status | character varying | YES | List status (e.g., `active`, `completed`) |
| assigned_user_id | integer | YES | Foreign key → users.id (assigned shopper) |
| created_at | timestamp without time zone | YES | Creation time |
| updated_at | timestamp without time zone | YES | Last update time |

---

### 13. shopping_list_items
Stores individual items within a shopping list.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | integer | NO | Primary key |
| shopping_list_id | integer | NO | Foreign key → shopping_lists.id |
| food_id | integer | YES | Foreign key → foods.id |
| name | character varying | NO | Item name |
| quantity | numeric | NO | Amount needed |
| unit_id | integer | NO | Foreign key → units.id |
| category_id | integer | NO | Foreign key → food_categories.id |
| is_purchased | boolean | YES | Whether the item has been purchased |
| purchased_by | integer | YES | Foreign key → users.id (who bought it) |
| purchased_at | timestamp without time zone | YES | When purchased |
| bought_quantity | numeric | YES | Actual quantity bought |
| remaining_quantity | numeric | YES | Remaining quantity needed |
| item_status | character varying | YES | Item status (e.g., `pending`, `partial`, `done`) |
| inventory_synced_quantity | numeric | YES | Quantity synced to fridge inventory |
| bought_status | boolean | YES | Alternative boolean purchase flag |
| created_at | timestamp without time zone | YES | Record creation time |

---

### 14. recipes
Stores recipe information.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | integer | NO | Primary key |
| name_vi | character varying | NO | Vietnamese recipe name |
| name_en | character varying | NO | English recipe name |
| description | text | YES | Recipe description |
| instructions | text | NO | Step-by-step cooking instructions |
| prep_time | integer | YES | Preparation time in minutes |
| cook_time | integer | YES | Cooking time in minutes |
| servings | integer | YES | Number of servings |
| created_by | integer | YES | Foreign key → users.id (NULL = system recipe) |
| is_public | boolean | YES | Whether visible to all users |
| created_at | timestamp without time zone | YES | Creation time |
| updated_at | timestamp without time zone | YES | Last update time |

---

### 15. recipe_ingredients
Maps ingredients to recipes.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | integer | NO | Primary key |
| recipe_id | integer | NO | Foreign key → recipes.id |
| name | character varying | NO | Ingredient name |
| quantity | numeric | NO | Amount needed |
| unit_id | integer | NO | Foreign key → units.id |
| category_id | integer | YES | Foreign key → food_categories.id |

---

### 16. meal_plans
Stores meal plan headers.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | integer | NO | Primary key |
| user_id | integer | NO | Foreign key → users.id |
| plan_type | character varying | NO | Plan type (e.g., `daily`, `weekly`) |
| start_date | date | NO | Plan start date |
| end_date | date | NO | Plan end date |
| status | character varying | YES | Plan status (e.g., `draft`, `active`, `completed`) |
| created_at | timestamp without time zone | YES | Creation time |
| updated_at | timestamp without time zone | YES | Last update time |

---

### 17. meal_plan_items
Stores individual meals within a meal plan.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | integer | NO | Primary key |
| meal_plan_id | integer | NO | Foreign key → meal_plans.id |
| recipe_id | integer | NO | Foreign key → recipes.id |
| meal_date | date | NO | Date of the meal |
| meal_type | character varying | NO | Meal type (e.g., `breakfast`, `lunch`, `dinner`, `snack`) |
| is_cooked | boolean | YES | Whether the meal has been cooked |
| created_at | timestamp without time zone | YES | Record creation time |

---

### 18. favorite_recipes
Tracks user's favorite recipes (many-to-many).

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | integer | NO | Primary key |
| user_id | integer | NO | Foreign key → users.id |
| recipe_id | integer | NO | Foreign key → recipes.id |
| created_at | timestamp without time zone | YES | When the recipe was favorited |

---

### 19. notifications
Stores system notifications for users.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | integer | NO | Primary key |
| user_id | integer | NO | Foreign key → users.id |
| type | character varying | NO | Notification type (e.g., `expiration`, `shopping_update`) |
| title | character varying | NO | Notification title |
| message | text | NO | Notification body |
| is_read | boolean | YES | Whether the notification has been read |
| related_id | integer | YES | Optional reference to a related entity ID |
| created_at | timestamp without time zone | YES | Creation time |

---

### 20. danh_muc_cong_thuc
Vietnamese-named table for recipe categories.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| danh_muc_cong_thuc_id | integer | NO | Primary key |
| ten_danh_muc | character varying | NO | Category name |
| mo_ta | text | YES | Description |
| ngay_tao | timestamp with time zone | YES | Creation timestamp |

---

## Relationships Diagram

```
users (1) ──── (n) fridge_items
users (1) ──── (n) shopping_lists
users (1) ──── (n) meal_plans
users (1) ──── (n) group_members
users (1) ──── (n) favorite_recipes
users (1) ──── (n) notifications
users (1) ──── (n) refresh_tokens
users (1) ──── (n) family_groups          (via created_by)
users (1) ──── (n) family_invitations     (via inviter_user_id / invited_user_id)
users (1) ──── (n) shopping_list_items    (via purchased_by / assigned_user_id)

family_groups (1) ──── (n) group_members
family_groups (1) ──── (n) family_invitations
family_groups (1) ──── (n) shopping_lists

shopping_lists (1) ──── (n) shopping_list_items

foods (n) ──── (1) units
foods (n) ──── (1) food_categories

fridge_items (n) ──── (1) users
fridge_items (n) ──── (1) units
fridge_items (n) ──── (1) food_categories
fridge_items (1) ──── (1) fridge_item_storage_locations

shopping_list_items (n) ──── (1) shopping_lists
shopping_list_items (n) ──── (1) units
shopping_list_items (n) ──── (1) food_categories
shopping_list_items (n) ──── (1) foods     (optional)

recipes (1) ──── (n) recipe_ingredients
recipes (1) ──── (n) meal_plan_items
recipes (1) ──── (n) favorite_recipes

recipe_ingredients (n) ──── (1) units
recipe_ingredients (n) ──── (1) food_categories   (optional)

meal_plans (1) ──── (n) meal_plan_items
```

---

## CHECK Constraints (enumerations)

These columns are restricted by DB `CHECK` constraints. The API/UI **must** send exactly these values — sending other strings (e.g. Vietnamese labels) raises a constraint-violation error.

| Table.Column | Allowed values |
|--------------|----------------|
| users.role | `user`, `admin` |
| fridge_items.storage_location | `freezer`, `fridge`, `door` |
| meal_plans.plan_type | `daily`, `weekly` |
| meal_plans.status | `draft`, `active`, `completed` |
| meal_plan_items.meal_type | `breakfast`, `lunch`, `dinner`, `snack` |
| shopping_lists.list_type | `daily`, `weekly` |
| shopping_lists.status | `active`, `completed`, `cancelled` |
| shopping_list_items.item_status | `PENDING`, `PARTIAL`, `COMPLETED` |
| notifications.type | `expiration`, `meal_reminder`, `shopping_update`, `system` |

### Storage-location VN ↔ EN mapping

The UI uses Vietnamese labels while the DB stores English codes. `FridgeItemModel` translates at the model boundary (write VN→EN, read EN→VN):

| UI label (VN) | DB code (EN) |
|---------------|--------------|
| Ngăn mát | `fridge` |
| Ngăn đông / Ngăn đá | `freezer` |
| Kệ thường / Cửa tủ / Cánh tủ / Ngoài tủ | `door` |

---

## Notes

- **Database**: PostgreSQL via Supabase.
- **Numeric quantities**: Use `numeric` type to avoid floating-point precision issues.
- **Timestamps**: Most tables use `timestamp without time zone`; `danh_muc_cong_thuc` and `fridge_item_storage_locations` use `timestamp with time zone`.
- **Expiration alerts**: Query `fridge_items` where `expiration_date` BETWEEN `NOW()` AND `NOW() + INTERVAL '3 days'`.
- **Soft deletes**: Not currently modeled; use `status` columns where applicable.
- **Authentication**: `refresh_tokens` manages JWT refresh lifecycle; `revoked` flag invalidates tokens without deletion.
