# BACKEND MASTER PLAN & ARCHITECTURAL SPECIFICATION
> **System Upgrade Specification for Admin Portal Integration (ITSS-NATEAT)**  
> **Prepared by:** Principal Software Architect & System Analyst

This document defines the complete technical specifications, database migrations, API contracts, architectural patterns, and development roadmaps required to upgrade the NATEAT backend. It is designed to act as a **single source of truth** for backend developers to implement all features required by `frontend-admin` without needing to examine the frontend source code.

---

## 1. FEATURE INVENTORY (FRONTEND-ADMIN)

Below is the exhaustive list of modules and features currently implemented in `frontend-admin` that must be supported by the backend:

### 1.1 Dashboard & KPI Summary
*   **KPI Metrics**:
    *   Total regular users (`role = 'USER'`).
    *   Total administrators (`role = 'ADMIN'`).
    *   Total standard food catalog entries.
    *   Total public and system-wide recipes.
    *   Total family groups registered.
    *   Total meal plans created.
    *   Total active shopping lists (status is `'DRAFT'`).
*   **Visual Charts**:
    *   *System Activities (LineChart)*: Daily action count across all families for the last 7 days.
    *   *Food Categories Distribution (PieChart)*: Breakdown of food items by category.
    *   *Planned Meals Frequency (BarChart)*: Top 5 recipes ordered by inclusion count in family meal plans.
*   **Recent Audit Feed**: Display table containing the 10 most recent activities across all families (User, Action Type, Detailed Message, Timestamp).
*   **Detailed Overlays (Modals)**:
    *   *Family Groups List*: Table listing all families with creator name, creator email, and member count.
    *   *Shopping Lists List*: Table listing all shopping lists with item count and creator name.

### 1.2 User Management
*   **User Directory**:
    *   Browse users with tabular columns (Avatar, Full Name, Email, Phone, Role Badge, Status [Locked/Active], Joined Date, Actions).
    *   Search by full name, email, or phone.
    *   Filter by role (`ADMIN` vs `USER`) and lock status.
    *   Paginate (default 10 items/page).
*   **User Mutations**:
    *   Add new user (validate email uniqueness, passwords must contain at least 8 characters, 1 uppercase letter, and 1 digit).
    *   Edit user details (full name, email, phone, role).
    *   Toggle Lock Status (administrators can lock/unlock users; self-locking is prevented).
    *   Reset Password (direct override of password).
    *   Single & Bulk Delete (cascade-deletes user accounts, memberships, and owned family groups; self-deletion is blocked).

### 1.3 Family Group Management
*   **Family Directory**:
    *   Table columns (Family Name, ID, Creator/Representative Name, Member Count, Actions).
    *   Search by family name, ID, or creator name.
    *   Paginate (10/page).
*   **Detailed Inspector Modal**:
    *   Lists all members in the family group (Avatar, Name, Email, Role, Owner badge for the creator).
*   **Destructive Clean-up**:
    *   Delete family group (cascades and clears all memberships, inventories/fridge items, shopping lists, meal plans, and activity logs related to the family).

### 1.4 Food Catalog Management
*   **Standard Food Catalog**:
    *   Tabular list (Emoji Icon, Food Name, Category, Unit, Actions).
    *   Filter by categories (Rau củ, Thịt cá, Đồ khô, Sữa & Trứng, Gia vị, Khác).
    *   Search by food name.
*   **Food Mutations**:
    *   Create standard food (select unit, category, emoji picker, name uniqueness validation).
    *   Edit standard food (update categories, units, emoji icons).
    *   Single & Bulk Delete (blocked if the food is used in any recipes; cascades to fridge items and shopping list items if deleted).

### 1.5 Recipe Management
*   **Recipe Directory**:
    *   Grid/Table view switch.
    *   Displays name, description, difficulty, prep time, calories, and images.
*   **Recipe Mutations**:
    *   Create Recipe (Name, Description, Image URL, Time, Calories, Difficulty select, dynamic steps drag-reorder list, dynamic ingredient select with quantities).
    *   Edit Recipe (load previous steps/ingredients, save diff).
    *   Single & Bulk Delete (removes recipe metadata, ingredients, and wipes from meal plans).

### 1.6 Audit Logs (Audit Trail)
*   **Full History Page**:
    *   Audit table (User identity with role/email, Hộ gia đình, Action type category [fridge, shopping, meal, recipe, family], message, target object, date).
    *   Search by user name, family name, or message text.
    *   Filter by action type (fridge, shopping, meal, recipe, family).
    *   Pagination controls.

