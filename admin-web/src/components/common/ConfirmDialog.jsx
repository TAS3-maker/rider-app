import { Modal } from "./Modal";
const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  isLoading = false
}) => {
  return <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    maxWidth="sm"
    footer={<>
          <button
      type="button"
      onClick={onClose}
      disabled={isLoading}
      className="px-4 py-2 text-[13px] font-semibold border border-[#E8E8E8] rounded-[8px] bg-white text-[#4A4A5A] hover:bg-[#F9FAFB] transition-colors"
    >
            {cancelLabel}
          </button>
          <button
      type="button"
      onClick={() => {
        onConfirm();
      }}
      disabled={isLoading}
      className={`px-4 py-2 text-[13px] font-semibold text-white rounded-[8px] transition-colors flex items-center gap-2 ${variant === "danger" ? "bg-[#FF6B6B] hover:bg-[#E05353]" : "bg-[#3AAFA9] hover:bg-[#2B8A85]"}`}
    >
            {isLoading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            <span>{confirmLabel}</span>
          </button>
        </>}
  >
      <p className="text-[13px] text-[#4A4A5A] leading-relaxed">{message}</p>
    </Modal>;
};
export {
  ConfirmDialog
};
