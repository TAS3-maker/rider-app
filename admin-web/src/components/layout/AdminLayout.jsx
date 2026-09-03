import { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { ToastContainer } from "../common/Toast";
import { useAuth } from "../../context/AuthContext";
const AdminLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return <div className="w-full h-screen bg-[#F5F5F0] flex items-center justify-center text-[#8A8A9A] text-sm">Loading…</div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <div className="w-full h-screen min-h-screen bg-[#F5F5F0] flex overflow-hidden">
      {
    /* Persistent Full-Height Sidebar */
  }
      <Sidebar
    isMobileOpen={isMobileMenuOpen}
    onCloseMobile={() => setIsMobileMenuOpen(false)}
  />

      {
    /* Main Content Area filling full width and height */
  }
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {
    /* Mobile Header Bar for small screens */
  }
        <div className="md:hidden bg-[#1A1A2E] text-white px-4 py-3 flex items-center justify-between shrink-0 shadow-xs z-20">
          <button
    type="button"
    onClick={() => setIsMobileMenuOpen(true)}
    className="p-1 text-white/80 hover:text-white rounded cursor-pointer"
    aria-label="Open sidebar menu"
  >
            <span className="text-xl">☰</span>
          </button>
          <div className="font-extrabold text-[14px] flex items-center gap-1.5">
            <span className="text-[#3AAFA9]">✦</span> RidePact Admin
          </div>
          <div className="w-6" />
        </div>

        {
    /* Scrollable Main Viewport */
  }
        <main className="flex-1 bg-[#F5F5F0] overflow-y-auto flex flex-col min-w-0" id="main-content">
          <Outlet />
        </main>
      </div>

      {
    /* Global Toast Notifications */
  }
      <ToastContainer />
    </div>;
};
export {
  AdminLayout
};
