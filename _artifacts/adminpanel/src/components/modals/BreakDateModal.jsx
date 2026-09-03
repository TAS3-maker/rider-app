import { useState, useEffect } from "react";
import { Modal } from "../common/Modal";
const BreakDateModal = ({
  isOpen,
  onClose,
  onSave,
  initialBreak
}) => {
  const [schoolName, setSchoolName] = useState("UMich");
  const [event, setEvent] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [demand, setDemand] = useState("Medium");
  useEffect(() => {
    if (initialBreak) {
      setSchoolName(initialBreak.schoolName);
      setEvent(initialBreak.event);
      setStart(initialBreak.start);
      setEnd(initialBreak.end);
      setDemand(initialBreak.demand);
    } else {
      setSchoolName("UMich");
      setEvent("");
      setStart("");
      setEnd("");
      setDemand("Medium");
    }
  }, [initialBreak, isOpen]);
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!event || !start || !end) {
      alert("Please fill in event title, start date and end date.");
      return;
    }
    onSave({
      schoolId: "sch_umich",
      schoolName,
      event,
      start,
      end,
      demand,
      notifSent: "Scheduled: 14d & 3d prior",
      tripsCount: 0
    });
    onClose();
  };
  return <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={initialBreak ? `Edit Break: ${initialBreak.event}` : "Add University Travel Break"}
    subtitle="Configure academic travel dates and automated push notification schedule"
    maxWidth="md"
  >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-semibold text-[#4A4A5A] mb-1">School</label>
            <select
    value={schoolName}
    onChange={(e) => setSchoolName(e.target.value)}
    className="w-full px-3 py-2 text-[13px] border border-[#E8E8E8] rounded-[8px] bg-white focus:border-[#3AAFA9] focus:outline-none"
  >
              <option value="UMich">University of Michigan (UMich)</option>
              <option value="MSU">Michigan State University (MSU)</option>
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-[#4A4A5A] mb-1">Expected Demand</label>
            <select
    value={demand}
    onChange={(e) => setDemand(e.target.value)}
    className="w-full px-3 py-2 text-[13px] border border-[#E8E8E8] rounded-[8px] bg-white focus:border-[#3AAFA9] focus:outline-none"
  >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Very High">Very High</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-[#4A4A5A] mb-1">Event / Break Name *</label>
          <input
    type="text"
    required
    value={event}
    onChange={(e) => setEvent(e.target.value)}
    placeholder="e.g. Thanksgiving Recess"
    className="w-full px-3 py-2 text-[13px] border border-[#E8E8E8] rounded-[8px] focus:border-[#3AAFA9] focus:outline-none"
  />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-semibold text-[#4A4A5A] mb-1">Start Date *</label>
            <input
    type="text"
    required
    value={start}
    onChange={(e) => setStart(e.target.value)}
    placeholder="e.g. Nov 25"
    className="w-full px-3 py-2 text-[13px] border border-[#E8E8E8] rounded-[8px] focus:border-[#3AAFA9] focus:outline-none"
  />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-[#4A4A5A] mb-1">End Date *</label>
            <input
    type="text"
    required
    value={end}
    onChange={(e) => setEnd(e.target.value)}
    placeholder="e.g. Nov 27"
    className="w-full px-3 py-2 text-[13px] border border-[#E8E8E8] rounded-[8px] focus:border-[#3AAFA9] focus:outline-none"
  />
          </div>
        </div>

        <div className="p-3 bg-[#FFF9E6] border-l-2 border-[#F5C842] rounded-[4px] text-[12px] text-[#666]">
          <strong>Automated Triggers:</strong> Saving this break automatically schedules push reminders to all registered school students at <strong>14 days</strong> and <strong>3 days</strong> before departure.
        </div>

        <div className="pt-3 border-t border-[#E8E8E8] flex justify-end gap-2">
          <button
    type="button"
    onClick={onClose}
    className="px-4 py-2 text-[13px] font-semibold border border-[#E8E8E8] rounded-[8px] bg-white text-[#4A4A5A] hover:bg-[#F9FAFB]"
  >
            Cancel
          </button>
          <button
    type="submit"
    className="px-4 py-2 text-[13px] font-semibold bg-[#3AAFA9] text-white rounded-[8px] hover:bg-[#2B8A85] transition-colors shadow-xs"
  >
            Save Break Date
          </button>
        </div>
      </form>
    </Modal>;
};
export {
  BreakDateModal
};
