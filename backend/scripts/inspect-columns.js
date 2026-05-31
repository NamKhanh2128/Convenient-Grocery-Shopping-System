require('dotenv').config();
const { query } = require('../src/config/db');

query(`
  SELECT table_name, column_name, data_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name IN ('tu_lanh','chi_tiet_tu_lanh','thuc_pham','danh_muc','don_vi_tinh','gia_dinh','nguoi_dung')
  ORDER BY table_name, ordinal_position
`)
  .then((r) => {
    for (const row of r.rows) {
      console.log(`${row.table_name}\t${row.column_name}\t${row.data_type}`);
    }
    process.exit(0);
  })
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
