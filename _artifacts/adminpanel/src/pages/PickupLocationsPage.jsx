import { useState, useEffect } from "react";
import { PageHeader } from "../components/common/PageHeader";
import { DataTable } from "../components/common/DataTable";
import { StatusBadge } from "../components/common/StatusBadge";
import { PickupModal } from "../components/modals/PickupModal";
import { pickupLocationService } from "../services/configServices";
import { useApp } from "../context/AppContext";
const PickupLocationsPage = () => {
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { refreshKey, addToast } = useApp();
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    pickupLocationService.getPickupLocations().then((data) => {
      if (isMounted) setLocations(Array.isArray(data) ? data : []);
    }).catch(() => {
      if (isMounted) setLocations([]);
      addToast("Failed to load pickup locations", "error");
    }).finally(() => {
      if (isMounted) setIsLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [refreshKey, addToast]);
  const handleSavePickup = async (data) => {
    try {
      if (selectedPickup) {
        const updated = await pickupLocationService.updatePickupLocation(selectedPickup.id, data);
        setLocations((prev) => prev.map((p) => p.id === updated.id ? updated : p));
        addToast(`Pickup location ${updated.name} updated`, "success");
      } else {
        const created = await pickupLocationService.addPickupLocation(data);
        setLocations((prev) => [...prev, created]);
        addToast(`Pickup location ${created.name} added`, "success");
      }
    } catch {
      addToast("Failed to save pickup location", "error");
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
      header: "Location",
      sortable: true,
      render: (row) => <span className="font-semibold text-[#1A1A2E]">{row.name}</span>
    },
    {
      key: "area",
      header: "Area",
      render: (row) => <StatusBadge
        label={row.area}
        variant={row.area === "Campus" ? "active" : row.area === "North" ? "med" : "inactive"}
      />
    },
    {
      key: "address",
      header: "Address",
      render: (row) => <span className="text-[#4A4A5A]">{row.address}</span>
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge
        label={row.status}
        variant={row.status === "Active" ? "active" : "inactive"}
      />
    }
  ];
  return <div className="flex-1 flex flex-col">
      <PageHeader
    title="Pickup Locations"
    subtitle="Configured pickup spots per school"
    actions={<button
      type="button"
      onClick={() => {
        setSelectedPickup(null);
        setIsModalOpen(true);
      }}
      className="px-4 py-2 text-[13px] font-semibold bg-[#3AAFA9] text-white rounded-[8px] hover:bg-[#2B8A85] transition-colors shadow-xs"
    >
            + Add Location
          </button>}
  />

      <div className="p-5 sm:p-7">
        <DataTable
    columns={columns}
    data={locations}
    keyExtractor={(l) => l.id}
    isLoading={isLoading}
    onRowClick={(l) => {
      setSelectedPickup(l);
      setIsModalOpen(true);
    }}
  />

        {
    /* Note Box */
  }
        <div className="bg-[#FFF9E6] border-l-3 border-[#F5C842] p-4 rounded-r-[8px] text-[12px] text-[#666666] leading-relaxed">
          <h4 className="text-[13px] font-bold text-[#333333] mb-1">Developer Note</h4>
          Pickup spots are suggestions — riders in a group coordinate their actual pickup point. Area tag
          helps match riders who live near each other. Free text custom pickup is always supported.
        </div>
      </div>

      <PickupModal
    isOpen={isModalOpen}
    onClose={() => setIsModalOpen(false)}
    onSave={handleSavePickup}
    initialPickup={selectedPickup}
  />
    </div>;
};
export {
  PickupLocationsPage
};