### 1.7 Settings & System Operations
*   **Admin Profile**: Edit full name, email, phone, change password.
*   **System Controls**:
    *   *Database Reset*: Drop and re-seed the Database to the initial mock states.
    *   *JSON Backup*: Export all Database collections as a single nested JSON backup.

### 1.8 Notifications
*   **Header Bell Dropdown**:
    *   Display system warnings (e.g., system configuration updates, security warnings).
    *   Display expiring food alerts (items in family fridges expiring within 4 days).
    *   Display expired food alerts (items past their expiration dates).
    *   Display recent family activities feed.
    *   Mark read, Mark all as read, and Delete notifications.

---

## 2. API INVENTORY (CONTRACT SPECIFICATIONS)

All admin APIs must be prefixed with `/api/admin` and require an authentication header: `Authorization: Bearer <JWT>`.

```
Authentication Rules:
- Header format: "Authorization: Bearer <Token>"
- Authorization check: Parse JWT -> Check if user.role === 'ADMIN'. If not, return HTTP 403 Forbidden.
```

### 2.1 Auth & Admin Check Middleware
All routes under `/api/admin` must pass through a role-verification middleware:

```javascript
// Middleware: adminRequired.js
module.exports = function adminRequired(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Quyen truy cap bi tu choi. Yeu cau quyen quan tri vien.'
    });
  }
  next();
};
```

---

### 2.2 Dashboard Stats Endpoints

#### 2.2.1 `GET /api/admin/stats/summary`
*   **Description**: Get total counts and the latest 10 activities.
*   **Auth**: Required (Admin)
*   **Response (HTTP 200)**:
    ```json
    {
      "success": true,
      "data": {
        "totalUsers": 142,
        "totalAdmins": 3,
        "totalFoods": 120,
        "totalRecipes": 45,
        "totalFamilies": 32,
        "totalMealPlans": 512,
        "activeShopping": 18,
        "recentActivities": [
          {
            "id": 1024,
            "family_id": "fam-8",
            "family_name": "Gia đình Nguyễn",
            "user_id": 12,
            "user_name": "Nguyễn Văn A",
            "user_role": "USER",
            "action_type": "shopping",
            "message": "hoàn thành danh sách mua sắm 'Cuối tuần'",
            "target": "Cuối tuần",
            "created_at": "2026-06-10T08:22:15Z"
          }
        ]
      }
    }
    ```

#### 2.2.2 `GET /api/admin/stats/meals-by-day`
*   **Description**: Aggregate meal plan counts for the last 7 days.
*   **Auth**: Required (Admin)
*   **Response (HTTP 200)**:
    ```json
    {
      "success": true,
      "data": [
        { "date": "04/06", "count": 12 },
        { "date": "05/06", "count": 15 },
        { "date": "06/06", "count": 18 },
        { "date": "07/06", "count": 14 },
        { "date": "08/06", "count": 22 },
        { "date": "09/06", "count": 25 },
        { "date": "10/06", "count": 30 }
      ]
    }
    ```

#### 2.2.3 `GET /api/admin/stats/foods-by-category`
*   **Description**: Group food catalog items by category name.
*   **Auth**: Required (Admin)
*   **Response (HTTP 200)**:
    ```json
    {
      "success": true,
      "data": [
        { "name": "Rau củ", "value": 45 },
        { "name": "Thịt cá", "value": 30 },
        { "name": "Đồ khô", "value": 25 },
        { "name": "Sữa & Trứng", "value": 10 },
        { "name": "Gia vị", "value": 10 }
      ]
    }
    ```

#### 2.2.4 `GET /api/admin/stats/top-recipes`
*   **Description**: Get top 5 recipes ordered by meal plan frequency.
*   **Auth**: Required (Admin)
*   **Response (HTTP 200)**:
    ```json
    {
      "success": true,
      "data": [
        { "name": "Phở bò tái", "count": 86 },
        { "name": "Cơm bò lúc lắc", "count": 72 },
        { "name": "Canh chua cá lóc", "count": 54 }
      ]
    }
    ```

#### 2.2.5 `GET /api/admin/stats/families`
*   **Description**: List details of all families.
*   **Auth**: Required (Admin)
*   **Response (HTTP 200)**:
    ```json
    {
      "success": true,
      "data": [
        {
          "family_id": "fam-1",
          "family_name": "Gia đình NATEAT",
          "created_by": "user-1",
          "creatorName": "Nguyễn Mạnh Hùng",
          "creatorEmail": "hungnm@nateat.vn",
          "memberCount": 4
        }
      ]
    }
    ```

