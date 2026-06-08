const { query } = require('../config/db');

class MealPlanModel {
  /**
   * Create a new meal plan with its items
   */
  static async createPlan(userId, planData) {
    // Basic validation
    if (!planData.plan_type || !planData.start_date || !planData.end_date) {
      throw new Error('Missing required plan fields');
    }

    // Begin transaction
    await query('BEGIN');
    try {
      // 1. Insert meal plan
      const planRes = await query(
        `INSERT INTO meal_plans (user_id, plan_type, start_date, end_date, status, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
         RETURNING id`,
        [userId, planData.plan_type, planData.start_date, planData.end_date, planData.status || 'active']
      );
      
      const planId = planRes.rows[0].id;

      // 2. Insert meal plan items
      if (planData.items && Array.isArray(planData.items) && planData.items.length > 0) {
        // Build the query for multiple inserts
        const values = [];
        const queryParams = [];
        let paramIndex = 1;

        for (const item of planData.items) {
          values.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, CURRENT_TIMESTAMP)`);
          queryParams.push(
            planId, 
            item.recipe_id, 
            item.meal_date, 
            item.meal_type, 
            item.is_cooked || false
          );
        }

        await query(
          `INSERT INTO meal_plan_items (meal_plan_id, recipe_id, meal_date, meal_type, is_cooked, created_at) 
           VALUES ${values.join(', ')}`,
          queryParams
        );
      }

      await query('COMMIT');
      return await this.getPlanById(planId, userId);
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }

  /**
   * Get meal plans with optional date range filter
   */
  static async getPlans(userId, startDate, endDate) {
    let sql = `
      SELECT 
        p.id, p.user_id, p.plan_type, p.start_date, p.end_date, p.status, p.created_at, p.updated_at
      FROM meal_plans p
      WHERE p.user_id = $1
    `;
    const params = [userId];

    if (startDate) {
      params.push(startDate);
      sql += ` AND p.start_date >= $${params.length}`;
    }
    
    if (endDate) {
      params.push(endDate);
      sql += ` AND p.end_date <= $${params.length}`;
    }

    sql += ` ORDER BY p.start_date ASC`;

    const plansRes = await query(sql, params);
    const plans = plansRes.rows;

    if (plans.length === 0) return [];

    // Fetch items for these plans
    const planIds = plans.map(p => p.id);
    // In PostgreSQL, ANY($1::int[]) is preferred
    const itemsRes = await query(
      `SELECT 
         i.id, i.meal_plan_id, i.recipe_id, i.meal_date, i.meal_type, i.is_cooked,
         r.name_vi, r.name_en
       FROM meal_plan_items i
       LEFT JOIN recipes r ON i.recipe_id = r.id
       WHERE i.meal_plan_id = ANY($1::int[])
       ORDER BY i.meal_date ASC`,
      [planIds]
    );

    const itemsByPlanId = {};
    for (const item of itemsRes.rows) {
      if (!itemsByPlanId[item.meal_plan_id]) {
        itemsByPlanId[item.meal_plan_id] = [];
      }
      itemsByPlanId[item.meal_plan_id].push(item);
    }

    return plans.map(plan => ({
      ...plan,
      items: itemsByPlanId[plan.id] || []
    }));
  }

  /**
   * Get a specific meal plan by ID
   */
  static async getPlanById(planId, userId) {
    const planRes = await query(
      `SELECT id, user_id, plan_type, start_date, end_date, status, created_at, updated_at
       FROM meal_plans
       WHERE id = $1 AND user_id = $2`,
      [planId, userId]
    );

    if (planRes.rows.length === 0) return null;
    const plan = planRes.rows[0];

    const itemsRes = await query(
      `SELECT 
         i.id, i.meal_plan_id, i.recipe_id, i.meal_date, i.meal_type, i.is_cooked,
         r.name_vi, r.name_en
       FROM meal_plan_items i
       LEFT JOIN recipes r ON i.recipe_id = r.id
       WHERE i.meal_plan_id = $1
       ORDER BY i.meal_date ASC`,
      [planId]
    );

    plan.items = itemsRes.rows;
    return plan;
  }

  /**
   * Mark a meal item as cooked/uncooked
   */
  static async markItemCooked(planId, itemId, isCooked, userId) {
    // First verify the plan belongs to the user
    const planCheck = await query(
      `SELECT id FROM meal_plans WHERE id = $1 AND user_id = $2`,
      [planId, userId]
    );

    if (planCheck.rows.length === 0) {
      return null; // Plan not found or unauthorized
    }

    const res = await query(
      `UPDATE meal_plan_items 
       SET is_cooked = $1 
       WHERE id = $2 AND meal_plan_id = $3
       RETURNING *`,
      [isCooked, itemId, planId]
    );

    return res.rows[0] || null;
  }

  /**
   * Delete a meal plan (items will be cascade deleted if setup, else need manual delete)
   */
  static async deletePlan(planId, userId) {
    // Assuming ON DELETE CASCADE is configured on the foreign key. 
    // If not, we should manually delete items first or use transaction.
    await query('BEGIN');
    try {
      // Check ownership
      const checkRes = await query(`SELECT id FROM meal_plans WHERE id = $1 AND user_id = $2`, [planId, userId]);
      if (checkRes.rows.length === 0) {
        await query('ROLLBACK');
        return false;
      }

      await query(`DELETE FROM meal_plan_items WHERE meal_plan_id = $1`, [planId]);
      await query(`DELETE FROM meal_plans WHERE id = $1 AND user_id = $2`, [planId, userId]);
      
      await query('COMMIT');
      return true;
    } catch (err) {
      await query('ROLLBACK');
      throw err;
    }
  }
}

module.exports = MealPlanModel;
