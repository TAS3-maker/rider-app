import { useState, useEffect } from "react";
import { Modal } from "../common/Modal";
const SchoolModal = ({
  isOpen,
  onClose,
  onSave,
  initialSchool
}) => {
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [domain, setDomain] = useState("");
  const [soloFareEstimate, setSoloFareEstimate] = useState(65);
  const [airportBufferMinutes, setAirportBufferMinutes] = useState(150);
  const [status, setStatus] = useState("Live");
  const [destinationCode, setDestinationCode] = useState("DTW");
  const [address, setAddress] = useState("");
  useEffect(() => {
    if (initialSchool) {
      setName(initialSchool.name);
      setShortName(initialSchool.shortName);
      setDomain(initialSchool.domain);
      setSoloFareEstimate(initialSchool.soloFareEstimate);
      setAirportBufferMinutes(initialSchool.airportBufferMinutes);
      setStatus(initialSchool.status);
      setDestinationCode(initialSchool.destinations[0] || "DTW");
      setAddress(initialSchool.address || "");
    } else {
      setName("");
      setShortName("");
      setDomain("");
      setSoloFareEstimate(65);
      setAirportBufferMinutes(150);
      setStatus("Live");
      setDestinationCode("DTW");
      setAddress("");
    }
  }, [initialSchool, isOpen]);
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !domain) {
      alert("Please provide school name and domain.");
      return;
    }
    onSave({
      name,
      shortName: shortName || name.slice(0, 5),
      domain,
      soloFareEstimate: Number(soloFareEstimate) || 65,
      airportBufferMinutes: Number(airportBufferMinutes) || 150,
      status,
      destinations: [destinationCode],
      address
    });
    onClose();
  };
  return <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={initialSchool ? `Edit School: ${initialSchool.name}` : "Add New University / School"}
    subtitle="Adding a school is a database record — zero code changes required"
    maxWidth="md"
  >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-semibold text-[#4A4A5A] mb-1">School Name *</label>
            <input
    type="text"
    required
    value={name}
    onChange={(e) => setName(e.target.value)}
    placeholder="e.g. University of Michigan"
    className="w-full px-3 py-2 text-[13px] border border-[#E8E8E8] rounded-[8px] focus:border-[#3AAFA9] focus:outline-none"
  />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-[#4A4A5A] mb-1">Short Name</label>
            <input
    type="text"
    value={shortName}
    onChange={(e) => setShortName(e.target.value)}
    placeholder="e.g. UMich"
    className="w-full px-3 py-2 text-[13px] border border-[#E8E8E8] rounded-[8px] focus:border-[#3AAFA9] focus:outline-none"
  />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-semibold text-[#4A4A5A] mb-1">.edu Domain *</label>
            <input
    type="text"
    required
    value={domain}
    onChange={(e) => setDomain(e.target.value)}
    placeholder="e.g. umich.edu"
    className="w-full px-3 py-2 text-[13px] border border-[#E8E8E8] rounded-[8px] focus:border-[#3AAFA9] focus:outline-none"
  />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-[#4A4A5A] mb-1">Solo Fare Estimate ($)</label>
            <input
    type="number"
    value={soloFareEstimate}
    onChange={(e) => setSoloFareEstimate(Number(e.target.value))}
    placeholder="65"
    className="w-full px-3 py-2 text-[13px] border border-[#E8E8E8] rounded-[8px] focus:border-[#3AAFA9] focus:outline-none"
  />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-semibold text-[#4A4A5A] mb-1">Airport Buffer (mins)</label>
            <input
    type="number"
    value={airportBufferMinutes}
    onChange={(e) => setAirportBufferMinutes(Number(e.target.value))}
    placeholder="150"
    className="w-full px-3 py-2 text-[13px] border border-[#E8E8E8] rounded-[8px] focus:border-[#3AAFA9] focus:outline-none"
  />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-[#4A4A5A] mb-1">Initial Status</label>
            <select
    value={status}
    onChange={(e) => setStatus(e.target.value)}
    className="w-full px-3 py-2 text-[13px] border border-[#E8E8E8] rounded-[8px] focus:border-[#3AAFA9] focus:outline-none bg-white"
  >
              <option value="Live">Live (Active to students)</option>
              <option value="Draft">Draft (Under configuration)</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-[#4A4A5A] mb-1">Primary Destination Airport Code</label>
          <input
    type="text"
    value={destinationCode}
    onChange={(e) => setDestinationCode(e.target.value.toUpperCase())}
    placeholder="e.g. DTW"
    className="w-full px-3 py-2 text-[13px] border border-[#E8E8E8] rounded-[8px] focus:border-[#3AAFA9] focus:outline-none"
  />
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-[#4A4A5A] mb-1">Campus Main Address</label>
          <input
    type="text"
    value={address}
    onChange={(e) => setAddress(e.target.value)}
    placeholder="e.g. 500 S State St, Ann Arbor, MI"
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
            Save School
          </button>
        </div>
      </form>
    </Modal>;
};
export {
  SchoolModal
};
