require('dotenv').config();
const { query } = require('../src/config/db');

(async () => {
  const tables = ['cong_thuc', 'cong_thuc_nguyen_lieu', 'danh_muc_cong_thuc', 'cong_thuc_yeu_thich'];
  for (const table of tables) {
    const r = await query(
      `SELECT column_name, data_type
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1
       ORDER BY ordinal_position`,
      [table],
    );
    console.log(`\n=== ${table} ===`);
    console.log(r.rows);
  }
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
