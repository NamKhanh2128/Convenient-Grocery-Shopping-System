import { Outlet, useLocation } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminHeader } from "./AdminHeader";

export function AdminLayout() {
  const location = useLocation();

  return (
    // ⚠️ TooltipProvider MUST wrap the entire layout for children tooltips to work
    <TooltipProvider delayDuration={100}>
      <div className="min-h-screen bg-[#66429c] font-sans">
        {/* Top Navigation Header */}
        <AdminHeader />

        {/* Main Viewport — standard scrollable content area */}
        <main className="mx-auto max-w-[1440px] px-4 py-7 sm:px-6">
          <div key={location.pathname} className="animate-page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
export default AdminLayout;
