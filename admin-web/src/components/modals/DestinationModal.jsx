import { useState, useEffect } from "react";
import { Modal } from "../common/Modal";
const DestinationModal = ({
  isOpen,
  onClose,
  onSave,
  initialDestination
}) => {
  const [schoolName, setSchoolName] = useState("UMich");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [terminalsStr, setTerminalsStr] = useState("McNamara, North");
  const [directions, setDirections] = useState("both");
  const [status, setStatus] = useState("Active");
  useEffect(() => {
    if (initialDestination) {
      setSchoolName(initialDestination.schoolName);
      setName(initialDestination.name);
      setCode(initialDestination.code);
      setTerminalsStr(initialDestination.terminals.join(", "));
      setDirections(initialDestination.directions);
      setStatus(initialDestination.status);
    } else {
      setSchoolName("UMich");
      setName("");
      setCode("");
      setTerminalsStr("McNamara, North");
      setDirections("both");
      setStatus("Active");
    }
  }, [initialDestination, isOpen]);
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !code) {
      alert("Please fill in destination name and IATA code.");
      return;
    }
    const terminals = terminalsStr.split(",").map((t) => t.trim()).filter(Boolean);
    onSave({
      schoolId: "sch_umich",
      schoolName,
      name,
      code: code.toUpperCase(),
      terminals: terminals.length > 0 ? terminals : ["Main Terminal"],
      directions,
      status
    });
    onClose();
  };
  return <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={initialDestination ? `Edit Destination: ${initialDestination.code}` : "Add Destination Airport"}
    subtitle="Configured airport destinations and terminal pickup points"
    maxWidth="md"
  >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-semibold text-[#4A4A5A] mb-1">Affiliated School</label>
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
            <label className="block text-[12px] font-semibold text-[#4A4A5A] mb-1">Airport Code (IATA) *</label>
            <input
    type="text"
    required
    maxLength={4}
    value={code}
    onChange={(e) => setCode(e.target.value.toUpperCase())}
    placeholder="e.g. DTW"
    className="w-full px-3 py-2 text-[13px] border border-[#E8E8E8] rounded-[8px] focus:border-[#3AAFA9] focus:outline-none uppercase font-mono"
  />
          </div>
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-[#4A4A5A] mb-1">Airport Full Name *</label>
          <input
    type="text"
    required
    value={name}
    onChange={(e) => setName(e.target.value)}
    placeholder="e.g. Detroit Metro Airport"
    className="w-full px-3 py-2 text-[13px] border border-[#E8E8E8] rounded-[8px] focus:border-[#3AAFA9] focus:outline-none"
  />
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-[#4A4A5A] mb-1">
            Airport Terminals (comma separated)
          </label>
          <input
    type="text"
    value={terminalsStr}
    onChange={(e) => setTerminalsStr(e.target.value)}
    placeholder="McNamara, North"
    className="w-full px-3 py-2 text-[13px] border border-[#E8E8E8] rounded-[8px] focus:border-[#3AAFA9] focus:outline-none"
  />
          <p className="text-[11px] text-[#8A8A9A] mt-1">
            For return rides (DTW → Campus), students will select their arrival terminal.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-semibold text-[#4A4A5A] mb-1">Directions Allowed</label>
            <select
    value={directions}
    onChange={(e) => setDirections(e.target.value)}
    className="w-full px-3 py-2 text-[13px] border border-[#E8E8E8] rounded-[8px] bg-white focus:border-[#3AAFA9] focus:outline-none"
  >
              <option value="both">Both (To + From Airport)</option>
              <option value="to_airport">Campus → Airport Only</option>
              <option value="from_airport">Airport → Campus Only</option>
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-[#4A4A5A] mb-1">Status</label>
            <select
    value={status}
    onChange={(e) => setStatus(e.target.value)}
    className="w-full px-3 py-2 text-[13px] border border-[#E8E8E8] rounded-[8px] bg-white focus:border-[#3AAFA9] focus:outline-none"
  >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
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
            Save Destination
          </button>
        </div>
      </form>
    </Modal>;
};
export {
  DestinationModal
};
