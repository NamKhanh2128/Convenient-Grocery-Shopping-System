module.exports = {
  tables: {
    mealPlan: 'meal_plans',
    mealPlanItem: 'meal_plan_items',
    recipe: 'recipes',
  },
  columns: {
    mealPlanId: 'id',
    userId: 'user_id',
    planType: 'plan_type',
    startDate: 'start_date',
    endDate: 'end_date',
    status: 'status',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    itemId: 'id',
    itemMealPlanId: 'meal_plan_id',
    mealDate: 'meal_date',
    mealType: 'meal_type',
    recipeId: 'recipe_id',
    recipeTitle: 'name_vi',
  },
  mealTypes: ['Sáng', 'Trưa', 'Tối', 'Bữa phụ', 'Breakfast', 'Lunch', 'Dinner', 'Snack'],
};
