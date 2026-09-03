import { Modal } from "../common/Modal";
import { StatusBadge } from "../common/StatusBadge";
const EventDetailModal = ({ event, isOpen, onClose }) => {
  if (!event) return null;
  return <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="Audit Event Detail"
    subtitle={`ID: ${event.id} \xB7 Source: ${event.source}`}
    maxWidth="md"
    footer={<button
      type="button"
      onClick={onClose}
      className="px-4 py-2 text-[13px] font-semibold border border-[#E8E8E8] rounded-[8px] bg-white text-[#4A4A5A] hover:bg-[#F9FAFB]"
    >
          Close
        </button>}
  >
      <div className="space-y-3 text-[13px]">
        <div className="flex items-center justify-between p-3 bg-[#FAFAFA] rounded-[8px] border border-[#E8E8E8]">
          <div>
            <div className="text-[11px] text-[#8A8A9A]">Event Type</div>
            <StatusBadge label={event.eventType} />
          </div>
          <div className="text-right">
            <div className="text-[11px] text-[#8A8A9A]">Timestamp</div>
            <strong className="text-[#1A1A2E]">{event.timestamp}</strong>
          </div>
        </div>

        <div className="p-3 bg-white rounded-[8px] border border-[#E8E8E8] space-y-1.5">
          <div><span className="text-[#8A8A9A]">User Involved:</span> <strong className="text-[#1A1A2E]">{event.user}</strong></div>
          {event.tripId && <div><span className="text-[#8A8A9A]">Associated Trip:</span> <strong className="text-[#1A1A2E]">{event.tripId}</strong></div>}
          {event.groupId && <div><span className="text-[#8A8A9A]">Associated Group:</span> <strong className="text-[#1A1A2E]">{event.groupId}</strong></div>}
          <div><span className="text-[#8A8A9A]">Details:</span> <span className="text-[#1A1A2E] font-medium">{event.details}</span></div>
        </div>

        {event.metadata && <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#8A8A9A] mb-1.5">
              Event Metadata (JSON for ML Training & Audits)
            </div>
            <pre className="p-3 bg-[#1A1A2E] text-[#3AAFA9] rounded-[8px] text-[11px] font-mono overflow-x-auto">
              {JSON.stringify(event.metadata, null, 2)}
            </pre>
          </div>}
      </div>
    </Modal>;
};
export {
  EventDetailModal
};
