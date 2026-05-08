# REST API Specification

## Base URL
```
Production: https://api.nateat.com/api/v1
Development: http://localhost:3000/api/v1
```

## Authentication
All API requests (except auth endpoints) require JWT token in header:
```
Authorization: Bearer <jwt_token>
```

---

## 1. Authentication Endpoints

### 1.1 Register
**POST** `/auth/register`

Request body:
```json
{
  "full_name": "Nguyễn Văn A",
  "email": "nguyenvana@gmail.com",
  "password": "Abc@1234",
  "confirm_password": "Abc@1234",
  "phone": "0912.345.678"
}
```

Response (201 Created):
```json
{
  "success": true,
  "message": "Đăng ký thành công",
  "data": {
    "user_id": 1,
    "email": "nguyenvana@gmail.com"
  }
}
```

---

### 1.2 Login
**POST** `/auth/login`

Request body:
```json
{
  "email": "nguyenvana@gmail.com",
  "password": "Abc@1234"
}
```

Response (200 OK):
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "full_name": "Nguyễn Văn A",
      "email": "nguyenvana@gmail.com",
      "role": "user"
    }
  }
}
```

---

### 1.3 Logout
**POST** `/auth/logout`

Response (200 OK):
```json
{
  "success": true,
  "message": "Đăng xuất thành công"
}
```

---

### 1.4 Update Profile
**PUT** `/auth/profile`

Request body:
```json
{
  "full_name": "Nguyễn Văn A Updated",
  "phone": "0987.654.321"
}
```

---

### 1.5 Change Password
**PUT** `/auth/change-password`

Request body:
```json
{
  "old_password": "Abc@1234",
  "new_password": "Xyz@5678",
  "confirm_password": "Xyz@5678"
}
```

---

## 2. Family Group Endpoints

### 2.1 Create Group
**POST** `/groups`

Request body:
```json
{
  "name": "Gia đình Nguyễn"
}
```

---

### 2.2 Get My Groups
**GET** `/groups/my`

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Gia đình Nguyễn",
      "member_count": 3,
      "created_at": "2026-05-01T10:00:00Z"
    }
  ]
}
```

---

### 2.3 Get Group Members
**GET** `/groups/:groupId/members`

---

### 2.4 Add Member
**POST** `/groups/:groupId/members`

Request body:
```json
{
  "email": "thanhvien@gmail.com"
}
```

---

### 2.5 Leave Group
**DELETE** `/groups/:groupId/leave`

---

## 3. Fridge Management Endpoints

### 3.1 Get Fridge Items
**GET** `/fridge?category_id=1&search=thịt&expiring_soon=true`

