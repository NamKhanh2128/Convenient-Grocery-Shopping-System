export type Lang = "vi" | "en";

export const translations = {
  vi: {
    // Navigation
    dashboard: "Trang chủ",
    fridge: "Tủ lạnh",
    shopping: "Mua sắm",
    mealPlan: "Thực đơn",
    statistics: "Thống kê",
    family: "Gia đình",
    profile: "Hồ sơ",
    logout: "Đăng xuất",

    // Auth - Login
    loginTitle: "Đăng nhập hệ thống",
    loginSubtitle: "Hệ thống quản lý thực phẩm và kế hoạch bữa ăn cho gia đình bạn.",
    loginHeroTitle: "Hệ thống quản lý thực phẩm & bữa ăn tiện lợi",
    loginHeroSubtitle: "Quản lý tủ lạnh, danh sách mua sắm, gợi ý món ăn và lập kế hoạch bữa ăn.",
    loginButton: "Đăng nhập",
    loginLoading: "Đang đăng nhập...",
    rememberMe: "Ghi nhớ đăng nhập",
    forgotPassword: "Quên mật khẩu",
    noAccount: "Chưa có tài khoản?",
    registerLink: "Đăng ký",

    // Auth - Register
    registerTitle: "Tạo tài khoản",
    registerSubtitle: "Sau đăng ký, hệ thống tự tạo gia đình mặc định gồm chính bạn.",
    registerButton: "Đăng ký",
    registerLoading: "Đang tạo...",
    strengthWeak: "Yếu",
    strengthMedium: "Trung bình",
    strengthStrong: "Mạnh",
    strengthLabel: "Độ mạnh mật khẩu",
    hasAccount: "Đã có tài khoản?",
    loginLink: "Đăng nhập",

    // Form fields
    fieldEmail: "Email",
    fieldPassword: "Mật khẩu",
    fieldConfirmPassword: "Xác nhận mật khẩu",
    fieldFullName: "Họ và tên",
    fieldPhone: "Số điện thoại",
    fieldAvatarUrl: "URL ảnh đại diện",

    // Buttons / Actions
    save: "Lưu",
    cancel: "Hủy",
    close: "Đóng",
    confirm: "Xác nhận",
    delete: "Xóa",
    edit: "Chỉnh sửa",
    add: "Thêm",
    create: "Tạo mới",
    view: "Xem",
    done: "Hoàn tất",

    // Meal plan
    mealBreakfast: "Bữa sáng",
    mealLunch: "Bữa trưa",
    mealDinner: "Bữa tối",
    addMeal: "Thêm món",
    detailButton: "Chi tiết",
    replaceButton: "Thay thế",
    favoriteButton: "Yêu thích",
    removeButton: "Xóa",
    ingredients: "Nguyên liệu",
    cookingSteps: "Các bước nấu",
    addMissingToCart: "Mua nguyên liệu còn thiếu",
    noMealYet: "Chưa có món. Nhấn Thêm món để chọn công thức.",
    chooseRecipe: "Chọn công thức",
    mealDetail: "Chi tiết bữa ăn",

    // Family
    taskAssignment: "Phân công mua hàng",
    reassign: "Chọn người nhận",
    roleOwner: "Quản trị",
    roleMember: "Thành viên",
    statusJoined: "Đã tham gia",
    noTasks: "Không có nhiệm vụ mua hàng đang mở.",
    noMembers: "Chưa có thành viên nào.",
    acceptTask: "Nhận mua",
    rejectTask: "Từ chối",
    assignedLabel: "Được giao:",
    notAssigned: "Chưa phân công",

    // Dashboard
    activityFeed: "Hoạt động gia đình",
    activityFeedSub: "Cập nhật mới nhất từ các thành viên",
    mealPlanSection: "Kế hoạch bữa ăn",
    progress: "Tiến độ",
    actorLabel: "Thành viên",
    actionLabel: "Hành động",
    targetLabel: "Đối tượng",
    quantityLabel: "Số lượng",
    timestampLabel: "Thời gian",
    statusLabel: "Trạng thái",

    // Shopping
    shoppingStatus_COMPLETED: "Hoàn thành",
    shoppingStatus_PARTIAL: "Một phần",
    shoppingStatus_PENDING: "Chờ mua",
    shoppingListSubtitle: "Nhấn vào từng mặt hàng để cập nhật số lượng đã mua.",
    completeConfirm: "Chỉ danh sách có tất cả mặt hàng hoàn thành mới được chuyển sang xong.",
    itemsCount: "mặt hàng",

    // Statistics
    statisticsTitle: "Thống kê",
    statisticsSubtitle: "Phân tích tiêu thụ thực phẩm, xu hướng và báo cáo lãng phí.",

    // Language
    language: "Ngôn ngữ",
    changePassword: "Đổi mật khẩu",

    // Common
    noData: "Chưa có dữ liệu",
    loading: "Đang tải...",
    search: "Tìm kiếm...",
  },

  en: {
    // Navigation
    dashboard: "Home",
    fridge: "Fridge",
    shopping: "Shopping",
    mealPlan: "Meal Plan",
    statistics: "Statistics",
    family: "Family",
    profile: "Profile",
    logout: "Logout",

    // Auth - Login
    loginTitle: "Sign in",
    loginSubtitle: "Manage your family's food, shopping, and meal plans.",
    loginHeroTitle: "Convenient Grocery & Meal Planning System",
    loginHeroSubtitle: "Manage your fridge, shopping lists, recipe suggestions, and meal planning.",
    loginButton: "Sign in",
    loginLoading: "Signing in...",
    rememberMe: "Remember me",
    forgotPassword: "Forgot password",
    noAccount: "Don't have an account?",
    registerLink: "Sign up",

    // Auth - Register
    registerTitle: "Create account",
    registerSubtitle: "After registration, a default family will be created for you.",
    registerButton: "Sign up",
    registerLoading: "Creating...",
    strengthWeak: "Weak",
    strengthMedium: "Medium",
    strengthStrong: "Strong",
    strengthLabel: "Password strength",
    hasAccount: "Already have an account?",
    loginLink: "Sign in",

    // Form fields
    fieldEmail: "Email",
    fieldPassword: "Password",
    fieldConfirmPassword: "Confirm password",
    fieldFullName: "Full name",
    fieldPhone: "Phone number",
    fieldAvatarUrl: "Avatar URL",

    // Buttons / Actions
    save: "Save",
    cancel: "Cancel",
    close: "Close",
    confirm: "Confirm",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    create: "Create",
    view: "View",
    done: "Done",

    // Meal plan
    mealBreakfast: "Breakfast",
    mealLunch: "Lunch",
    mealDinner: "Dinner",
    addMeal: "Add meal",
    detailButton: "Detail",
    replaceButton: "Replace",
    favoriteButton: "Favorite",
    removeButton: "Remove",
    ingredients: "Ingredients",
    cookingSteps: "Cooking steps",
    addMissingToCart: "Add missing ingredients to cart",
    noMealYet: "No meal yet. Click Add meal to choose a recipe.",
    chooseRecipe: "Choose recipe",
    mealDetail: "Meal detail",

    // Family
    taskAssignment: "Task assignment",
    reassign: "Reassign",
    roleOwner: "Owner",
    roleMember: "Member",
    statusJoined: "Joined",
    noTasks: "No open buying tasks.",
    noMembers: "No members yet.",
    acceptTask: "Accept",
    rejectTask: "Decline",
    assignedLabel: "Assigned:",
    notAssigned: "Unassigned",

    // Dashboard
    activityFeed: "Family feed",
    activityFeedSub: "Latest updates from family members",
    mealPlanSection: "Meal plan",
    progress: "Progress",
    actorLabel: "Actor",
    actionLabel: "Action",
    targetLabel: "Target",
    quantityLabel: "Quantity",
    timestampLabel: "Timestamp",
    statusLabel: "Status",

    // Shopping
    shoppingStatus_COMPLETED: "Completed",
    shoppingStatus_PARTIAL: "Partial",
    shoppingStatus_PENDING: "Pending",
    shoppingListSubtitle: "Tap an item to update the purchased quantity.",
    completeConfirm: "Only lists with all items completed can be marked as done.",
    itemsCount: "items",

    // Statistics
    statisticsTitle: "Statistics",
    statisticsSubtitle: "Analyze food consumption, trends, and waste reports.",

    // Language
    language: "Language",
    changePassword: "Change password",

    // Common
    noData: "No data available",
    loading: "Loading...",
    search: "Search...",
  },
} as const;

export type TranslationKey = keyof typeof translations.vi;
