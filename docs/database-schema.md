# Database Schema Design

## Overview
MySQL database schema for ITSS-NATEAT system. Follows relational model with proper foreign key constraints and indexes for performance.

## Tables

### 1. users
Stores user account information.

| Column | Type | Constraints | Description |
|--------|------|--------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Login email (must be unique) |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| full_name | VARCHAR(255) | NOT NULL | User's full name |
| phone | VARCHAR(20) | NULL | Contact phone number |
| role | ENUM('user', 'admin') | DEFAULT 'user' | User role |
| is_locked | BOOLEAN | DEFAULT FALSE | Account lock status |
| failed_login_attempts | INT | DEFAULT 0 | Track failed logins |
| last_login | TIMESTAMP | NULL | Last login time |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation time |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Last update time |

**Indexes:**
- INDEX idx_email (email)
- INDEX idx_role (role)

---

### 2. family_groups
Stores family group information.

| Column | Type | Constraints | Description |
|--------|------|--------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique group identifier |
| name | VARCHAR(255) | NOT NULL | Group name |
| created_by | INT | NOT NULL, FOREIGN KEY (users.id) | Group creator |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Last update time |

---

### 3. group_members
Maps users to family groups (many-to-many).

| Column | Type | Constraints | Description |
|--------|------|--------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique record identifier |
| group_id | INT | NOT NULL, FOREIGN KEY (family_groups.id) ON DELETE CASCADE | Group reference |
| user_id | INT | NOT NULL, FOREIGN KEY (users.id) ON DELETE CASCADE | User reference |
| joined_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Join time |

**Indexes:**
- UNIQUE INDEX idx_group_user (group_id, user_id)
- INDEX idx_user_id (user_id)

---

### 4. food_categories
Reference table for food categories.

| Column | Type | Constraints | Description |
|--------|------|--------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Category identifier |
| name_vi | VARCHAR(100) | NOT NULL | Vietnamese name (e.g., Thịt cá) |
| name_en | VARCHAR(100) | NOT NULL | English name (e.g., Meat & Fish) |
| description | VARCHAR(255) | NULL | Optional description |

**Seed Data:**
- 1, 'Thịt cá', 'Meat & Fish'
- 2, 'Rau củ', 'Vegetables'
- 3, 'Đồ khô', 'Dry Goods'
- 4, 'Sữa', 'Dairy'
- 5, 'Gia vị', 'Spices'
- 6, 'Trái cây', 'Fruits'

---

### 5. units
Reference table for measurement units.

| Column | Type | Constraints | Description |
|--------|------|--------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unit identifier |
| name | VARCHAR(50) | NOT NULL | Unit name (e.g., kg, gram, cái) |
| symbol | VARCHAR(10) | NOT NULL | Short symbol |

**Seed Data:**
- 1, 'kilogram', 'kg'
- 2, 'gram', 'g'
- 3, 'piece', 'cái'
- 4, 'bunch', 'bó'
- 5, 'liter', 'l'
- 6, 'package', 'gói'

---

### 6. fridge_items
Stores food items in user's fridge.

| Column | Type | Constraints | Description |
|--------|------|--------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique item identifier |
| user_id | INT | NOT NULL, FOREIGN KEY (users.id) ON DELETE CASCADE | Owner reference |
| name | VARCHAR(255) | NOT NULL | Food name |
| quantity | DECIMAL(10,2) | NOT NULL | Amount |
| unit_id | INT | NOT NULL, FOREIGN KEY (units.id) | Unit reference |
| category_id | INT | NOT NULL, FOREIGN KEY (food_categories.id) | Category reference |
| expiration_date | DATE | NOT NULL | Expiration date (HSD) |
| storage_location | ENUM('freezer', 'fridge', 'door') | DEFAULT 'fridge' | Storage location |
| added_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When added |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Last update |

**Indexes:**
- INDEX idx_user_id (user_id)
- INDEX idx_expiration (expiration_date)
- INDEX idx_category (category_id)

---

### 7. shopping_lists
Stores shopping list headers.

| Column | Type | Constraints | Description |
|--------|------|--------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique list identifier |
| user_id | INT | NOT NULL, FOREIGN KEY (users.id) ON DELETE CASCADE | Creator reference |
| group_id | INT | NULL, FOREIGN KEY (family_groups.id) ON DELETE SET NULL | Shared group (nullable) |
| list_type | ENUM('daily', 'weekly') | NOT NULL | Daily or weekly list |
| name | VARCHAR(255) | NOT NULL | List name |
| status | ENUM('active', 'completed', 'cancelled') | DEFAULT 'active' | List status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Last update |

---

### 8. shopping_list_items
Stores items in each shopping list.

| Column | Type | Constraints | Description |
|--------|------|--------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique item identifier |
| shopping_list_id | INT | NOT NULL, FOREIGN KEY (shopping_lists.id) ON DELETE CASCADE | List reference |
| name | VARCHAR(255) | NOT NULL | Food name |
| quantity | DECIMAL(10,2) | NOT NULL | Amount needed |
| unit_id | INT | NOT NULL, FOREIGN KEY (units.id) | Unit reference |
| category_id | INT | NOT NULL, FOREIGN KEY (food_categories.id) | Category reference |
| is_purchased | BOOLEAN | DEFAULT FALSE | Purchase status |
| purchased_by | INT | NULL, FOREIGN KEY (users.id) ON DELETE SET NULL | Who bought it |
| purchased_at | TIMESTAMP | NULL | When purchased |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation time |

**Indexes:**
- INDEX idx_shopping_list (shopping_list_id)
- INDEX idx_purchased (is_purchased)

