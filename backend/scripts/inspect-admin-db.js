require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { query, closePool } = require('../src/config/db');

async function main() {
  const tables = await query(
    `SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`
  );
  console.log('TABLES:', tables.rows.map((r) => r.tablename).join(', '));

  for (const t of ['users', 'foods', 'food_categories', 'units', 'recipes', 'family_groups', 'notifications', 'danh_muc_cong_thuc']) {
    try {
      const r = await query(`SELECT COUNT(*)::int AS c FROM ${t}`);
      console.log(`${t}:`, r.rows[0].c);
    } catch (e) {
      console.log(`${t}: ERR`, e.message.split('\n')[0]);
    }
  }

  const roles = await query('SELECT role, COUNT(*)::int AS c FROM users GROUP BY role');
  console.log('ROLES:', roles.rows);

  const summary = await query(`
    SELECT
      (SELECT COUNT(*) FROM users WHERE UPPER(role) = 'USER' AND is_locked = FALSE) AS users,
      (SELECT COUNT(*) FROM users WHERE UPPER(role) = 'ADMIN') AS admins,
      (SELECT COUNT(*) FROM foods) AS foods,
      (SELECT COUNT(*) FROM recipes WHERE is_public = TRUE) AS recipes
  `);
  console.log('SUMMARY:', summary.rows[0]);
  await closePool();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