---

### 2.3 User Management Endpoints

#### 2.3.1 `GET /api/admin/users`
*   **Query Params**: `search`, `role`, `locked`, `page`, `limit`
*   **Response (HTTP 200)**:
    ```json
    {
      "success": true,
      "data": {
        "users": [
          {
            "user_id": "user-2",
            "full_name": "Nguyễn Nam",
            "email": "nam@nateat.vn",
            "phone": "0912345678",
            "role": "USER",
            "locked": false,
            "created_at": "2026-06-01T12:00:00Z"
          }
        ],
        "total": 45,
        "page": 1,
        "pages": 5
      }
    }
    ```

#### 2.3.2 `POST /api/admin/users`
*   **Request Body**:
    ```json
    {
      "full_name": "Trần Thị B",
      "email": "tb@nateat.vn",
      "phone": "0987654321",
      "password": "Password123",
      "role": "USER"
    }
    ```
*   **Response (HTTP 201)**:
    ```json
    {
      "success": true,
      "data": {
        "user_id": "user-49",
        "full_name": "Trần Thị B",
        "email": "tb@nateat.vn",
        "role": "USER"
      }
    }
    ```

#### 2.3.3 `PUT /api/admin/users/:id`
*   **Request Body**:
    ```json
    {
      "full_name": "Trần Thị B (Đã cập nhật)",
      "email": "tb2@nateat.vn",
      "phone": "0987654321",
      "role": "ADMIN"
    }
    ```
*   **Response (HTTP 200)**: Successful update confirmation.

#### 2.3.4 `POST /api/admin/users/:id/toggle-lock`
*   **Response (HTTP 200)**:
    ```json
    {
      "success": true,
      "data": { "user_id": "user-2", "locked": true },
      "message": "Trạng thái khóa tài khoản đã thay đổi."
    }
    ```

#### 2.3.5 `POST /api/admin/users/:id/reset-password`
*   **Request Body**: `{ "new_password": "NewSecurePassword1" }`
*   **Response (HTTP 200)**: Password changed response.

#### 2.3.6 `DELETE /api/admin/users/:id`
*   **Response (HTTP 200)**: deletes user + cascades.

#### 2.3.7 `POST /api/admin/users/bulk-delete`
*   **Request Body**: `{ "ids": ["user-12", "user-15"] }`
*   **Response (HTTP 200)**: Bulk delete summary.

---

### 2.4 Family Management Endpoints

#### 2.4.1 `GET /api/admin/families`
*   **Response (HTTP 200)**: List family names, creator names, creators' email, member lists.
*   **Structure**: Refer to `adminFamilyApi.ts`.

#### 2.4.2 `DELETE /api/admin/families/:id`
*   **Description**: Cascade drops the family, family memberships, planned meals, shopping items, and fridge items.
*   **Response (HTTP 200)**: `{ "success": true, "message": "Đã xóa nhóm gia đình vĩnh viễn" }`

---

### 2.5 Food Catalog Management Endpoints

#### 2.5.1 `POST /api/admin/foods`
*   **Request Body**:
    ```json
    {
      "food_name": "Thịt lợn nạc",
      "category": "Thịt cá",
      "unit": "g",
      "icon": "🐖"
    }
    ```
*   **Response (HTTP 201)**: Returns the newly created food item with `food_id`.

#### 2.5.2 `PUT /api/admin/foods/:id`
*   **Request Body**: Updates name, category, unit, icon.
*   **Response (HTTP 200)**: Returns modified object.

#### 2.5.3 `DELETE /api/admin/foods/:id`
*   **Description**: Returns HTTP 400 if references in `recipe_ingredients` exist. If clean, deletes food + cascades to fridge/shopping items.
*   **Response (HTTP 200)**: Deleted confirmation.

#### 2.5.4 `POST /api/admin/foods/bulk-delete`
*   **Request Body**: `{ "ids": ["food-1", "food-5"] }`
*   **Response (HTTP 200)**: Bulk delete summary.

---

### 2.6 Recipe Catalog Management Endpoints

#### 2.6.1 `POST /api/admin/recipes`
*   **Request Body**:
    ```json
    {
      "recipe_name": "Cơm chiên Dương Châu",
      "description": "Cơm rang phong cách truyền thống",
      "image_url": "https://example.com/com-chien.jpg",
      "time_minutes": 30,
      "calories": 400,
      "difficulty": "Dễ làm",
      "instructions": ["Bước 1...", "Bước 2..."],
      "ingredients": [
        { "food_id": "food-rice", "quantity": 200 },
        { "food_id": "food-egg", "quantity": 2 }
      ]
    }
    ```
