import { useState, useEffect } from "react";
import { PageHeader } from "../components/common/PageHeader";
import { DataTable } from "../components/common/DataTable";
import { StatusBadge } from "../components/common/StatusBadge";
import { BreakDateModal } from "../components/modals/BreakDateModal";
import { breakDateService } from "../services/configServices";
import { useApp } from "../context/AppContext";
const BreakCalendarPage = () => {
  const [breaks, setBreaks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBreak, setSelectedBreak] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { refreshKey, addToast } = useApp();
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    breakDateService.getBreakDates().then((data) => {
      if (isMounted) setBreaks(Array.isArray(data) ? data : []);
    }).catch(() => {
      if (isMounted) setBreaks([]);
      addToast("Failed to load break calendar", "error");
    }).finally(() => {
      if (isMounted) setIsLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [refreshKey, addToast]);
  const handleSaveBreak = async (data) => {
    try {
      if (selectedBreak) {
        const updated = await breakDateService.updateBreakDate(selectedBreak.id, data);
        setBreaks((prev) => prev.map((b) => b.id === updated.id ? updated : b));
        addToast(`Break ${updated.event} updated`, "success");
      } else {
        const created = await breakDateService.addBreakDate({
          ...data,
          notification14dSent: false,
          notification3dSent: false
        });
        setBreaks((prev) => [...prev, created]);
        addToast(`Break ${created.event} added`, "success");
      }
    } catch {
      addToast("Failed to save break date", "error");
    }
  };
  const columns = [
    {
      key: "schoolName",
      header: "School",
      sortable: true
    },
    {
      key: "event",
      header: "Event",
      sortable: true,
      render: (row) => <span className="font-semibold text-[#1A1A2E]">{row.event}</span>
    },
    {
      key: "dates",
      header: "Dates",
      render: (row) => <span className="font-medium text-[#1A1A2E]">
          {row.start} – {row.end}
        </span>
    },
    {
      key: "demand",
      header: "Demand",
      render: (row) => {
        const variant = row.demand === "Very High" ? "high" : row.demand === "High" ? "med" : "active";
        return <StatusBadge label={row.demand} variant={variant} />;
      }
    },
    {
      key: "notifSent",
      header: "Notif Sent",
      render: (row) => <span className="text-[#4A4A5A] text-[12px]">{row.notifSent}</span>
    },
    {
      key: "tripsCount",
      header: "Trips",
      sortable: true,
      render: (row) => <span className="font-semibold text-[#1A1A2E]">{row.tripsCount}</span>
    }
  ];
  return <div className="flex-1 flex flex-col">
      <PageHeader
    title="Break Calendar"
    subtitle="Upcoming academic breaks & travel demand"
    actions={<button
      type="button"
      onClick={() => {
        setSelectedBreak(null);
        setIsModalOpen(true);
      }}
      className="px-4 py-2 text-[13px] font-semibold bg-[#3AAFA9] text-white rounded-[8px] hover:bg-[#2B8A85] transition-colors shadow-xs"
    >
            + Add Break
          </button>}
  />

      <div className="p-5 sm:p-7">
        <DataTable
    columns={columns}
    data={breaks}
    keyExtractor={(b) => b.id}
    isLoading={isLoading}
    onRowClick={(b) => {
      setSelectedBreak(b);
      setIsModalOpen(true);
    }}
  />

        {
    /* Note box */
  }
        <div className="bg-[#FFF9E6] border-l-3 border-[#F5C842] p-4 rounded-r-[8px] text-[12px] text-[#666666] leading-relaxed">
          <h4 className="text-[13px] font-bold text-[#333333] mb-1">Developer Note</h4>
          Break dates drive automated push notification triggers (14d and 3d before break starts).
          High-demand flag changes card styling and promotes the break banner in the mobile app.
          Admin sets dates per school per semester.
        </div>
      </div>

      <BreakDateModal
    isOpen={isModalOpen}
    onClose={() => setIsModalOpen(false)}
    onSave={handleSaveBreak}
    initialBreak={selectedBreak}
  />
    </div>;
};
export {
  BreakCalendarPage
};
