| Table                         | Column           | Data Type                   | Nullable |
| ----------------------------- | ---------------- | --------------------------- | -------- |
| family_groups                 | id               | integer                     | NO       |
| family_groups                 | name             | character varying           | NO       |
| family_groups                 | created_by       | integer                     | NO       |
| family_groups                 | created_at       | timestamp without time zone | YES      |
| family_groups                 | updated_at       | timestamp without time zone | YES      |
| family_groups                 | code             | character varying           | YES      |
| family_invitations            | id               | integer                     | NO       |
| family_invitations            | group_id         | integer                     | NO       |
| family_invitations            | inviter_user_id  | integer                     | NO       |
| family_invitations            | invited_user_id  | integer                     | NO       |
| family_invitations            | status           | character varying           | NO       |
| family_invitations            | created_at       | timestamp without time zone | YES      |
| family_invitations            | responded_at     | timestamp without time zone | YES      |
| favorite_recipes              | id               | integer                     | NO       |
| favorite_recipes              | user_id          | integer                     | NO       |
| favorite_recipes              | recipe_id        | integer                     | NO       |
| favorite_recipes              | created_at       | timestamp without time zone | YES      |
| food_categories               | id               | integer                     | NO       |
| food_categories               | name_vi          | character varying           | NO       |
| food_categories               | name_en          | character varying           | NO       |
| food_categories               | description      | character varying           | YES      |
| foods                         | id               | integer                     | NO       |
| foods                         | food_name        | character varying           | NO       |
| foods                         | unit_id          | integer                     | NO       |
| foods                         | category_id      | integer                     | NO       |
| foods                         | icon             | character varying           | YES      |
| foods                         | created_at       | timestamp without time zone | YES      |
| fridge_item_storage_locations | chi_tiet_id      | integer                     | NO       |
| fridge_item_storage_locations | storage_location | character varying           | NO       |
| fridge_item_storage_locations | updated_at       | timestamp with time zone    | NO       |
| fridge_items                  | id               | integer                     | NO       |
| fridge_items                  | user_id          | integer                     | NO       |
| fridge_items                  | name             | character varying           | NO       |
| fridge_items                  | quantity         | numeric                     | NO       |
| fridge_items                  | unit_id          | integer                     | NO       |
| fridge_items                  | category_id      | integer                     | NO       |
| fridge_items                  | expiration_date  | date                        | NO       |
| fridge_items                  | storage_location | character varying           | YES      |
| fridge_items                  | added_at         | timestamp without time zone | YES      |
| fridge_items                  | updated_at       | timestamp without time zone | YES      |
| group_members                 | id               | integer                     | NO       |
| group_members                 | group_id         | integer                     | NO       |
| group_members                 | user_id          | integer                     | NO       |
| group_members                 | joined_at        | timestamp without time zone | YES      |
| group_members                 | role             | character varying           | YES      |
| meal_plan_items               | id               | integer                     | NO       |
| meal_plan_items               | meal_plan_id     | integer                     | NO       |
| meal_plan_items               | recipe_id        | integer                     | NO       |
| meal_plan_items               | meal_date        | date                        | NO       |
| meal_plan_items               | meal_type        | character varying           | NO       |
| meal_plan_items               | is_cooked        | boolean                     | YES      |
| meal_plan_items               | created_at       | timestamp without time zone | YES      |
| meal_plans                    | id               | integer                     | NO       |
| meal_plans                    | user_id          | integer                     | NO       |
| meal_plans                    | plan_type        | character varying           | NO       |
| meal_plans                    | start_date       | date                        | NO       |
| meal_plans                    | end_date         | date                        | NO       |
| meal_plans                    | status           | character varying           | YES      |
| meal_plans                    | created_at       | timestamp without time zone | YES      |
| meal_plans                    | updated_at       | timestamp without time zone | YES      |
| notifications                 | id               | integer                     | NO       |
| notifications                 | user_id          | integer                     | NO       |
| notifications                 | type             | character varying           | NO       |
| notifications                 | title            | character varying           | NO       |
| notifications                 | message          | text                        | NO       |
| notifications                 | is_read          | boolean                     | YES      |
| notifications                 | related_id       | integer                     | YES      |
| notifications                 | created_at       | timestamp without time zone | YES      |
| recipe_ingredients            | id               | integer                     | NO       |
| recipe_ingredients            | recipe_id        | integer                     | NO       |
| recipe_ingredients            | name             | character varying           | NO       |
| recipe_ingredients            | quantity         | numeric                     | NO       |
| recipe_ingredients            | unit_id          | integer                     | NO       |
| recipe_ingredients            | category_id      | integer                     | YES      |
| recipes                       | id               | integer                     | NO       |
| recipes                       | name_vi          | character varying           | NO       |
| recipes                       | name_en          | character varying           | NO       |
| recipes                       | description      | text                        | YES      |
| recipes                       | instructions     | text                        | NO       |
| recipes                       | prep_time        | integer                     | YES      |
| recipes                       | cook_time        | integer                     | YES      |
| recipes                       | servings         | integer                     | YES      |
| recipes                       | created_by       | integer                     | YES      |
| recipes                       | is_public        | boolean                     | YES      |
| recipes                       | created_at       | timestamp without time zone | YES      |
| recipes                       | updated_at       | timestamp without time zone | YES      |
| refresh_tokens                | id               | bigint                      | NO       |
| refresh_tokens                | user_id          | integer                     | NO       |
| refresh_tokens                | token            | text                        | NO       |
| refresh_tokens                | created_at       | timestamp without time zone | NO       |
| refresh_tokens                | expires_at       | timestamp without time zone | NO       |
| refresh_tokens                | revoked          | boolean                     | NO       |
| roles                         | role_id          | integer                     | NO       |
| roles                         | role_name        | character varying           | NO       |
| shopping_list_items           | id               | integer                     | NO       |
| shopping_list_items           | shopping_list_id | integer                     | NO       |
| shopping_list_items           | food_id          | integer                     | YES      |
| shopping_list_items           | name             | character varying           | NO       |
| shopping_list_items           | quantity         | numeric                     | NO       |
| shopping_list_items           | unit_id          | integer                     | NO       |