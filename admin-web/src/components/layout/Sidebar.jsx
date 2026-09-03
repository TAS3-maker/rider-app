import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
const SIDEBAR_ITEMS = [
  // Overview
  { path: "/dashboard", label: "Dashboard", icon: "\u{1F4CA}", section: "Overview" },
  // Manage
  { path: "/users", label: "Users", icon: "\u{1F464}", section: "Manage" },
  { path: "/trips", label: "Trips", icon: "\u{1F697}", section: "Manage" },
  { path: "/groups", label: "Groups", icon: "\u{1F465}", section: "Manage" },
  { path: "/events", label: "Event Logs", icon: "\u{1F4CB}", section: "Manage" },
  // Configure
  { path: "/schools", label: "Schools", icon: "\u{1F3EB}", section: "Configure" },
  { path: "/destinations", label: "Destinations", icon: "\u{1F4CD}", section: "Configure" },
  { path: "/pickups", label: "Pickup Locations", icon: "\u{1F4CC}", section: "Configure" },
  { path: "/calendar", label: "Break Calendar", icon: "\u{1F4C5}", section: "Configure" },
  // Communicate
  { path: "/notifications", label: "Notifications", icon: "\u{1F514}", section: "Communicate" },
  // Settings
  { path: "/settings", label: "Platform Settings", icon: "\u2699\uFE0F", section: "Settings" }
];
const Sidebar = ({
  isMobileOpen = false,
  onCloseMobile
}) => {
  const { user, logout } = useAuth();
  const { addToast } = useApp();
  const navigate = useNavigate();
  const handleLogout = async () => {
    await logout();
    addToast("Logged out successfully", "info");
    navigate("/login");
  };
  const sections = ["Overview", "Manage", "Configure", "Communicate", "Settings"];
  return <aside
    className={`w-[220px] bg-[#1A1A2E] text-white py-5 flex flex-col shrink-0 select-none z-30 transition-transform md:translate-x-0 h-full ${isMobileOpen ? "fixed inset-y-0 left-0 shadow-2xl translate-x-0" : "hidden md:flex"}`}
    aria-label="Admin Navigation"
  >
      {
    /* Mobile close button */
  }
      <div className="md:hidden flex justify-end px-4 pb-2">
        <button
    type="button"
    onClick={onCloseMobile}
    className="text-white/60 hover:text-white p-1"
    aria-label="Close navigation"
  >
          ✕
        </button>
      </div>

      {
    /* Sidebar Logo */
  }
      <div className="px-5 pb-5 border-b border-white/10 flex items-center justify-between">
        <div>
          <div className="text-[16px] font-extrabold text-white tracking-tight flex items-center gap-2">
            <span className="text-[#3AAFA9]">✦</span> RidePact Admin
          </div>
          <div className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mt-0.5">
            UMich Campus MVP
          </div>
        </div>
      </div>

      {
    /* Navigation Sections */
  }
      <nav className="flex-1 overflow-y-auto py-2" aria-label="Main Navigation">
        {sections.map((sec) => {
    const items = SIDEBAR_ITEMS.filter((item) => item.section === sec);
    return <div key={sec} className="mb-2">
              <div className="px-5 pt-3.5 pb-1.5 text-[10px] font-bold uppercase tracking-[1px] text-white/30">
                {sec}
              </div>
              {items.map((item) => <NavLink
      key={item.path}
      to={item.path}
      onClick={onCloseMobile}
      className={({ isActive }) => `px-5 py-2.5 text-[13px] flex items-center gap-2.5 transition-all ${isActive ? "bg-[#3AAFA9]/15 text-[#3AAFA9] font-semibold border-r-3 border-[#3AAFA9]" : "text-white/60 hover:bg-white/5 hover:text-white font-normal"}`}
    >
                  <span className="text-[14px]" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </NavLink>)}
            </div>;
  })}
      </nav>

      {
    /* User Info & Logout */
  }
      {user && <div className="p-3.5 mx-3 mt-auto rounded-[8px] bg-white/5 border border-white/10 text-[12px]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-white/90 truncate max-w-[120px]">
              {user.name}
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#3AAFA9]/20 text-[#3AAFA9] font-bold uppercase">
              {user.role}
            </span>
          </div>
          <div className="text-[10px] text-white/40 truncate mb-2">{user.email}</div>
          <button
    type="button"
    onClick={handleLogout}
    className="w-full py-1 text-center rounded text-[11px] font-semibold bg-white/10 text-white/80 hover:bg-[#FF6B6B] hover:text-white transition-colors"
  >
            Sign Out
          </button>
        </div>}
    </aside>;
};
export {
  Sidebar
};
