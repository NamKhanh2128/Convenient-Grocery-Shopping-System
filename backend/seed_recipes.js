require('dotenv').config();
const { query } = require('./src/config/db');

async function seed() {
  try {
    await query('BEGIN');
    const recipes = [
      { id: 1, name_vi: 'Cơm bò lúc lắc', name_en: 'Shaking Beef Rice' },
      { id: 2, name_vi: 'Phở bò tái', name_en: 'Beef Pho' },
      { id: 3, name_vi: 'Cơm rang dưa bò', name_en: 'Beef Fried Rice' },
      { id: 4, name_vi: 'Canh chua cá lóc', name_en: 'Sour Fish Soup' },
    ];
    
    for (const r of recipes) {
      // Check if exists
      const check = await query('SELECT id FROM recipes WHERE id = $1', [r.id]);
      if (check.rows.length === 0) {
        await query(
          'INSERT INTO recipes (id, name_vi, name_en, description, instructions, prep_time, cook_time, servings, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, 10, 20, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
          [r.id, r.name_vi, r.name_en, 'Mô tả món ' + r.name_vi, 'Cách làm món ' + r.name_vi]
        );
      }
    }
    await query('COMMIT');
    console.log('Recipes seeded successfully.');
    process.exit(0);
  } catch (e) {
    await query('ROLLBACK');
    console.error('Seeding failed:', e);
    process.exit(1);
  }
}

seed();
