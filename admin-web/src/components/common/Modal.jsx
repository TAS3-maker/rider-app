import { useEffect, useRef } from "react";
const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "lg",
  footer
}) => {
  const modalRef = useRef(null);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
    "2xl": "max-w-4xl"
  };
  return <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
  >
      {
    /* Backdrop click */
  }
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div
    ref={modalRef}
    className={`relative w-full ${maxWidthClasses[maxWidth]} bg-white rounded-[12px] shadow-2xl border border-[#E8E8E8] flex flex-col max-h-[90vh] overflow-hidden z-10`}
  >
        {
    /* Modal Header */
  }
        <div className="px-6 py-4.5 border-b border-[#E8E8E8] flex items-center justify-between bg-[#FAFAFA]">
          <div>
            <h2 id="modal-title" className="text-[16px] font-bold text-[#1A1A2E]">
              {title}
            </h2>
            {subtitle && <p className="text-[12px] text-[#8A8A9A] mt-0.5">{subtitle}</p>}
          </div>
          <button
    type="button"
    onClick={onClose}
    className="w-8 h-8 rounded-full flex items-center justify-center text-[#8A8A9A] hover:text-[#1A1A2E] hover:bg-[#E8E8E8] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3AAFA9]"
    aria-label="Close modal"
  >
            ✕
          </button>
        </div>

        {
    /* Modal Body */
  }
        <div className="p-6 overflow-y-auto space-y-4 text-[13px] text-[#4A4A5A]">
          {children}
        </div>

        {
    /* Modal Footer */
  }
        {footer && <div className="px-6 py-4 border-t border-[#E8E8E8] bg-[#FAFAFA] flex items-center justify-end gap-2.5">
            {footer}
          </div>}
      </div>
    </div>;
};
export {
  Modal
};