*   **Response (HTTP 201)**: Returns the complete recipe object with mapped ingredients and generated `recipe_id`.

#### 2.6.2 `PUT /api/admin/recipes/:id`
*   **Request Body**: Updates metadata, instructions, and replaces recipe ingredients list in a single transaction.
*   **Response (HTTP 200)**: Returns updated recipe.

#### 2.6.3 `DELETE /api/admin/recipes/:id`
*   **Response (HTTP 200)**: Removes recipe, ingredients links, and removes from meal plans.

---

### 2.7 Audit Logs & Settings

#### 2.7.1 `GET /api/admin/activities`
*   **Query Params**: `search`, `action_type`, `page`, `limit`
*   **Response (HTTP 200)**:
    ```json
    {
      "success": true,
      "data": {
        "activities": [
          {
            "id": 45,
            "family_id": "fam-1",
            "family_name": "Gia đình NATEAT",
            "user_id": 3,
            "user_name": "Hùng",
            "user_email": "hung@nateat.vn",
            "user_role": "USER",
            "action_type": "fridge",
            "message": "cập nhật tủ lạnh: 'Sữa tươi hết hạn 10/05'",
            "target": "Sữa tươi hết hạn 10/05",
            "created_at": "2026-06-10T07:22:15Z"
          }
        ],
        "total": 128
      }
    }
    ```

#### 2.7.2 `POST /api/admin/settings/reset-database`
*   **Description**: Truncate all tables and run seed script SQL.
*   **Response (HTTP 200)**: `{ "success": true, "message": "Database has been reset to seed states." }`

#### 2.7.3 `GET /api/admin/settings/export-data`
*   **Description**: Read and serialize entire DB collections into a downloadable JSON object.
*   **Response (HTTP 200)**: Returns full nested JSON backup of the system database.

---

## 3. DATABASE INVENTORY (SCHEMAS & MIGRATIONS)

To support the admin features, the database schema must be augmented. Below is the SQL migration schema.

### 3.1 Migration Schema: Audit Log Table

```sql
-- Migration: 02_create_activities_table.sql
CREATE TABLE IF NOT EXISTS family_activities (
    id SERIAL PRIMARY KEY,
    family_id INT REFERENCES family_groups(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('shopping', 'fridge', 'meal', 'recipe', 'family', 'auth')),
    message TEXT NOT NULL,
    target VARCHAR(255),
    quantity DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'done',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for performance filters
CREATE INDEX IF NOT EXISTS idx_activities_family ON family_activities(family_id);
CREATE INDEX IF NOT EXISTS idx_activities_user ON family_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON family_activities(action_type);
```

### 3.2 Audit Trigger Function (Example for Fridge items update)
Rather than writing log entries manually in Express for every route, we can automatically capture mutations using a database trigger:

```sql
CREATE OR REPLACE FUNCTION log_fridge_activity()
RETURNS TRIGGER AS $$
DECLARE
    v_family_id INT;
    v_user_name TEXT;
    v_food_name TEXT;
BEGIN
    -- Resolve food name
    SELECT food_name INTO v_food_name FROM foods WHERE id = COALESCE(NEW.food_id, OLD.food_id);
    
    IF TG_OP = 'INSERT' THEN
        INSERT INTO family_activities (family_id, user_id, action_type, message, target, quantity)
        VALUES (
            NEW.group_id, 
            NEW.user_id, 
            'fridge', 
            'thêm "' || v_food_name || '" vào tủ lạnh', 
            v_food_name, 
            NEW.quantity
        );
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO family_activities (family_id, user_id, action_type, message, target, quantity)
        VALUES (
            OLD.group_id, 
            OLD.user_id, 
            'fridge', 
            'xóa "' || v_food_name || '" khỏi tủ lạnh', 
            v_food_name, 
            OLD.quantity
        );
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_fridge
AFTER INSERT OR DELETE ON fridge_items
FOR EACH ROW EXECUTE FUNCTION log_fridge_activity();
```

---

## 4. GAP ANALYSIS (FRONTEND VS BACKEND)

