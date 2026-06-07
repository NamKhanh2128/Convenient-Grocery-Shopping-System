import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";
import { useAuthStore } from "@/modules/auth/store/authStore";
import { LoginPage } from "@/modules/auth/pages/LoginPage";
import { RegisterPage } from "@/modules/auth/pages/RegisterPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { FridgePage } from "@/modules/fridge/pages/FridgePage";
import { FridgeFormPage } from "@/modules/fridge/pages/FridgeFormPage";
import { ShoppingPage } from "@/modules/shopping/pages/ShoppingPage";
import { ShoppingCreatePage } from "@/modules/shopping/pages/ShoppingCreatePage";
import { ShoppingDetailPage } from "@/modules/shopping/pages/ShoppingDetailPage";
import { MealPlanPage } from "@/modules/meal-plan/pages/MealPlanPage";
import { RecipeDetailPage } from "@/modules/recipe/pages/RecipeDetailPage";
import { FamilyPage } from "@/modules/family/pages/FamilyPage";
import { ProfilePage } from "@/modules/auth/pages/ProfilePage";
import { ChangePasswordPage } from "@/modules/auth/pages/ChangePasswordPage";
import { SplashPage } from "@/pages/SplashPage";
import { StatisticsPage } from "@/modules/statistics/pages/StatisticsPage";
import { OnboardingPage } from "@/pages/OnboardingPage";

function ProtectedRoute() {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Đang tải hệ thống...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <MainLayout />;
}

export function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SplashPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
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
          <Route path="/recipes/:id" element={<RecipeDetailPage />} />
          <Route path="/suggestions" element={<Navigate to="/meal-planner" replace />} />
          <Route path="/recipes" element={<Navigate to="/meal-planner" replace />} />
          <Route path="/favorites" element={<Navigate to="/meal-planner" replace />} />
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
