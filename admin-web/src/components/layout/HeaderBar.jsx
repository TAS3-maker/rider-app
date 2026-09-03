import { useLocation, useNavigate } from "react-router-dom";
import { WIREFRAME_SCREENS } from "../../constants";
const HeaderBar = () => {
  return <div className="text-center mb-5">
      <h1 className="text-[20px] font-bold text-[#1A1A2E] tracking-tight">
        RidePact Admin Panel — Wireframes v1.0
      </h1>
      <p className="text-[13px] text-[#8A8A9A] mt-1">
        Web-based dashboard · 11 screens · For designer & developer reference
      </p>
    </div>;
};
const WireframeNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  return <nav
    className="flex flex-wrap gap-1.5 justify-center max-w-[1000px] mx-auto mb-6 px-2"
    aria-label="Wireframe Quick Navigation"
  >
      {WIREFRAME_SCREENS.map((s) => {
    const isActive = location.pathname === s.path || s.path === "/schools" && location.pathname === "/schools/add";
    return <button
      key={s.id}
      type="button"
      onClick={() => navigate(s.path)}
      aria-current={isActive ? "page" : void 0}
      className={`px-3 py-1.5 text-[11px] font-medium rounded-full border transition-all select-none cursor-pointer ${isActive ? "bg-[#3AAFA9] text-white border-[#3AAFA9] shadow-xs" : "bg-white text-[#4A4A5A] border-[#E8E8E8] hover:border-[#3AAFA9] hover:text-[#3AAFA9]"}`}
    >
            {s.label}
          </button>;
  })}
    </nav>;
};
export {
  HeaderBar,
  WireframeNav
};
