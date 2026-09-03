import { Modal } from "../common/Modal";
import { StatusBadge } from "../common/StatusBadge";
import { formatCurrency } from "../../utils/formatters";
const GroupDetailModal = ({ group, isOpen, onClose }) => {
  if (!group) return null;
  return <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={`Group Monitoring: ${group.id}`}
    subtitle={`Trip ${group.tripId} \xB7 ${group.type} Group`}
    maxWidth="xl"
    footer={<button
      type="button"
      onClick={onClose}
      className="px-4 py-2 text-[13px] font-semibold border border-[#E8E8E8] rounded-[8px] bg-white text-[#4A4A5A] hover:bg-[#F9FAFB]"
    >
          Close
        </button>}
  >
      {
    /* Overview Cards */
  }
      <div className="grid grid-cols-4 gap-2.5 text-center">
        <div className="p-3 bg-[#FAFAFA] rounded-[8px] border border-[#E8E8E8]">
          <div className="text-[11px] text-[#8A8A9A]">Booker</div>
          <div className="text-[14px] font-bold text-[#1A1A2E] mt-0.5">{group.bookerName}</div>
        </div>
        <div className="p-3 bg-[#FAFAFA] rounded-[8px] border border-[#E8E8E8]">
          <div className="text-[11px] text-[#8A8A9A]">Vehicle</div>
          <div className="text-[14px] font-bold text-[#3AAFA9] mt-0.5">{group.vehicleSuggestion}</div>
        </div>
        <div className="p-3 bg-[#FAFAFA] rounded-[8px] border border-[#E8E8E8]">
          <div className="text-[11px] text-[#8A8A9A]">Total Fare</div>
          <div className="text-[14px] font-bold text-[#2B8A85] mt-0.5">
            {formatCurrency(group.fare)} ({group.fareType})
          </div>
        </div>
        <div className="p-3 bg-[#FAFAFA] rounded-[8px] border border-[#E8E8E8]">
          <div className="text-[11px] text-[#8A8A9A]">Capacity</div>
          <div className="text-[14px] font-bold text-[#1A1A2E] mt-0.5">{group.capacity} Riders</div>
        </div>
      </div>

      {
    /* Booking State Notice */
  }
      <div className="p-3 bg-white rounded-[8px] border border-[#E8E8E8] flex items-center justify-between text-[12px]">
        <div>
          <span className="text-[#8A8A9A]">Cab Booking State:</span>{" "}
          <strong className="text-[#1A1A2E]">{group.bookingStatus}</strong>
        </div>
        <StatusBadge label={group.status} />
      </div>

      {
    /* Riders Fare Share & Payment Table */
  }
      <div>
        <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#8A8A9A] mb-2">
          Rider Coordination & Fare Breakdown
        </h4>
        <div className="bg-white rounded-[8px] border border-[#E8E8E8] overflow-hidden">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-[#FAFAFA] border-b border-[#E8E8E8] text-[#8A8A9A] font-semibold">
              <tr>
                <th className="p-2.5">Rider</th>
                <th className="p-2.5">Role</th>
                <th className="p-2.5">Payment Handle</th>
                <th className="p-2.5">Share Amount</th>
                <th className="p-2.5">Payment Status</th>
              </tr>
            </thead>
            <tbody>
              {(group.riders || []).map((r) => <tr key={r.userId} className="border-b border-[#F5F5F5] last:border-b-0">
                  <td className="p-2.5 font-medium text-[#1A1A2E]">{r.name}</td>
                  <td className="p-2.5">
                    {r.isBooker ? <span className="px-1.5 py-0.5 rounded bg-[#E8F6F5] text-[#2B8A85] font-bold text-[10px]">
                        BOOKER
                      </span> : <span className="text-[#8A8A9A]">Rider</span>}
                  </td>
                  <td className="p-2.5 text-[#4A4A5A]">{r.paymentHandle || "\u2014"}</td>
                  <td className="p-2.5 font-semibold text-[#1A1A2E]">{formatCurrency(r.shareAmount)}</td>
                  <td className="p-2.5">
                    <StatusBadge label={r.paymentStatus} />
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </div>

      {
    /* Real-Time Chat Log Inspection */
  }
      <div>
        <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#8A8A9A] mb-2">
          Group Chat Log Inspection ({group.chatMessages?.length || 0} messages)
        </h4>
        <div className="bg-[#FAFAFA] rounded-[8px] border border-[#E8E8E8] p-3 max-h-40 overflow-y-auto space-y-2">
          {group.chatMessages && group.chatMessages.length > 0 ? group.chatMessages.map((msg) => <div key={msg.id} className="text-[12px]">
                <div className="flex items-center gap-2">
                  <strong className="text-[#1A1A2E]">{msg.senderName}</strong>
                  <span className="text-[10px] text-[#8A8A9A]">{msg.timestamp}</span>
                </div>
                <p className="text-[#4A4A5A] bg-white p-2 rounded border border-[#E8E8E8]/60 mt-1">
                  {msg.content}
                </p>
              </div>) : <p className="text-[12px] text-[#8A8A9A]">No chat messages recorded.</p>}
        </div>
      </div>

      {
    /* Group Timeline */
  }
      {group.timeline && group.timeline.length > 0 && <div className="border-t border-[#E8E8E8] pt-3">
          <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#8A8A9A] mb-2">
            Timeline & Lifecycle Events
          </h4>
          <div className="space-y-1.5 text-[12px]">
            {group.timeline.map((item) => <div key={item.id} className="flex items-start gap-2">
                <span className="text-[#3AAFA9] font-bold">•</span>
                <div>
                  <span className="text-[#8A8A9A] text-[11px] mr-1.5">{item.timestamp}:</span>
                  <strong className="text-[#1A1A2E]">{item.title}</strong> —{" "}
                  <span className="text-[#4A4A5A]">{item.description}</span>
                </div>
              </div>)}
          </div>
        </div>}
    </Modal>;
};
export {
  GroupDetailModal
};
