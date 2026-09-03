import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/common/PageHeader";
import { schoolService } from "../services/configServices";
import { useApp } from "../context/AppContext";
const AddSchoolPage = () => {
  const [name, setName] = useState("University of Michigan");
  const [shortName, setShortName] = useState("UMich");
  const [domain, setDomain] = useState("umich.edu");
  const [soloFareEstimate, setSoloFareEstimate] = useState("65");
  const [airportBufferMinutes, setAirportBufferMinutes] = useState("150");
  const [destination, setDestination] = useState("DTW");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { addToast, triggerRefresh } = useApp();
  const handleSave = async (e) => {
    e.preventDefault();
    if (!name || !domain) {
      addToast("Please enter school name and domain", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      await schoolService.addSchool({
        name,
        shortName: shortName || name.slice(0, 5),
        domain,
        soloFareEstimate: Number(soloFareEstimate) || 65,
        airportBufferMinutes: Number(airportBufferMinutes) || 150,
        status: "Live",
        destinations: [destination.toUpperCase() || "DTW"]
      });
      addToast(`University ${name} created successfully`, "success");
      triggerRefresh();
      navigate("/schools");
    } catch {
      addToast("Failed to save new school", "error");
    } finally {
      setIsSubmitting(false);
    }
  };
  return <div className="flex-1 flex flex-col">
      <PageHeader
    title="Add New School"
    subtitle="Configure a new university — no code changes required"
  />

      <div className="p-5 sm:p-7 max-w-3xl">
        <form onSubmit={handleSave}>
          <div className="bg-white rounded-[10px] p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-[#E8E8E8] mb-4">
            <h3 className="text-[15px] font-bold text-[#1A1A2E] mb-4">School Details</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-[12px] font-semibold text-[#4A4A5A] mb-1.5 block">
                  School Name
                </label>
                <input
    type="text"
    required
    value={name}
    onChange={(e) => setName(e.target.value)}
    placeholder="University of Michigan"
    className="w-full px-3.5 py-2.5 border-[1.5px] border-[#E8E8E8] rounded-[8px] text-[14px] text-[#1A1A2E] focus:border-[#3AAFA9] focus:outline-none transition-colors"
  />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-[#4A4A5A] mb-1.5 block">
                  Short Name
                </label>
                <input
    type="text"
    value={shortName}
    onChange={(e) => setShortName(e.target.value)}
    placeholder="UMich"
    className="w-full px-3.5 py-2.5 border-[1.5px] border-[#E8E8E8] rounded-[8px] text-[14px] text-[#1A1A2E] focus:border-[#3AAFA9] focus:outline-none transition-colors"
  />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-[12px] font-semibold text-[#4A4A5A] mb-1.5 block">
                  .edu Domain
                </label>
                <input
    type="text"
    required
    value={domain}
    onChange={(e) => setDomain(e.target.value)}
    placeholder="umich.edu"
    className="w-full px-3.5 py-2.5 border-[1.5px] border-[#E8E8E8] rounded-[8px] text-[14px] text-[#1A1A2E] focus:border-[#3AAFA9] focus:outline-none transition-colors"
  />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-[#4A4A5A] mb-1.5 block">
                  Solo Fare Estimate ($)
                </label>
                <input
    type="number"
    value={soloFareEstimate}
    onChange={(e) => setSoloFareEstimate(e.target.value)}
    placeholder="65"
    className="w-full px-3.5 py-2.5 border-[1.5px] border-[#E8E8E8] rounded-[8px] text-[14px] text-[#1A1A2E] focus:border-[#3AAFA9] focus:outline-none transition-colors"
  />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-[12px] font-semibold text-[#4A4A5A] mb-1.5 block">
                  Airport Buffer (minutes)
                </label>
                <input
    type="number"
    value={airportBufferMinutes}
    onChange={(e) => setAirportBufferMinutes(e.target.value)}
    placeholder="150"
    className="w-full px-3.5 py-2.5 border-[1.5px] border-[#E8E8E8] rounded-[8px] text-[14px] text-[#1A1A2E] focus:border-[#3AAFA9] focus:outline-none transition-colors"
  />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-[#4A4A5A] mb-1.5 block">
                  Default Destination Airport
                </label>
                <input
    type="text"
    value={destination}
    onChange={(e) => setDestination(e.target.value)}
    placeholder="DTW"
    className="w-full px-3.5 py-2.5 border-[1.5px] border-[#E8E8E8] rounded-[8px] text-[14px] text-[#1A1A2E] focus:border-[#3AAFA9] focus:outline-none transition-colors uppercase font-mono"
  />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
    type="submit"
    disabled={isSubmitting}
    className="px-5 py-2.5 bg-[#3AAFA9] text-white text-[13px] font-semibold rounded-[8px] hover:bg-[#2B8A85] transition-colors shadow-xs flex items-center gap-2"
  >
              {isSubmitting && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <span>Save School</span>
            </button>
            <button
    type="button"
    onClick={() => navigate("/schools")}
    className="px-5 py-2.5 bg-transparent border-[1.5px] border-[#E8E8E8] text-[#4A4A5A] text-[13px] font-semibold rounded-[8px] hover:bg-white transition-colors"
  >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>;
};
export {
  AddSchoolPage
};
