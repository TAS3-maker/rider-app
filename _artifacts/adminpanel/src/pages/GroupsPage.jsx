import { useState, useEffect } from "react";
import { PageHeader } from "../components/common/PageHeader";
import { DataTable } from "../components/common/DataTable";
import { StatusBadge } from "../components/common/StatusBadge";
import { SearchInput } from "../components/common/SearchInput";
import { FilterDropdown } from "../components/common/FilterDropdown";
import { GroupDetailModal } from "../components/modals/GroupDetailModal";
import { groupService } from "../services/groupService";
import { formatCurrency } from "../../src/utils/formatters";
import { useApp } from "../context/AppContext";
const GroupsPage = () => {
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { refreshKey, addToast } = useApp();
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    groupService.getGroups({
      search: searchQuery,
      type: typeFilter,
      status: statusFilter
    }).then((data) => {
      if (isMounted) setGroups(Array.isArray(data) ? data : []);
    }).catch(() => {
      if (isMounted) setGroups([]);
      addToast("Failed to load groups", "error");
    }).finally(() => {
      if (isMounted) setIsLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [searchQuery, typeFilter, statusFilter, refreshKey, addToast]);
  const columns = [
    {
      key: "id",
      header: "Group",
      sortable: true,
      render: (row) => <span className="font-mono font-semibold text-[#1A1A2E]">{row.id}</span>
    },
    {
      key: "tripId",
      header: "Trip",
      sortable: true,
      render: (row) => <span className="font-mono text-[#4A4A5A]">{row.tripId}</span>
    },
    {
      key: "type",
      header: "Type",
      render: (row) => <StatusBadge
        label={row.type}
        variant={row.type === "Public" ? "active" : "med"}
      />
    },
    {
      key: "ridersSummary",
      header: "Riders",
      render: (row) => <span className="text-[#1A1A2E]">{row.ridersSummary}</span>
    },
    {
      key: "bookerName",
      header: "Booker",
      render: (row) => <span className="font-medium text-[#1A1A2E]">{row.bookerName}</span>
    },
    {
      key: "vehicleSuggestion",
      header: "Vehicle",
      render: (row) => <span className="text-[#2B8A85] font-semibold">{row.vehicleSuggestion}</span>
    },
    {
      key: "fare",
      header: "Fare",
      render: (row) => <span className="font-semibold text-[#1A1A2E]">
          {row.fareType === "estimated" ? `Est. ${formatCurrency(row.fare)}` : formatCurrency(row.fare)}
        </span>
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge label={row.status} />
    }
  ];
  return <div className="flex-1 flex flex-col">
      <PageHeader
    title="Groups"
    subtitle="Active and historical ride groups"
    actions={<div className="flex items-center gap-2 flex-wrap">
            <SearchInput
      value={searchQuery}
      onChange={setSearchQuery}
      placeholder="Search groups / booker..."
      className="w-[180px] sm:w-[220px]"
    />
            <FilterDropdown
      value={typeFilter}
      onChange={setTypeFilter}
      options={[
        { value: "all", label: "All types" },
        { value: "public", label: "Public" },
        { value: "private", label: "Private" }
      ]}
      ariaLabel="Filter by group visibility"
    />
            <FilterDropdown
      value={statusFilter}
      onChange={setStatusFilter}
      options={[
        { value: "all", label: "All statuses" },
        { value: "forming", label: "Forming" },
        { value: "ready", label: "Ready" },
        { value: "completed", label: "Completed" }
      ]}
      ariaLabel="Filter by group status"
    />
          </div>}
  />

      <div className="p-5 sm:p-7">
        <DataTable
    columns={columns}
    data={groups}
    keyExtractor={(g) => g.id}
    isLoading={isLoading}
    onRowClick={(g) => setSelectedGroup(g)}
    pageSize={10}
    currentPage={currentPage}
    onPageChange={setCurrentPage}
  />
      </div>

      {
    /* Group Detail Inspection Modal */
  }
      <GroupDetailModal
    group={selectedGroup}
    isOpen={!!selectedGroup}
    onClose={() => setSelectedGroup(null)}
  />
    </div>;
};
export {
  GroupsPage
};
