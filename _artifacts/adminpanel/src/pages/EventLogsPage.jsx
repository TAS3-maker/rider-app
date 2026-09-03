import { useState, useEffect } from "react";
import { PageHeader } from "../components/common/PageHeader";
import { DataTable } from "../components/common/DataTable";
import { StatusBadge } from "../components/common/StatusBadge";
import { FilterDropdown } from "../components/common/FilterDropdown";
import { SearchInput } from "../components/common/SearchInput";
import { EventDetailModal } from "../components/modals/EventDetailModal";
import { eventService } from "../services/eventService";
import { exportToCsv } from "../utils/exportCsv";
import { useApp } from "../context/AppContext";
const EventLogsPage = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { refreshKey, addToast } = useApp();
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    eventService.getEvents({
      search: searchQuery,
      eventType: eventTypeFilter
    }).then((data) => {
      if (isMounted) setEvents(Array.isArray(data) ? data : []);
    }).catch(() => {
      if (isMounted) setEvents([]);
      addToast("Failed to load event logs", "error");
    }).finally(() => {
      if (isMounted) setIsLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [searchQuery, eventTypeFilter, refreshKey, addToast]);
  const handleExportCsv = () => {
    exportToCsv("ridepact_event_logs", events, [
      { key: "timestamp", header: "Timestamp" },
      { key: "eventType", header: "Event" },
      { key: "user", header: "User" },
      { key: "details", header: "Details" },
      { key: "source", header: "Source" },
      { key: "tripId", header: "Trip ID" },
      { key: "groupId", header: "Group ID" }
    ]);
    addToast("Event logs CSV exported successfully", "success");
  };
  const columns = [
    {
      key: "timestamp",
      header: "Timestamp",
      sortable: true,
      className: "whitespace-nowrap font-medium text-[#1A1A2E]"
    },
    {
      key: "eventType",
      header: "Event",
      render: (row) => <StatusBadge label={row.eventType} />
    },
    {
      key: "user",
      header: "User",
      sortable: true,
      render: (row) => <span className="font-semibold text-[#1A1A2E]">{row.user}</span>
    },
    {
      key: "details",
      header: "Details",
      render: (row) => <span className="text-[#4A4A5A]">{row.details}</span>
    }
  ];
  return <div className="flex-1 flex flex-col">
      <PageHeader
    title="Event Logs"
    subtitle="All platform activity · For analytics & future ML training"
    actions={<div className="flex items-center gap-2 flex-wrap">
            <SearchInput
      value={searchQuery}
      onChange={setSearchQuery}
      placeholder="Search event logs..."
      className="w-[180px] sm:w-[220px]"
    />
            <FilterDropdown
      value={eventTypeFilter}
      onChange={setEventTypeFilter}
      options={[
        { value: "all", label: "All events" },
        { value: "trip_created", label: "trip_created" },
        { value: "group_joined", label: "group_joined" },
        { value: "rider_left", label: "rider_left" },
        { value: "ride_completed", label: "ride_completed" },
        { value: "payment_sent", label: "payment_sent" },
        { value: "rating_submitted", label: "rating_submitted" },
        { value: "user_flaked", label: "user_flaked" },
        { value: "booker_reassigned", label: "booker_reassigned" },
        { value: "fare_confirmed", label: "fare_confirmed" }
      ]}
      ariaLabel="Filter by event type"
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
    data={events}
    keyExtractor={(e) => e.id}
    isLoading={isLoading}
    onRowClick={(e) => setSelectedEvent(e)}
    pageSize={10}
    currentPage={currentPage}
    onPageChange={setCurrentPage}
  />
      </div>

      {
    /* Event Detail Inspection Modal */
  }
      <EventDetailModal
    event={selectedEvent}
    isOpen={!!selectedEvent}
    onClose={() => setSelectedEvent(null)}
  />
    </div>;
};
export {
  EventLogsPage
};
