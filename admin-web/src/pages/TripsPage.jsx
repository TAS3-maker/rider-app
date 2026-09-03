import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "../components/common/PageHeader";
import { DataTable } from "../components/common/DataTable";
import { StatusBadge } from "../components/common/StatusBadge";
import { FilterDropdown } from "../components/common/FilterDropdown";
import { SearchInput } from "../components/common/SearchInput";
import { TripDetailModal } from "../components/modals/TripDetailModal";
import { tripService } from "../services/tripService";
import { exportToCsv } from "../utils/exportCsv";
import { useApp } from "../context/AppContext";
const TripsPage = () => {
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [directionFilter, setDirectionFilter] = useState("all");
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { refreshKey, addToast } = useApp();
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    tripService.getTrips({
      search: searchQuery,
      status: statusFilter,
      direction: directionFilter
    }).then((data) => {
      if (isMounted) setTrips(Array.isArray(data) ? data : []);
    }).catch(() => {
      if (isMounted) setTrips([]);
      addToast("Failed to load trips", "error");
    }).finally(() => {
      if (isMounted) setIsLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [searchQuery, statusFilter, directionFilter, refreshKey, addToast]);
  const activeCount = useMemo(
    () => (Array.isArray(trips) ? trips : []).filter((t) => t.status !== "Completed" && t.status !== "Cancelled").length,
    [trips]
  );
  const completedCount = useMemo(
    () => (Array.isArray(trips) ? trips : []).filter((t) => t.status === "Completed").length,
    [trips]
  );
  const cancelledCount = useMemo(
    () => (Array.isArray(trips) ? trips : []).filter((t) => t.status === "Cancelled").length,
    [trips]
  );
  const handleUpdateTripStatus = async (trip, newStatus) => {
    try {
      const updated = await tripService.updateTripStatus(trip.id, newStatus);
      setTrips((prev) => prev.map((t) => t.id === updated.id ? updated : t));
      setSelectedTrip(updated);
      addToast(`Trip ${updated.id} status updated to ${newStatus}`, "success");
    } catch {
      addToast("Failed to update trip status", "error");
    }
  };
  const handleExportCsv = () => {
    exportToCsv("ridepact_trips", trips, [
      { key: "id", header: "Trip ID" },
      { key: "route", header: "Route" },
      { key: "date", header: "Date" },
      { key: "flightTime", header: "Flight Time" },
      { key: "ridersCount", header: "Riders", formatter: (_, r) => `${r.ridersCount}/${r.maxCapacity}` },
      { key: "status", header: "Status" },
      { key: "bookerName", header: "Booker" },
      { key: "pickupLocation", header: "Pickup Spot" },
      { key: "fareEstimate", header: "Est Fare ($)" },
      { key: "actualFare", header: "Actual Fare ($)" }
    ]);
    addToast("Trips CSV exported successfully", "success");
  };
  const columns = [
    {
      key: "id",
      header: "Trip ID",
      sortable: true,
      render: (row) => <span className="font-mono font-semibold text-[#1A1A2E]">{row.id}</span>
    },
    {
      key: "route",
      header: "Route",
      sortable: true,
      render: (row) => <span className="font-medium text-[#1A1A2E]">{row.route}</span>
    },
    {
      key: "date",
      header: "Date",
      sortable: true
    },
    {
      key: "flightTime",
      header: "Flight",
      sortable: true,
      render: (row) => <span className="font-medium text-[#4A4A5A]">{row.flightTime}</span>
    },
    {
      key: "riders",
      header: "Riders",
      render: (row) => <span className="font-semibold text-[#1A1A2E]">
          {row.ridersCount}/{row.maxCapacity}
        </span>
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge label={row.status} />
    },
    {
      key: "bookerName",
      header: "Booker",
      render: (row) => <span className="text-[#1A1A2E]">{row.bookerName}</span>
    }
  ];
  return <div className="flex-1 flex flex-col">
      <PageHeader
    title="Trips"
    subtitle={`${activeCount} active \xB7 ${completedCount} completed \xB7 ${cancelledCount} cancelled`}
    actions={<div className="flex items-center gap-2 flex-wrap">
            <SearchInput
      value={searchQuery}
      onChange={setSearchQuery}
      placeholder="Search trips / booker..."
      className="w-[180px] sm:w-[220px]"
    />
            <FilterDropdown
      value={statusFilter}
      onChange={setStatusFilter}
      options={[
        { value: "all", label: "All statuses" },
        { value: "open", label: "Open" },
        { value: "nearly full", label: "Nearly Full" },
        { value: "full", label: "Full" },
        { value: "booked", label: "Booked" },
        { value: "completed", label: "Completed" },
        { value: "cancelled", label: "Cancelled" }
      ]}
      ariaLabel="Filter by trip status"
    />
            <FilterDropdown
      value={directionFilter}
      onChange={setDirectionFilter}
      options={[
        { value: "all", label: "All directions" },
        { value: "umich \u2192 dtw", label: "UMich \u2192 DTW" },
        { value: "dtw \u2192 umich", label: "DTW \u2192 UMich" }
      ]}
      ariaLabel="Filter by travel direction"
    />
            <button
      type="button"
      onClick={handleExportCsv}
      className="px-3.5 py-2 text-[13px] font-semibold border-[1.5px] border-[#E8E8E8] rounded-[8px] bg-white text-[#4A4A5A] hover:border-[#3AAFA9] hover:text-[#3AAFA9] transition-colors"
    >
              Export CSV
            </button>
          </div>}
  />

      <div className="p-5 sm:p-7">
        <DataTable
    columns={columns}
    data={trips}
    keyExtractor={(t) => t.id}
    isLoading={isLoading}
    onRowClick={(t) => setSelectedTrip(t)}
    pageSize={10}
    currentPage={currentPage}
    onPageChange={setCurrentPage}
  />
      </div>

      {
    /* Trip Detail Inspector Modal */
  }
      <TripDetailModal
    trip={selectedTrip}
    isOpen={!!selectedTrip}
    onClose={() => setSelectedTrip(null)}
    onUpdateStatus={handleUpdateTripStatus}
  />
    </div>;
};
export {
  TripsPage
};
