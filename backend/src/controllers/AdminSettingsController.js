const { query, pool } = require('../config/db');

class AdminSettingsController {
  /**
   * GET /api/admin/settings/export-data
   * Export all key collections as a JSON backup. All columns map 1:1 to
   * database/supabase/database-schema.md (no ghost tables/columns).
   */
  static async exportData(req, res) {
    try {
      const [
        usersResult,
        familiesResult,
        membersResult,
        foodsResult,
        recipesResult,
        ingredientsResult,
        fridgeResult,
        shoppingListsResult,
        shoppingItemsResult,
        mealPlansResult,
        mealPlanItemsResult,
        notificationsResult,
        recipeCategoriesResult,
      ] = await Promise.all([
        query(`SELECT id, email, full_name, phone, role, is_locked, failed_login_attempts, last_login, created_at, updated_at FROM users`),
        query(`SELECT id, name, created_by, code, created_at, updated_at FROM family_groups`),
        query(`SELECT id, group_id, user_id, role, joined_at FROM group_members`),
        query(`SELECT id, food_name, unit_id, category_id, icon, created_at FROM foods`),
        query(`SELECT id, name_vi, name_en, description, instructions, prep_time, cook_time, servings, created_by, is_public, created_at, updated_at FROM recipes`),
        query(`SELECT id, recipe_id, name, quantity, unit_id, category_id FROM recipe_ingredients`),
        query(`SELECT id, user_id, name, quantity, unit_id, category_id, expiration_date, storage_location, added_at, updated_at FROM fridge_items`),
        query(`SELECT id, user_id, group_id, list_type, name, plan_date, status, assigned_user_id, created_at, updated_at FROM shopping_lists`),
        query(`SELECT id, shopping_list_id, food_id, name, quantity, unit_id, category_id, is_purchased, purchased_by, purchased_at, bought_quantity, remaining_quantity, item_status, inventory_synced_quantity, bought_status, created_at FROM shopping_list_items`),
        query(`SELECT id, user_id, plan_type, start_date, end_date, status, created_at, updated_at FROM meal_plans`),
        query(`SELECT id, meal_plan_id, recipe_id, meal_date, meal_type, is_cooked, created_at FROM meal_plan_items`),
        query(`SELECT id, user_id, type, title, message, is_read, related_id, created_at FROM notifications LIMIT 5000`),
        query(`SELECT danh_muc_cong_thuc_id, ten_danh_muc, mo_ta, ngay_tao FROM danh_muc_cong_thuc`),
      ]);

      const backup = {
        exported_at: new Date().toISOString(),
        users:               usersResult.rows,
        family_groups:       familiesResult.rows,
        group_members:       membersResult.rows,
        foods:               foodsResult.rows,
        recipes:             recipesResult.rows,
        recipe_ingredients:  ingredientsResult.rows,
        fridge_items:        fridgeResult.rows,
        shopping_lists:      shoppingListsResult.rows,
        shopping_list_items: shoppingItemsResult.rows,
        meal_plans:          mealPlansResult.rows,
        meal_plan_items:     mealPlanItemsResult.rows,
        notifications:       notificationsResult.rows,
        danh_muc_cong_thuc:  recipeCategoriesResult.rows,
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="nateat_backup_${new Date().toISOString().split('T')[0]}.json"`);
      return res.status(200).json({ success: true, data: backup });
    } catch (err) {
      console.error('[AdminSettings.exportData]', err);
      return res.status(500).json({ success: false, message: 'Lỗi server khi xuất dữ liệu.' });
    }
  }

  /**
   * POST /api/admin/settings/reset-database
   * WARNING: Truncates all data tables except seed/reference data
   * (users, foods, food_categories, units, roles, danh_muc_cong_thuc).
   * Requires confirmation header.
   */
  static async resetDatabase(req, res) {
    const confirmation = req.headers['x-confirm-reset'] || req.body?.confirmation;
    if (confirmation !== 'CONFIRM_RESET') {
      return res.status(400).json({
        success: false,
        message: 'Cần xác nhận reset. Gửi header "x-confirm-reset: CONFIRM_RESET" hoặc body { confirmation: "CONFIRM_RESET" }.',
      });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Truncate in dependency order (children before parents)
      await client.query(`TRUNCATE TABLE shopping_list_items        RESTART IDENTITY CASCADE`);
      await client.query(`TRUNCATE TABLE shopping_lists             RESTART IDENTITY CASCADE`);
      await client.query(`TRUNCATE TABLE meal_plan_items            RESTART IDENTITY CASCADE`);
      await client.query(`TRUNCATE TABLE meal_plans                 RESTART IDENTITY CASCADE`);
      await client.query(`TRUNCATE TABLE favorite_recipes           RESTART IDENTITY CASCADE`);
      await client.query(`TRUNCATE TABLE recipe_ingredients         RESTART IDENTITY CASCADE`);
      await client.query(`TRUNCATE TABLE recipes                    RESTART IDENTITY CASCADE`);
      await client.query(`TRUNCATE TABLE notifications              RESTART IDENTITY CASCADE`);
      await client.query(`TRUNCATE TABLE fridge_item_storage_locations RESTART IDENTITY CASCADE`);
      await client.query(`TRUNCATE TABLE fridge_items               RESTART IDENTITY CASCADE`);
      await client.query(`TRUNCATE TABLE family_invitations         RESTART IDENTITY CASCADE`);
      await client.query(`TRUNCATE TABLE group_members              RESTART IDENTITY CASCADE`);
      await client.query(`TRUNCATE TABLE family_groups              RESTART IDENTITY CASCADE`);
      // Keep users, foods, food_categories, units, roles, danh_muc_cong_thuc as seed reference data
      await client.query('COMMIT');

      return res.status(200).json({
        success: true,
        message: 'Cơ sở dữ liệu đã được đặt lại về trạng thái ban đầu.',
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('[AdminSettings.resetDatabase]', err);
      return res.status(500).json({ success: false, message: 'Lỗi server khi đặt lại cơ sở dữ liệu.' });
    } finally {
      client.release();
    }
  }
}

module.exports = AdminSettingsController;
