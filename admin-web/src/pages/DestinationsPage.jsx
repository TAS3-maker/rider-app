import { useState, useEffect } from "react";
import { PageHeader } from "../components/common/PageHeader";
import { DataTable } from "../components/common/DataTable";
import { DestinationModal } from "../components/modals/DestinationModal";
import { destinationService } from "../services/configServices";
import { useApp } from "../context/AppContext";
const DestinationsPage = () => {
  const [destinations, setDestinations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { refreshKey, addToast } = useApp();
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    destinationService.getDestinations().then((data) => {
      if (isMounted) setDestinations(Array.isArray(data) ? data : []);
    }).catch(() => {
      if (isMounted) setDestinations([]);
      addToast("Failed to load destinations", "error");
    }).finally(() => {
      if (isMounted) setIsLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [refreshKey, addToast]);
  const handleSaveDestination = async (data) => {
    try {
      if (selectedDestination) {
        const updated = await destinationService.updateDestination(selectedDestination.id, data);
        setDestinations((prev) => prev.map((d) => d.id === updated.id ? updated : d));
        addToast(`Destination ${updated.code} updated`, "success");
      } else {
        const created = await destinationService.addDestination(data);
        setDestinations((prev) => [...prev, created]);
        addToast(`Destination ${created.name} (${created.code}) added`, "success");
      }
    } catch {
      addToast("Failed to save destination", "error");
    }
  };
  const columns = [
    {
      key: "schoolName",
      header: "School",
      sortable: true
    },
    {
      key: "name",
      header: "Destination",
      sortable: true,
      render: (row) => <span className="font-medium text-[#1A1A2E]">{row.name}</span>
    },
    {
      key: "code",
      header: "Code",
      sortable: true,
      render: (row) => <span className="font-mono font-bold text-[#3AAFA9]">{row.code}</span>
    },
    {
      key: "terminals",
      header: "Terminals",
      render: (row) => <span className="text-[#4A4A5A]">{row.terminals.join(", ")}</span>
    },
    {
      key: "directions",
      header: "Directions",
      render: (row) => <span className="text-[#1A1A2E] font-medium">
          {row.directions === "both" ? "Both (to + from)" : row.directions === "to_airport" ? "Campus \u2192 Airport Only" : "Airport \u2192 Campus Only"}
        </span>
    }
  ];
  return <div className="flex-1 flex flex-col">
      <PageHeader
    title="Destinations"
    subtitle="Configured airport destinations per school"
    actions={<button
      type="button"
      onClick={() => {
        setSelectedDestination(null);
        setIsModalOpen(true);
      }}
      className="px-4 py-2 text-[13px] font-semibold bg-[#3AAFA9] text-white rounded-[8px] hover:bg-[#2B8A85] transition-colors shadow-xs"
    >
            + Add Destination
          </button>}
  />

      <div className="p-5 sm:p-7">
        <DataTable
    columns={columns}
    data={destinations}
    keyExtractor={(d) => d.id}
    isLoading={isLoading}
    onRowClick={(d) => {
      setSelectedDestination(d);
      setIsModalOpen(true);
    }}
  />

        {
    /* Developer Note matching wireframe */
  }
        <div className="bg-[#FFF9E6] border-l-3 border-[#F5C842] p-4 rounded-r-[8px] text-[12px] text-[#666666] leading-relaxed">
          <h4 className="text-[13px] font-bold text-[#333333] mb-1">Developer Note</h4>
          Adding a destination = adding a record to the school's destinations array. Terminal list is
          configurable per destination. Directions (to_airport, from_airport) are toggles. Zero code
          changes for new destinations.
        </div>
      </div>

      <DestinationModal
    isOpen={isModalOpen}
    onClose={() => setIsModalOpen(false)}
    onSave={handleSaveDestination}
    initialDestination={selectedDestination}
  />
    </div>;
};
export {
  DestinationsPage
};
