import { Modal } from "../common/Modal";
import { StatusBadge } from "../common/StatusBadge";
import { formatCurrency } from "../../utils/formatters";
const TripDetailModal = ({
  trip,
  isOpen,
  onClose,
  onUpdateStatus
}) => {
  if (!trip) return null;
  return <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={`Trip Details: ${trip.id}`}
    subtitle={`${trip.route} \xB7 ${trip.date}`}
    maxWidth="xl"
    footer={<>
          {onUpdateStatus && trip.status !== "Completed" && trip.status !== "Cancelled" && <div className="flex items-center gap-2 mr-auto">
              <span className="text-[12px] font-semibold text-[#8A8A9A]">Change Status:</span>
              <select
      className="text-[12px] border border-[#E8E8E8] rounded px-2 py-1 bg-white text-[#1A1A2E]"
      value={trip.status}
      onChange={(e) => onUpdateStatus(trip, e.target.value)}
    >
                <option value="Open">Open</option>
                <option value="Nearly Full">Nearly Full</option>
                <option value="Full">Full</option>
                <option value="Matched">Matched</option>
                <option value="Grouped">Grouped</option>
                <option value="Confirmed">Confirmed</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>}
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
    /* Route & Status Banner */
  }
      <div className="flex items-center justify-between p-4 rounded-[10px] bg-[#FAFAFA] border border-[#E8E8E8]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[16px] font-bold text-[#1A1A2E]">{trip.route}</h3>
            <StatusBadge label={trip.status} />
          </div>
          <p className="text-[13px] text-[#8A8A9A] mt-1">
            Travel Date: <strong>{trip.date}</strong> · Flight Time: <strong>{trip.flightTime}</strong>
          </p>
        </div>
        <div className="text-right">
          <div className="text-[18px] font-extrabold text-[#2B8A85]">
            {formatCurrency(trip.actualFare || trip.fareEstimate)}
          </div>
          <div className="text-[11px] text-[#8A8A9A]">
            {trip.actualFare ? "Actual Fare" : "Est. Total Fare"}
          </div>
        </div>
      </div>

      {
    /* Trip Information Grid */
  }
      <div className="grid grid-cols-2 gap-3 text-[12px]">
        <div className="p-3 bg-white rounded-[8px] border border-[#E8E8E8] space-y-1.5">
          <div><span className="text-[#8A8A9A]">Designated Booker:</span> <strong className="text-[#1A1A2E]">{trip.bookerName}</strong></div>
          <div><span className="text-[#8A8A9A]">Pickup Spot:</span> <strong className="text-[#1A1A2E]">{trip.pickupLocation}</strong></div>
          <div><span className="text-[#8A8A9A]">Rider Capacity:</span> <strong className="text-[#1A1A2E]">{trip.ridersCount} / {trip.maxCapacity} Seats Filled</strong></div>
        </div>

        <div className="p-3 bg-white rounded-[8px] border border-[#E8E8E8] space-y-1.5">
          <div><span className="text-[#8A8A9A]">Airport:</span> <strong className="text-[#1A1A2E]">{trip.destination} ({trip.airportCode})</strong></div>
          <div><span className="text-[#8A8A9A]">Terminal:</span> <strong className="text-[#1A1A2E]">{trip.terminal || "McNamara / North Terminal"}</strong></div>
          <div><span className="text-[#8A8A9A]">Flight Number:</span> <strong className="text-[#1A1A2E]">{trip.flightNumber || "Direct Booking"}</strong></div>
        </div>
      </div>

      {
    /* Luggage & Matching Notes */
  }
      <div className="p-3 bg-[#FAFAFA] rounded-[8px] border border-[#E8E8E8] text-[12px] space-y-1">
        <div><span className="text-[#8A8A9A]">Luggage Requirements:</span> <strong className="text-[#1A1A2E]">{trip.luggageInfo || "Standard luggage allowed"}</strong></div>
        {trip.notes && <div><span className="text-[#8A8A9A]">Trip Notes:</span> <span className="text-[#4A4A5A]">{trip.notes}</span></div>}
      </div>

      {
    /* Associated Group Link */
  }
      {trip.groupId && <div className="p-3 bg-[#E8F6F5] border border-[#3AAFA9]/30 rounded-[8px] flex items-center justify-between text-[12px]">
          <div>
            <span className="text-[#2B8A85] font-semibold">Active Ride Group: </span>
            <strong className="text-[#1A1A2E]">{trip.groupId}</strong>
          </div>
          <span className="text-[11px] text-[#2B8A85] font-bold">Matching Window: ±90 min</span>
        </div>}
    </Modal>;
};
export {
  TripDetailModal
};
