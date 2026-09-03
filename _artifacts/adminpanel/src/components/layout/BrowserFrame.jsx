import { useLocation } from "react-router-dom";
import { useApp } from "../../context/AppContext";
const BrowserFrame = ({ children, onOpenMobileMenu }) => {
  const location = useLocation();
  const { isWireframeFrameMode, toggleWireframeFrameMode } = useApp();
  const currentUrlPath = location.pathname.replace(/^\//, "") || "dashboard";
  return <div
    className={`transition-all duration-300 ${isWireframeFrameMode ? "max-w-[1100px] mx-auto bg-white rounded-[12px] shadow-[0_8px_30px_rgba(0,0,0,0.1)] overflow-hidden min-h-[700px] border border-[#E8E8E8]" : "w-full min-h-screen bg-[#F5F5F0]"}`}
  >
      {
    /* Top Browser URL Bar (matching wireframe) */
  }
      <div className="bg-[#F0F0F0] px-4 py-2.5 flex items-center gap-2 border-b border-[#E8E8E8] select-none">
        {
    /* Mobile menu trigger */
  }
        <button
    type="button"
    onClick={onOpenMobileMenu}
    className="md:hidden p-1 text-[#4A4A5A] hover:text-[#1A1A2E]"
    aria-label="Open sidebar navigation"
  >
          ☰
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28CA42]" />
        </div>

        <div className="flex-1 bg-white px-3 py-1.5 rounded-[6px] text-[12px] text-[#8A8A9A] ml-2 flex items-center justify-between border border-[#E8E8E8]/60 overflow-hidden font-mono">
          <span className="truncate">
            admin.ridepact.com/{currentUrlPath}
          </span>
          <span className="text-[10px] text-[#2B8A85] bg-[#E8F6F5] px-2 py-0.5 rounded font-sans font-bold">
            🔒 SSL Encrypted
          </span>
        </div>

        {
    /* Mode Toggle Button */
  }
        <button
    type="button"
    onClick={toggleWireframeFrameMode}
    title={isWireframeFrameMode ? "Expand to full screen" : "View in browser mockup"}
    className="text-[11px] font-semibold text-[#4A4A5A] hover:text-[#1A1A2E] bg-white border border-[#E8E8E8] px-2.5 py-1 rounded-[6px] shrink-0 transition-colors hidden sm:block"
  >
          {isWireframeFrameMode ? "\u26F6 Fullscreen" : "\u22A1 Frame Mode"}
        </button>
      </div>

      {children}
    </div>;
};
export {
  BrowserFrame
};
