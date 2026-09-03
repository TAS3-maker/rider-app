import { Modal } from "../common/Modal";
import { StatusBadge } from "../common/StatusBadge";
import { formatRating } from "../../utils/formatters";
const UserDetailModal = ({
  user,
  isOpen,
  onClose,
  onToggleStatus
}) => {
  if (!user) return null;
  return <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={`User Profile: ${user.name}`}
    subtitle={`ID: ${user.id} \xB7 Registered ${user.joinedDate}`}
    maxWidth="xl"
    footer={<>
          {onToggleStatus && <button
      type="button"
      onClick={() => onToggleStatus(user)}
      className={`px-4 py-2 text-[13px] font-semibold rounded-[8px] transition-colors ${user.status === "active" ? "bg-[#FF6B6B] text-white hover:bg-[#E05353]" : "bg-[#3AAFA9] text-white hover:bg-[#2B8A85]"}`}
    >
              {user.status === "active" ? "Deactivate Account" : "Activate Account"}
            </button>}
          <button
      type="button"
      onClick={onClose}
      className="px-4 py-2 text-[13px] font-semibold border border-[#E8E8E8] rounded-[8px] bg-white text-[#4A4A5A] hover:bg-[#F9FAFB]"
    >
            Close
          </button>
        </>}
  >
      {
    /* Header Info */
  }
      <div className="flex items-start gap-4 p-4 rounded-[10px] bg-[#FAFAFA] border border-[#E8E8E8]">
        <img
    src={user.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"}
    alt={user.name}
    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-xs"
  />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[16px] font-bold text-[#1A1A2E]">{user.name}</h3>
            <StatusBadge label={user.status} />
            <StatusBadge label={user.verificationStatus} />
          </div>
          <p className="text-[13px] text-[#8A8A9A] mt-0.5">{user.email} · {user.phone}</p>
          <div className="flex items-center gap-4 mt-2 text-[12px] font-medium text-[#4A4A5A]">
            <span>University: <strong>{user.school}</strong></span>
            <span>Payment: <strong>{user.paymentHandle}</strong></span>
          </div>
        </div>
      </div>

      {
    /* Stats Grid */
  }
      <div className="grid grid-cols-4 gap-3 text-center">
        <div className="p-3 bg-white rounded-[8px] border border-[#E8E8E8]">
          <div className="text-[18px] font-extrabold text-[#1A1A2E]">{user.ridesCount}</div>
          <div className="text-[11px] text-[#8A8A9A] font-medium">Total Rides</div>
        </div>
        <div className="p-3 bg-white rounded-[8px] border border-[#E8E8E8]">
          <div className="text-[18px] font-extrabold text-[#2B8A85]">{user.completedRidesCount}</div>
          <div className="text-[11px] text-[#8A8A9A] font-medium">Completed</div>
        </div>
        <div className="p-3 bg-white rounded-[8px] border border-[#E8E8E8]">
          <div className="text-[18px] font-extrabold text-[#1A1A2E]">{formatRating(user.reliabilityRating)}</div>
          <div className="text-[11px] text-[#8A8A9A] font-medium">Reliability</div>
        </div>
        <div className="p-3 bg-white rounded-[8px] border border-[#E8E8E8]">
          <div className="text-[18px] font-extrabold text-[#1A1A2E]">{user.punctualityRating ? `${user.punctualityRating.toFixed(1)}/5` : "\u2014"}</div>
          <div className="text-[11px] text-[#8A8A9A] font-medium">Punctuality</div>
        </div>
      </div>

      {
    /* Preferences & Coordination info */
  }
      <div className="space-y-2 border-t border-[#E8E8E8] pt-3">
        <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#8A8A9A]">Ride & Payment Coordination</h4>
        <div className="grid grid-cols-2 gap-3 text-[12px]">
          <div className="p-2.5 bg-[#FAFAFA] rounded-[6px] border border-[#E8E8E8]">
            <span className="text-[#8A8A9A] block">Luggage Preference:</span>
            <strong className="text-[#1A1A2E]">{user.luggagePreference || "Standard Carry-on"}</strong>
          </div>
          <div className="p-2.5 bg-[#FAFAFA] rounded-[6px] border border-[#E8E8E8]">
            <span className="text-[#8A8A9A] block">Pickup Spot Preference:</span>
            <strong className="text-[#1A1A2E]">{user.pickupPreference || "Michigan Union"}</strong>
          </div>
        </div>
        {user.notes && <div className="p-2.5 bg-[#FFF9E6] border-l-2 border-[#F5C842] rounded-[4px] text-[12px] text-[#666]">
            <strong>Admin Note:</strong> {user.notes}
          </div>}
      </div>

      {
    /* Ratings Received */
  }
      <div className="border-t border-[#E8E8E8] pt-3">
        <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#8A8A9A] mb-2">
          Ratings Received ({user.ratingsReceived?.length || 0})
        </h4>
        {user.ratingsReceived && user.ratingsReceived.length > 0 ? <div className="space-y-2">
            {user.ratingsReceived.map((rat) => <div key={rat.id} className="p-2.5 bg-[#FAFAFA] rounded-[6px] border border-[#E8E8E8] text-[12px]">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#1A1A2E]">From: {rat.fromUser} ({rat.tripId})</span>
                  <span className="text-[#8A8A9A]">{rat.createdAt}</span>
                </div>
                <div className="flex items-center gap-3 my-1 font-medium text-[#2B8A85]">
                  <span>Reliability: ⭐ {rat.reliability}</span>
                  <span>Punctuality: ⭐ {rat.punctuality}</span>
                </div>
                <p className="text-[#4A4A5A] italic">"{rat.comment}"</p>
              </div>)}
          </div> : <p className="text-[12px] text-[#8A8A9A]">No student feedback recorded yet.</p>}
      </div>
    </Modal>;
};
export {
  UserDetailModal
};