Query params:
- `category_id` (optional): Filter by category
- `search` (optional): Search by name
- `expiring_soon` (optional): true = items expiring in 3 days
- `expired` (optional): true = already expired items

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Thịt bò",
      "quantity": 500,
      "unit": "gram",
      "category": "Thịt cá",
      "expiration_date": "2026-06-15",
      "storage_location": "freezer",
      "days_until_expiry": 40
    }
  ]
}
```

---

### 3.2 Add Fridge Item
**POST** `/fridge`

Request body:
```json
{
  "name": "Thịt bò",
  "quantity": 500,
  "unit_id": 2,
  "category_id": 1,
  "expiration_date": "2026-06-15",
  "storage_location": "freezer"
}
```

---

### 3.3 Update Fridge Item
**PUT** `/fridge/:itemId`

---

### 3.4 Delete Fridge Item
**DELETE** `/fridge/:itemId`

---

### 3.5 Use Food Item (Reduce Quantity)
**PATCH** `/fridge/:itemId/use`

Request body:
```json
{
  "quantity_used": 200
}
```

---

## 4. Shopping List Endpoints

### 4.1 Get Shopping Lists
**GET** `/shopping-lists?status=active`

---

### 4.2 Create Shopping List
**POST** `/shopping-lists`

Request body:
```json
{
  "name": "Mua sắm tuần 1 tháng 5",
  "list_type": "weekly",
  "group_id": 1,
  "items": [
    {
      "name": "Cà chua",
      "quantity": 1,
      "unit_id": 3,
      "category_id": 2
    },
    {
      "name": "Thịt heo",
      "quantity": 500,
      "unit_id": 2,
      "category_id": 1
    }
  ]
}
```

---

### 4.3 Get Shopping List Detail
**GET** `/shopping-lists/:listId`

---

### 4.4 Update Shopping List Item Status
**PATCH** `/shopping-lists/:listId/items/:itemId/purchased`

Request body:
```json
{
  "is_purchased": true
}
```

---

### 4.5 Delete Shopping List
**DELETE** `/shopping-lists/:listId`

---

## 5. Meal Planning Endpoints

### 5.1 Create Meal Plan
**POST** `/meal-plans`

Request body:
```json
{
  "plan_type": "weekly",
  "start_date": "2026-05-06",
  "end_date": "2026-05-12",
  "items": [
    {
      "recipe_id": 1,
      "meal_date": "2026-05-06",
      "meal_type": "dinner"
    },
    {
      "recipe_id": 3,
      "meal_date": "2026-05-07",
      "meal_type": "lunch"
    }
  ]
}
```

---

### 5.2 Get Meal Plans
**GET** `/meal-plans?start_date=2026-05-06&end_date=2026-05-12`

---

### 5.3 Get Meal Plan Detail
**GET** `/meal-plans/:planId`

---

### 5.4 Mark Meal as Cooked
**PATCH** `/meal-plans/:planId/items/:itemId/cooked`

---

## 6. Recipe Endpoints

### 6.1 Search Recipes
**GET** `/recipes?search=phở&category_id=1&page=1&limit=20`

---

### 6.2 Get Recipe Detail
**GET** `/recipes/:recipeId`

Response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name_vi": "Phở bò",
    "name_en": "Beef Pho",
    "description": "Món phở bò truyền thống",
    "instructions": "1. Nin hầm xương...",
    "prep_time": 30,
    "cook_time": 120,
    "servings": 4,
    "ingredients": [
      {
        "name": "Thịt bò",
        "quantity": 500,
        "unit": "gram",
        "category": "Thịt cá"
      }
    ],
    "is_favorite": false
  }
}
```

---

### 6.3 Suggest Recipes (Based on Fridge)
**GET** `/recipes/suggest?limit=10`

Response: Recipes that can be made with current fridge ingredients.

---

### 6.4 Add Recipe (Admin or User)
**POST** `/recipes`

---

### 6.5 Toggle Favorite Recipe
**POST** `/recipes/:recipeId/favorite`

---

### 6.6 Get My Favorite Recipes
**GET** `/recipes/favorites`

---

## 7. Report Endpoints

### 7.1 Purchase Statistics
**GET** `/reports/purchases?start_date=2026-01-01&end_date=2026-05-01`

---

### 7.2 Food Waste Report
**GET** `/reports/waste?start_date=2026-01-01&end_date=2026-05-01`

---

### 7.3 Consumption Trends
**GET** `/reports/trends?period=monthly`

---

## 8. Admin Endpoints

### 8.1 Get All Users
**GET** `/admin/users?page=1&limit=20&search=`

---

### 8.2 Update User Status (Lock/Unlock)
**PATCH** `/admin/users/:userId/status`

Request body:
```json
{
  "is_locked": true
}
```

---

### 8.3 Manage Food Categories
**GET/POST/PUT/DELETE** `/admin/categories`

---

### 8.4 Manage Units
**GET/POST/PUT/DELETE** `/admin/units`

---

## Standard Response Format

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Email không hợp lệ"
    }
  ]
}
```

**HTTP Status Codes:**
- 200: Success
- 201: Created
- 400: Bad Request (validation error)
- 401: Unauthorized (invalid/missing token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 409: Conflict (duplicate data)
- 500: Internal Server Error

---

## Notes

- All timestamps in ISO 8601 format (UTC)
- Pagination: Use `page` and `limit` query params, default page=1, limit=20
- Language: Use `Accept-Language: vi` or `Accept-Language: en` header for localized responses
- Rate limiting: 100 requests per 15 minutes per user (JWT-based)