| Feature Area | Frontend-Admin Expectation | Current Backend Status | Action Required |
| :--- | :--- | :--- | :--- |
| **Auth** | Requires checking `user.role === 'ADMIN'` | Only verifies JWT token presence, role is unverified on route access. | Add `adminRequired` middleware. Secure `/api/admin/*` paths. |
| **Dashboard** | Fetches aggregated counts, line charts, and meal frequencies | No statistics routes exist in the current API. | Implement `/api/admin/stats/*` controller queries using PostgreSQL group/count aggregates. |
| **Users** | Full CRUD, user locking, bulk delete, password reset | Backend only has `GET /api/users` for dev-test (unprotected). | Implement full `/api/admin/users` routes. Link lock status to DB columns. |
| **Families** | Browse, delete, list members | Route exists for families (`/api/family`), but lacks system-wide admin control list. | Implement `/api/admin/families` CRUD. |
| **Foods** | Create, edit, delete catalog foods | Only has `GET /api/foods` query. | Implement admin CRUD on foods catalog with reference constraints checking. |
| **Recipes** | Dynamic steps and ingredients mapping | CRUD exists for recipes, but it expects family context. | Add support for public/system-wide recipes (creator is Admin, group_id is NULL). |
| **Audit Log** | Browse, search, filter audit trail | The database doesn't have an audit table; backend has no logger. | Create `family_activities` table. Add triggers or controller hooks. |
| **Settings** | Reset database, export system database JSON | No database seeds or export tools available. | Create DB migration CLI script and endpoint for data exports. |

---

## 5. ARCHITECTURAL PATTERN RECOMMENDATION

To integrate smoothly with the current codebase, the backend upgrade should follow the established **Controller-Model** pattern:

```
[Route Layer] /api/admin/users 
     ↓ (Passed to middleware)
[Auth / Admin Check Middleware] 
     ↓
[Controller Layer] AuthAdminController.js (Validates requests, orchestrates model queries)
     ↓
[Model Layer] UserModel.js (Raw SQL Queries using database config pool)
     ↓
[Database] PostgreSQL
```

To prevent manual schema drift, all schema changes must be documented under `database/sql_server_scripts/` (configured for PostgreSQL).

---

## 6. BACKEND ROADMAP & IMPLEMENTATION PLAN

### PHASE 1: Security & Audit Foundation (Priority: P0)
1.  **Authorization Upgrade**:
    *   Create `adminRequired` middleware to safeguard all admin endpoints.
2.  **Audit System Migration**:
    *   Execute database migrations to create the `family_activities` table.
    *   Add activity logger helper in backend utilities.

### PHASE 2: Core Admin Catalog CRUD (Priority: P0)
1.  **User Administration**:
    *   Create `AdminUserController.js`.
    *   Configure lock/unlock logic in SQL queries.
    *   Support password overriding.
2.  **Foods & Recipes Catalogs**:
    *   Build catalog management endpoints.
    *   Prevent deletion of foods if they are active ingredients in recipes.

### PHASE 3: Dashboard & Statistics Aggregations (Priority: P1)
1.  **Dashboard API Layer**:
    *   Create `AdminStatsController.js`.
    *   Write raw SQL queries with `COUNT`, `GROUP BY`, and `DATE_TRUNC` for aggregations.
2.  **Family Overview Listings**:
    *   Configure family inspector queries listing member emails, names, and owner roles.

### PHASE 4: Settings & Data Portability (Priority: P2)
1.  **Backup Engine**:
    *   Implement `/api/admin/settings/export-data` using SQL schema serialization.
2.  **Seed Reset Controller**:
    *   Implement database re-seeding script endpoint.

### PHASE 5: Optimization & System Polish (Priority: P3)
1.  **Index Optimizations**:
    *   Add indexes on `users(email)`, `family_activities(created_at)`.
2.  **Graceful Error boundaries**:
    *   Implement standardized global error wrapper for duplicate entries and foreign key violations.

---

## 7. RISK & INTEGRATION ANALYSIS

1.  **Cascading Deletes (Data Loss Risk)**:
    *   *Risk*: Deleting a family group wipes out a significant volume of children records ( fridge items, meal plans, shopping list items).
    *   *Mitigation*: Implement transactions (`BEGIN; ... COMMIT;`) on all deletion controllers. If any child deletion fails, roll back to prevent half-deleted states.
2.  **Orphaned Recipe Ingredients (Integrity Risk)**:
    *   *Risk*: Deleting a food item that is part of a recipe will cause reference violations.
    *   *Mitigation*: The backend must verify `SELECT COUNT(*) FROM recipe_ingredients WHERE food_id = $1` before proceeding with food deletions.
3.  **Performance overhead of activity aggregation (Performance Risk)**:
    *   *Risk*: Running `COUNT` queries across logs on the dashboard can slow down response times.
    *   *Mitigation*: Limit activity charts to the last 7 days using date bounds. Cache the stats summary in Redis or in-memory if system traffic increases.
