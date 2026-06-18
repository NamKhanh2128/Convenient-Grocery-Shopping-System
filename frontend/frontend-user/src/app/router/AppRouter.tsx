import { Navigate, Route, BrowserRouter as Router, Routes, useLocation, Outlet } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";
import { useAuthStore } from "@/modules/auth/store/authStore";
import { LoginPage } from "@/modules/auth/pages/LoginPage";
import { RegisterPage } from "@/modules/auth/pages/RegisterPage";
import { ForgotPasswordPage } from "@/modules/auth/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "@/modules/auth/pages/ResetPasswordPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { FridgePage } from "@/modules/fridge/pages/FridgePage";
import { FridgeFormPage } from "@/modules/fridge/pages/FridgeFormPage";
import { ShoppingPage } from "@/modules/shopping/pages/ShoppingPage";
import { ShoppingCreatePage } from "@/modules/shopping/pages/ShoppingCreatePage";
import { ShoppingDetailPage } from "@/modules/shopping/pages/ShoppingDetailPage";
import { MealPlanPage } from "@/modules/meal-plan/pages/MealPlanPage";
import { RecipeDetailPage } from "@/modules/recipe/pages/RecipeDetailPage";
import { RecipeListPage } from "@/modules/recipe/pages/RecipeListPage";
import { RecipeFormPage } from "@/modules/recipe/pages/RecipeFormPage";
import { RecipeFavoritesPage } from "@/modules/recipe/pages/RecipeFavoritesPage";
import { RecipePublicPage } from "@/modules/recipe/pages/RecipePublicPage";
import { RecipeSuggestionsPage } from "@/modules/recipe/pages/RecipeSuggestionsPage";
import { FamilyPage } from "@/modules/family/pages/FamilyPage";
import { ProfilePage } from "@/modules/auth/pages/ProfilePage";
import { ChangePasswordPage } from "@/modules/auth/pages/ChangePasswordPage";
import { SplashPage } from "@/pages/SplashPage";
import { StatisticsPage } from "@/modules/statistics/pages/StatisticsPage";
import { OnboardingPage } from "@/pages/OnboardingPage";
import { InvitationAcceptPage } from "@/pages/InvitationAcceptPage";

function ProtectedRoute() {
  const user = useAuthStore((state) => state.user);
  const family = useAuthStore((state) => state.family);
  const loading = useAuthStore((state) => state.loading);
  const location = useLocation();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Đang tải hệ thống...
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" replace />;
  
  if (!family && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  if (location.pathname === "/onboarding") {
    return <Outlet />;
  }

  return <MainLayout />;
}

export function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SplashPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        {/* Public invitation accept route - accessible without auth */}
        <Route path="/invitations/accept" element={<InvitationAcceptPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/fridge" element={<FridgePage />} />
          <Route path="/fridge/add" element={<FridgeFormPage mode="add" />} />
          <Route path="/fridge/:id" element={<FridgeFormPage mode="edit" />} />
          <Route path="/fridge/edit/:id" element={<FridgeFormPage mode="edit" />} />
          <Route path="/shopping" element={<ShoppingPage />} />
          <Route path="/shopping/create" element={<ShoppingCreatePage />} />
          <Route path="/shopping/:id" element={<ShoppingDetailPage />} />
          <Route path="/meal-planner" element={<MealPlanPage />} />
          <Route path="/meal-plan" element={<Navigate to="/meal-planner" replace />} />
          <Route path="/meal-plan/create" element={<Navigate to="/meal-planner" replace />} />
          <Route path="/meal-plan/calendar" element={<Navigate to="/meal-planner" replace />} />
          <Route path="/meal-planner/create" element={<Navigate to="/meal-planner" replace />} />
          <Route path="/meal-planner/calendar" element={<Navigate to="/meal-planner" replace />} />
          <Route path="/recipes" element={<RecipeListPage />} />
          <Route path="/recipes/explore" element={<RecipePublicPage />} />
          <Route path="/recipes/suggestions" element={<RecipeSuggestionsPage />} />
          <Route path="/recipes/add" element={<RecipeFormPage />} />
          <Route path="/recipes/edit/:id" element={<RecipeFormPage />} />
          <Route path="/recipes/:id" element={<RecipeDetailPage />} />
          <Route path="/favorites" element={<RecipeFavoritesPage />} />
          <Route path="/suggestions" element={<Navigate to="/recipes/suggestions" replace />} />
          <Route path="/statistics" element={<StatisticsPage />} />
          <Route path="/family" element={<FamilyPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<Navigate to="/profile" replace />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
