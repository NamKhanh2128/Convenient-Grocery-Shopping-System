require('dotenv').config();
const { query } = require('../src/config/db');

(async () => {
  const tables = ['shopping_lists', 'shopping_list_items', 'foods', 'units', 'food_categories', 'group_members', 'users'];
  for (const table of tables) {
    try {
      const r = await query(
        `SELECT column_name FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position`,
        [table],
      );
      console.log(`\n=== ${table} (${r.rows.length} cols) ===`);
      console.log(r.rows.map((x) => x.column_name).join(', ') || '(missing)');
    } catch (e) {
      console.log(`\n=== ${table} ERROR ===`, e.message);
    }
  }
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
