import { useApp } from "../../context/AppContext";
const ToastContainer = () => {
  const { toasts, removeToast } = useApp();
  if (toasts.length === 0) return null;
  return <div
    className="fixed bottom-5 right-5 z-60 flex flex-col gap-2 pointer-events-none max-w-sm w-full"
    role="region"
    aria-live="polite"
    aria-label="Notifications"
  >
      {toasts.map((t) => <div
    key={t.id}
    className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-[8px] shadow-lg border text-[13px] font-medium transition-all ${t.type === "success" ? "bg-[#E8F6F5] text-[#2B8A85] border-[#3AAFA9]/30" : t.type === "error" ? "bg-[#FFF0F0] text-[#D32F2F] border-[#FF6B6B]/30" : "bg-white text-[#1A1A2E] border-[#E8E8E8]"}`}
  >
          <div className="flex items-center gap-2">
            <span>{t.type === "success" ? "\u2713" : t.type === "error" ? "\u26A0" : "\u2139"}</span>
            <span>{t.message}</span>
          </div>
          <button
    type="button"
    onClick={() => removeToast(t.id)}
    className="text-current opacity-60 hover:opacity-100 p-1"
    aria-label="Dismiss notification"
  >
            ✕
          </button>
        </div>)}
    </div>;
};
export {
  ToastContainer
};
