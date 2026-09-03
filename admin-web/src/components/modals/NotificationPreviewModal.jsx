import { Modal } from "../common/Modal";
const NotificationPreviewModal = ({
  isOpen,
  onClose,
  title,
  message,
  audience
}) => {
  return <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="Mobile Push Notification Preview"
    subtitle={`Target Audience: ${audience}`}
    maxWidth="sm"
    footer={<button
      type="button"
      onClick={onClose}
      className="px-4 py-2 text-[13px] font-semibold bg-[#3AAFA9] text-white rounded-[8px] hover:bg-[#2B8A85]"
    >
          Close Preview
        </button>}
  >
      <div className="flex flex-col items-center py-2">
        {
    /* Mock iPhone lock screen notification card */
  }
        <div className="w-full bg-[#1A1A2E] p-4 rounded-[16px] text-white shadow-xl border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] text-white/50 mb-2">
            <div className="flex items-center gap-1.5 font-semibold text-white/80">
              <span className="w-4 h-4 rounded bg-[#3AAFA9] flex items-center justify-center text-[10px] text-white">
                ✦
              </span>
              <span>RIDEPACT</span>
            </div>
            <span>NOW</span>
          </div>

          <div className="text-[13px] font-bold text-white mb-1">
            {title || "\u{1F525} Thanksgiving rides are filling up!"}
          </div>
          <div className="text-[12px] text-white/80 leading-relaxed">
            {message || "47 students are looking for rides on Nov 24. Post your trip now and save 60% vs. riding solo."}
          </div>

          <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-white/40">
            <span>Swipe to open RidePact</span>
            <span>UMich Campus</span>
          </div>
        </div>
      </div>
    </Modal>;
};
export {
  NotificationPreviewModal
};
