const { query, pool } = require('../config/db');

class AdminSettingsController {
  /**
   * GET /api/admin/settings/export-data
   * Export all key collections as a JSON backup.
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
        activitiesResult,
      ] = await Promise.all([
        query(`SELECT id, full_name, email, phone, role, is_locked, created_at FROM users`),
        query(`SELECT id, name, created_by, created_at FROM family_groups`),
        query(`SELECT id, group_id, user_id FROM group_members`),
        query(`SELECT f.id, f.food_name, fc.name_vi AS category, u.name AS unit, f.icon FROM foods f LEFT JOIN food_categories fc ON fc.id = f.category_id LEFT JOIN units u ON u.id = f.unit_id`),
        query(`SELECT id, tieu_de, mo_ta, anh_url, thoi_gian, calo, do_kho, loai_quyen FROM recipes`),
        query(`SELECT recipe_id, food_id, quantity FROM recipe_ingredients`),
        query(`SELECT id, group_id, food_id, quantity, expiration_date, storage_location, added_at FROM fridge_items`),
        query(`SELECT id, family_group_id, title, status, created_by, created_at FROM shopping_lists`),
        query(`SELECT id, shopping_list_id, food_id, quantity, is_checked FROM shopping_list_items`),
        query(`SELECT id, family_group_id, recipe_id, meal_date, meal_type FROM meal_plans`),
        query(`SELECT id, family_id, user_id, action_type, message, target, created_at FROM family_activities LIMIT 5000`),
      ]);

      const backup = {
        exported_at: new Date().toISOString(),
        users:             usersResult.rows,
        families:          familiesResult.rows,
        family_members:    membersResult.rows,
        foods:             foodsResult.rows,
        recipes:           recipesResult.rows,
        recipe_ingredients: ingredientsResult.rows,
        fridge_items:      fridgeResult.rows,
        shopping_lists:    shoppingListsResult.rows,
        shopping_list_items: shoppingItemsResult.rows,
        meal_plans:        mealPlansResult.rows,
        family_activities: activitiesResult.rows,
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
   * WARNING: Truncates all data tables. Requires confirmation header.
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
      // Truncate in safe dependency order
      await client.query(`TRUNCATE TABLE family_activities   RESTART IDENTITY CASCADE`);
      await client.query(`TRUNCATE TABLE shopping_list_items RESTART IDENTITY CASCADE`);
      await client.query(`TRUNCATE TABLE shopping_lists      RESTART IDENTITY CASCADE`);
      await client.query(`TRUNCATE TABLE meal_plans          RESTART IDENTITY CASCADE`);
      await client.query(`TRUNCATE TABLE fridge_items        RESTART IDENTITY CASCADE`);
      await client.query(`TRUNCATE TABLE recipe_ingredients  RESTART IDENTITY CASCADE`);
      await client.query(`TRUNCATE TABLE recipes             RESTART IDENTITY CASCADE`);
      await client.query(`TRUNCATE TABLE group_members       RESTART IDENTITY CASCADE`);
      await client.query(`TRUNCATE TABLE family_groups       RESTART IDENTITY CASCADE`);
      // Keep foods, users, and categories as seed reference data
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
