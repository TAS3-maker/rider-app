import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "../components/common/PageHeader";
import { DataTable } from "../components/common/DataTable";
import { StatusBadge } from "../components/common/StatusBadge";
import { SearchInput } from "../components/common/SearchInput";
import { FilterDropdown } from "../components/common/FilterDropdown";
import { UserDetailModal } from "../components/modals/UserDetailModal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { userService } from "../services/userService";
import { exportToCsv } from "../utils/exportCsv";
import { formatRating } from "../utils/formatters";
import { useApp } from "../context/AppContext";
const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToToggle, setUserToToggle] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const { refreshKey, addToast } = useApp();
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    userService.getUsers({
      search: searchQuery,
      school: schoolFilter,
      status: statusFilter
    }).then((data) => {
      if (isMounted) setUsers(Array.isArray(data) ? data : []);
    }).catch(() => {
      if (isMounted) setUsers([]);
      addToast("Failed to load users", "error");
    }).finally(() => {
      if (isMounted) setIsLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [searchQuery, schoolFilter, statusFilter, refreshKey, addToast]);
  const verifiedCount = useMemo(
    () => (Array.isArray(users) ? users : []).filter((u) => u.verificationStatus === "verified").length,
    [users]
  );
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };
  const sortedUsers = useMemo(() => {
    const list = Array.isArray(users) ? users : [];
    return [...list].sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];
      if (aVal === null || aVal === void 0) aVal = "";
      if (bVal === null || bVal === void 0) bVal = "";
      if (typeof aVal === "string") {
        return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [users, sortKey, sortOrder]);
  const handleToggleUserStatus = async () => {
    if (!userToToggle) return;
    const newStatus = userToToggle.status === "active" ? "inactive" : "active";
    try {
      const updated = await userService.updateUserStatus(userToToggle.id, newStatus);
      setUsers((prev) => prev.map((u) => u.id === updated.id ? updated : u));
      if (selectedUser?.id === updated.id) setSelectedUser(updated);
      addToast(
        `User ${updated.name} has been ${newStatus === "active" ? "activated" : "deactivated"}`,
        "success"
      );
    } catch {
      addToast("Failed to update user status", "error");
    } finally {
      setUserToToggle(null);
    }
  };
  const handleExportCsv = () => {
    exportToCsv("ridepact_users", users, [
      { key: "name", header: "User" },
      { key: "email", header: "Email" },
      { key: "school", header: "School" },
      { key: "ridesCount", header: "Rides" },
      { key: "reliabilityRating", header: "Rating", formatter: (v) => v ? v.toFixed(1) : "" },
      { key: "paymentHandle", header: "Payment" },
      { key: "verificationStatus", header: "Verification" },
      { key: "status", header: "Status" },
      { key: "joinedDate", header: "Joined Date" }
    ]);
    addToast("Users CSV exported successfully", "success");
  };
  const columns = [
    {
      key: "name",
      header: "User",
      sortable: true,
      render: (row) => <div className="flex items-center gap-2">
          <img
        src={row.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"}
        alt=""
        className="w-6 h-6 rounded-full object-cover border border-[#E8E8E8]"
      />
          <span className="font-semibold text-[#1A1A2E]">{row.name}</span>
        </div>
    },
    {
      key: "email",
      header: "Email",
      sortable: true
    },
    {
      key: "school",
      header: "School",
      sortable: true
    },
    {
      key: "ridesCount",
      header: "Rides",
      sortable: true,
      render: (row) => <span>{row.ridesCount}</span>
    },
    {
      key: "reliabilityRating",
      header: "Rating",
      sortable: true,
      render: (row) => <span>{formatRating(row.reliabilityRating)}</span>
    },
    {
      key: "paymentHandle",
      header: "Payment",
      render: (row) => <span className="font-mono text-[12px]">{row.paymentHandle}</span>
    },
    {
      key: "status",
      header: "Status",
      render: (row) => {
        if (row.verificationStatus === "unverified") {
          return <StatusBadge label="Unverified" variant="inactive" />;
        }
        return <StatusBadge label={row.status === "active" ? "Active" : "Inactive"} variant={row.status === "active" ? "active" : "inactive"} />;
      }
    }
  ];
  return <div className="flex-1 flex flex-col">
      <PageHeader
    title="Users"
    subtitle={`${users.length} registered \xB7 ${verifiedCount} verified`}
    actions={<div className="flex items-center gap-2 flex-wrap">
            <SearchInput
      value={searchQuery}
      onChange={setSearchQuery}
      placeholder="Search users..."
      className="w-[200px] sm:w-[240px]"
    />
            <FilterDropdown
      value={schoolFilter}
      onChange={setSchoolFilter}
      options={[
        { value: "all", label: "All schools" },
        { value: "umich", label: "UMich" },
        { value: "msu", label: "MSU" }
      ]}
      ariaLabel="Filter users by school"
    />
            <FilterDropdown
      value={statusFilter}
      onChange={setStatusFilter}
      options={[
        { value: "all", label: "All statuses" },
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" }
      ]}
      ariaLabel="Filter users by account status"
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
    data={sortedUsers}
    keyExtractor={(u) => u.id}
    isLoading={isLoading}
    onRowClick={(u) => setSelectedUser(u)}
    pageSize={10}
    currentPage={currentPage}
    onPageChange={setCurrentPage}
    sortKey={sortKey}
    sortOrder={sortOrder}
    onSort={handleSort}
  />
      </div>

      {
    /* User Detail Inspection Modal */
  }
      <UserDetailModal
    user={selectedUser}
    isOpen={!!selectedUser}
    onClose={() => setSelectedUser(null)}
    onToggleStatus={(u) => setUserToToggle(u)}
  />

      {
    /* Deactivate/Activate Confirmation Dialog */
  }
      <ConfirmDialog
    isOpen={!!userToToggle}
    onClose={() => setUserToToggle(null)}
    onConfirm={handleToggleUserStatus}
    title={userToToggle?.status === "active" ? "Deactivate User Account" : "Activate User Account"}
    message={`Are you sure you want to ${userToToggle?.status === "active" ? "deactivate" : "activate"} ${userToToggle?.name}? ${userToToggle?.status === "active" ? "The student will temporarily be unable to post or join ride groups." : "The student will regain full access to campus ride groups."}`}
    confirmLabel={userToToggle?.status === "active" ? "Deactivate" : "Activate"}
    variant={userToToggle?.status === "active" ? "danger" : "primary"}
  />
    </div>;
};
export {
  UsersPage
};
