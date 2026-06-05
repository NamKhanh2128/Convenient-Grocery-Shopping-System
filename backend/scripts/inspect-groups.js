require('dotenv').config();
const { query } = require('../src/config/db');

(async () => {
  const tables = await query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name LIKE '%group%'`,
  );
  console.log('group tables', tables.rows);

  for (const row of tables.rows) {
    const name = row.table_name;
    const cols = await query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`,
      [name],
    );
    const data = await query(`SELECT * FROM ${name} LIMIT 5`);
    console.log(`\n=== ${name} ===`, cols.rows.map((c) => c.column_name));
    console.log(data.rows);
  }

  const fk = await query(
    `SELECT conname, pg_get_constraintdef(oid) AS def
     FROM pg_constraint
     WHERE conname = 'shopping_lists_group_id_fkey'`,
  );
  console.log('\nFK', fk.rows);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