---

### 9. recipes
Stores recipe information.

| Column | Type | Constraints | Description |
|--------|------|--------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique recipe identifier |
| name_vi | VARCHAR(255) | NOT NULL | Vietnamese name |
| name_en | VARCHAR(255) | NOT NULL | English name |
| description | TEXT | NULL | Recipe description |
| instructions | TEXT | NOT NULL | Cooking instructions |
| prep_time | INT | NULL | Preparation time (minutes) |
| cook_time | INT | NULL | Cooking time (minutes) |
| servings | INT | DEFAULT 4 | Number of servings |
| created_by | INT | NULL, FOREIGN KEY (users.id) ON DELETE SET NULL | Creator (NULL = admin) |
| is_public | BOOLEAN | DEFAULT TRUE | Visible to all users |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Last update |

---

### 10. recipe_ingredients
Maps ingredients to recipes.

| Column | Type | Constraints | Description |
|--------|------|--------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique record identifier |
| recipe_id | INT | NOT NULL, FOREIGN KEY (recipes.id) ON DELETE CASCADE | Recipe reference |
| name | VARCHAR(255) | NOT NULL | Ingredient name |
| quantity | DECIMAL(10,2) | NOT NULL | Amount needed |
| unit_id | INT | NOT NULL, FOREIGN KEY (units.id) | Unit reference |
| category_id | INT | NULL, FOREIGN KEY (food_categories.id) | Category for matching |

**Indexes:**
- INDEX idx_recipe (recipe_id)

---

### 11. meal_plans
Stores meal plan headers.

| Column | Type | Constraints | Description |
|--------|------|--------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique plan identifier |
| user_id | INT | NOT NULL, FOREIGN KEY (users.id) ON DELETE CASCADE | Owner reference |
| plan_type | ENUM('daily', 'weekly') | NOT NULL | Daily or weekly plan |
| start_date | DATE | NOT NULL | Plan start date |
| end_date | DATE | NOT NULL | Plan end date |
| status | ENUM('draft', 'active', 'completed') | DEFAULT 'draft' | Plan status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Last update |

---

### 12. meal_plan_items
Stores meals in each meal plan.

| Column | Type | Constraints | Description |
|--------|------|--------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique item identifier |
| meal_plan_id | INT | NOT NULL, FOREIGN KEY (meal_plans.id) ON DELETE CASCADE | Plan reference |
| recipe_id | INT | NOT NULL, FOREIGN KEY (recipes.id) ON DELETE CASCADE | Recipe reference |
| meal_date | DATE | NOT NULL | Date of the meal |
| meal_type | ENUM('breakfast', 'lunch', 'dinner', 'snack') | NOT NULL | Meal type |
| is_cooked | BOOLEAN | DEFAULT FALSE | Cooking status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation time |

**Indexes:**
- INDEX idx_meal_plan (meal_plan_id)
- INDEX idx_meal_date (meal_date)

---

### 13. favorite_recipes
User's favorite recipes (many-to-many).

| Column | Type | Constraints | Description |
|--------|------|--------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique record identifier |
| user_id | INT | NOT NULL, FOREIGN KEY (users.id) ON DELETE CASCADE | User reference |
| recipe_id | INT | NOT NULL, FOREIGN KEY (recipes.id) ON DELETE CASCADE | Recipe reference |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When favorited |

**Indexes:**
- UNIQUE INDEX idx_user_recipe (user_id, recipe_id)

---

### 14. notifications
Stores system notifications.

| Column | Type | Constraints | Description |
|--------|------|--------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique notification identifier |
| user_id | INT | NOT NULL, FOREIGN KEY (users.id) ON DELETE CASCADE | Target user |
| type | ENUM('expiration', 'meal_reminder', 'shopping_update', 'system') | NOT NULL | Notification type |
| title | VARCHAR(255) | NOT NULL | Notification title |
| message | TEXT | NOT NULL | Notification body |
| is_read | BOOLEAN | DEFAULT FALSE | Read status |
| related_id | INT | NULL | Related entity ID (e.g., fridge_item_id) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation time |

**Indexes:**
- INDEX idx_user_unread (user_id, is_read)
- INDEX idx_created_at (created_at)

---

## Relationships Diagram (Text-based)

```
users (1) ──── (n) fridge_items
users (1) ──── (n) shopping_lists
users (1) ──── (n) meal_plans
users (1) ──── (n) group_members
users (1) ──── (n) favorite_recipes

family_groups (1) ──── (n) group_members
family_groups (1) ──── (n) shopping_lists

shopping_lists (1) ──── (n) shopping_list_items

recipes (1) ──── (n) recipe_ingredients
recipes (1) ──── (n) meal_plan_items
recipes (1) ──── (n) favorite_recipes

meal_plans (1) ──── (n) meal_plan_items

fridge_items (n) ──── (1) food_categories
fridge_items (n) ──── (1) units

shopping_list_items (n) ──── (1) food_categories
shopping_list_items (n) ──── (1) units

recipe_ingredients (n) ──── (1) food_categories
recipe_ingredients (n) ──── (1) units

notifications (n) ──── (1) users
```

## Notes

- All tables use InnoDB engine for foreign key support and transactions (ACID)
- Use `DECIMAL(10,2)` for quantities to avoid floating-point precision issues
- Expiration alerts: Query `fridge_items` where `expiration_date` is between NOW() and DATE_ADD(NOW(), INTERVAL 3 DAY)
- Redis can cache frequently accessed data: user sessions, popular recipes, food categories
