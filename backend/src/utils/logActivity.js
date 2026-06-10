const { query } = require('../config/db');

/**
 * logActivity - Utility to insert audit records into family_activities table.
 *
 * @param {object} params
 * @param {number|null} params.familyId    - The numeric DB id of the family group
 * @param {number|null} params.userId      - The numeric DB id of the acting user
 * @param {string}      params.actionType  - One of: 'shopping','fridge','meal','recipe','family','auth'
 * @param {string}      params.message     - Human-readable description of the action
 * @param {string|null} [params.target]    - Name / label of the affected object
 * @param {number|null} [params.quantity]  - Optional quantity value
 */
async function logActivity({ familyId, userId, actionType, message, target = null, quantity = null }) {
  try {
    await query(
      `INSERT INTO family_activities (family_id, user_id, action_type, message, target, quantity)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [familyId || null, userId || null, actionType, message, target, quantity]
    );
  } catch (err) {
    // Non-fatal: logging failure should never break the main operation
    console.error('[logActivity] Failed to write audit log:', err.message);
  }
}

module.exports = { logActivity };
