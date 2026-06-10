import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAdminAuthStore } from "@/store/authStore";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminErrorBoundary } from "@/components/shared/AdminErrorBoundary";

// Lazy-loaded pages for code splitting
const LoginPage = lazy(() => import("@/pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const UserListPage = lazy(() => import("@/pages/users/UserListPage").then((m) => ({ default: m.UserListPage })));
const UserFormPage = lazy(() => import("@/pages/users/UserFormPage").then((m) => ({ default: m.UserFormPage })));
const FoodListPage = lazy(() => import("@/pages/foods/FoodListPage").then((m) => ({ default: m.FoodListPage })));
const FoodFormPage = lazy(() => import("@/pages/foods/FoodFormPage").then((m) => ({ default: m.FoodFormPage })));
const RecipeListPage = lazy(() => import("@/pages/recipes/RecipeListPage").then((m) => ({ default: m.RecipeListPage })));
const RecipeFormPage = lazy(() => import("@/pages/recipes/RecipeFormPage").then((m) => ({ default: m.RecipeFormPage })));
const StatisticsPage = lazy(() => import("@/pages/statistics/StatisticsPage").then((m) => ({ default: m.StatisticsPage })));
const SettingsPage = lazy(() => import("@/pages/settings/SettingsPage").then((m) => ({ default: m.SettingsPage })));
const FamilyListPage = lazy(() => import("@/pages/families/FamilyListPage").then((m) => ({ default: m.FamilyListPage })));
const ActivityLogPage = lazy(() => import("@/pages/activities/ActivityLogPage").then((m) => ({ default: m.ActivityLogPage })));

function PageLoader() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Skeleton: PageHeader */}
      <div className="rounded-[20px] bg-card/60 p-6 shadow-card border border-border/40">
        <div className="h-4 w-1/3 rounded-lg bg-muted mb-2" />
        <div className="h-8 w-2/3 rounded-lg bg-muted mb-2" />
        <div className="h-3 w-1/2 rounded-lg bg-muted" />
      </div>
      {/* Skeleton: Content cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-[20px] bg-card/60 p-6 shadow-card border border-border/40 h-[120px]">
            <div className="h-3 w-1/2 rounded-lg bg-muted mb-3" />
            <div className="h-6 w-1/3 rounded-lg bg-muted mb-3" />
            <div className="h-2 w-2/3 rounded-lg bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminProtectedRoute() {
  const user = useAdminAuthStore((state) => state.user);
  const loading = useAdminAuthStore((state) => state.loading);
  const bootstrap = useAdminAuthStore((state) => state.bootstrap);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#66429c] text-sm text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          Đang tải hệ thống quản trị...
        </div>
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return <Navigate to="/login" replace />;
  }

  return <AdminLayout />;
}

export function AdminRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <AdminErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <LoginPage />
              </Suspense>
            </AdminErrorBoundary>
          }
        />
        <Route element={<AdminProtectedRoute />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <AdminErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <DashboardPage />
                </Suspense>
              </AdminErrorBoundary>
            }
          />
          <Route
            path="/users"
            element={
              <AdminErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <UserListPage />
                </Suspense>
              </AdminErrorBoundary>
            }
          />
          <Route
            path="/users/new"
            element={
              <AdminErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <UserFormPage mode="create" />
                </Suspense>
              </AdminErrorBoundary>
            }
          />
          <Route
            path="/users/:id"
            element={
              <AdminErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <UserFormPage mode="edit" />
                </Suspense>
              </AdminErrorBoundary>
            }
          />
          <Route
            path="/foods"
            element={
              <AdminErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <FoodListPage />
                </Suspense>
              </AdminErrorBoundary>
            }
          />
          <Route
            path="/foods/new"
            element={
              <AdminErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <FoodFormPage mode="create" />
                </Suspense>
              </AdminErrorBoundary>
            }
          />
          <Route
            path="/foods/:id"
            element={
              <AdminErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <FoodFormPage mode="edit" />
                </Suspense>
              </AdminErrorBoundary>
            }
          />
          <Route
            path="/recipes"
            element={
              <AdminErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <RecipeListPage />
                </Suspense>
              </AdminErrorBoundary>
            }
          />
          <Route
            path="/recipes/new"
            element={
              <AdminErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <RecipeFormPage mode="create" />
                </Suspense>
              </AdminErrorBoundary>
            }
          />
          <Route
            path="/recipes/:id"
            element={
              <AdminErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <RecipeFormPage mode="edit" />
                </Suspense>
              </AdminErrorBoundary>
            }
          />

          <Route
            path="/statistics"
            element={
              <AdminErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <StatisticsPage />
                </Suspense>
              </AdminErrorBoundary>
            }
          />
          <Route
            path="/settings"
            element={
              <AdminErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <SettingsPage />
                </Suspense>
              </AdminErrorBoundary>
            }
          />
          <Route
            path="/families"
            element={
              <AdminErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <FamilyListPage />
                </Suspense>
              </AdminErrorBoundary>
            }
          />

          <Route
            path="/activities"
            element={
              <AdminErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <ActivityLogPage />
                </Suspense>
              </AdminErrorBoundary>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
