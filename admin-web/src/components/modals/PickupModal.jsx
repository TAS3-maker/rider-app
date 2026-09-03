import { useState, useEffect } from "react";
import { Modal } from "../common/Modal";
const PickupModal = ({
  isOpen,
  onClose,
  onSave,
  initialPickup
}) => {
  const [schoolName, setSchoolName] = useState("UMich");
  const [name, setName] = useState("");
  const [area, setArea] = useState("Campus");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState("Active");
  const [notes, setNotes] = useState("");
  useEffect(() => {
    if (initialPickup) {
      setSchoolName(initialPickup.schoolName);
      setName(initialPickup.name);
      setArea(initialPickup.area);
      setAddress(initialPickup.address);
      setStatus(initialPickup.status);
      setNotes(initialPickup.notes || "");
    } else {
      setSchoolName("UMich");
      setName("");
      setArea("Campus");
      setAddress("");
      setStatus("Active");
      setNotes("");
    }
  }, [initialPickup, isOpen]);
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !address) {
      alert("Please fill in location name and physical address.");
      return;
    }
    onSave({
      schoolId: "sch_umich",
      schoolName,
      name,
      area,
      address,
      status,
      notes
    });
    onClose();
  };
  return <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={initialPickup ? `Edit Pickup Location: ${initialPickup.name}` : "Add Campus Pickup Location"}
    subtitle="Preset campus pickup points for shared pickup coordination"
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
            <label className="block text-[12px] font-semibold text-[#4A4A5A] mb-1">Location Name *</label>
            <input
    type="text"
    required
    value={name}
    onChange={(e) => setName(e.target.value)}
    placeholder="e.g. Michigan Union"
    className="w-full px-3 py-2 text-[13px] border border-[#E8E8E8] rounded-[8px] focus:border-[#3AAFA9] focus:outline-none"
  />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-semibold text-[#4A4A5A] mb-1">Campus Area</label>
            <select
    value={area}
    onChange={(e) => setArea(e.target.value)}
    className="w-full px-3 py-2 text-[13px] border border-[#E8E8E8] rounded-[8px] bg-white focus:border-[#3AAFA9] focus:outline-none"
  >
              <option value="Campus">Campus (Central)</option>
              <option value="North">North Campus</option>
              <option value="Off-campus">Off-campus / South</option>
              <option value="Other">Other Area</option>
            </select>
            <p className="text-[10px] text-[#8A8A9A] mt-1">Area is informational only on ride cards.</p>
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

        <div>
          <label className="block text-[12px] font-semibold text-[#4A4A5A] mb-1">Physical Street Address *</label>
          <input
    type="text"
    required
    value={address}
    onChange={(e) => setAddress(e.target.value)}
    placeholder="e.g. 530 S State St, Ann Arbor, MI"
    className="w-full px-3 py-2 text-[13px] border border-[#E8E8E8] rounded-[8px] focus:border-[#3AAFA9] focus:outline-none"
  />
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-[#4A4A5A] mb-1">Pickup Instructions & Notes</label>
          <input
    type="text"
    value={notes}
    onChange={(e) => setNotes(e.target.value)}
    placeholder="e.g. Wait near the flagpole in front loop"
    className="w-full px-3 py-2 text-[13px] border border-[#E8E8E8] rounded-[8px] focus:border-[#3AAFA9] focus:outline-none"
  />
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
            Save Location
          </button>
        </div>
      </form>
    </Modal>;
};
export {
  PickupModal
};
