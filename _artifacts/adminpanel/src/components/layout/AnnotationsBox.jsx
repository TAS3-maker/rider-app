import { useLocation } from "react-router-dom";
import { WIREFRAME_ANNOTATIONS, WIREFRAME_SCREENS } from "../../constants";
import { useApp } from "../../context/AppContext";
const AnnotationsBox = () => {
  const location = useLocation();
  const { showAnnotations, toggleAnnotations } = useApp();
  const currentScreen = WIREFRAME_SCREENS.find((s) => {
    if (s.path === "/schools" && location.pathname === "/schools/add") return true;
    return s.path === location.pathname;
  }) || WIREFRAME_SCREENS[0];
  const annotation = WIREFRAME_ANNOTATIONS[currentScreen.id];
  if (!showAnnotations || !annotation) return null;
  return <div
    className="max-w-[1100px] mx-auto mt-4 bg-[#FFF9E6] border-l-3 border-[#F5C842] p-3.5 sm:p-4 rounded-r-[8px] text-[12px] text-[#666666] leading-relaxed shadow-xs"
    role="region"
    aria-label="Screen Specifications & Notes"
  >
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-[13px] font-bold text-[#333333] flex items-center gap-1.5">
          <span>💡</span> {annotation.title} — Specification & Business Notes
        </h4>
        <button
    type="button"
    onClick={toggleAnnotations}
    className="text-[#999999] hover:text-[#333333] text-[11px] font-semibold"
    aria-label="Hide notes"
  >
          Hide
        </button>
      </div>
      <p>{annotation.notes}</p>
    </div>;
};
export {
  AnnotationsBox
};
