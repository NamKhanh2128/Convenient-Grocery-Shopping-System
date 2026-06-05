module.exports = {
  tables: {
    mealPlan: 'ke_hoach_bua_an',
    recipe: 'cong_thuc',
    family: 'gia_dinh',
  },
  columns: {
    mealPlanId: 'ke_hoach_id',
    familyId: 'gia_dinh_id',
    mealDate: 'ngay_an',
    mealType: 'bua_an',
    recipeId: 'cong_thuc_id',
    createdAt: 'ngay_tao',
    recipeTitle: 'ten_mon_an',
  },
  mealTypes: ['Sáng', 'Trưa', 'Tối', 'Bữa phụ'],
};
