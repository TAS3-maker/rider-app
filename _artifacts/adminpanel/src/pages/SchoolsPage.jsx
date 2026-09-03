import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/common/PageHeader";
import { DataTable } from "../components/common/DataTable";
import { StatusBadge } from "../components/common/StatusBadge";
import { SchoolModal } from "../components/modals/SchoolModal";
import { schoolService } from "../services/configServices";
import { useApp } from "../context/AppContext";
const SchoolsPage = () => {
  const [schools, setSchools] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const { refreshKey, addToast } = useApp();
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    schoolService.getSchools().then((data) => {
      if (isMounted) setSchools(Array.isArray(data) ? data : []);
    }).catch(() => {
      if (isMounted) setSchools([]);
      addToast("Failed to load schools", "error");
    }).finally(() => {
      if (isMounted) setIsLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [refreshKey, addToast]);
  const handleSaveSchool = async (data) => {
    try {
      if (selectedSchool) {
        const updated = await schoolService.updateSchool(selectedSchool.id, data);
        setSchools((prev) => prev.map((s) => s.id === updated.id ? updated : s));
        addToast(`School ${updated.name} updated`, "success");
      } else {
        const created = await schoolService.addSchool(data);
        setSchools((prev) => [...prev, created]);
        addToast(`School ${created.name} added successfully`, "success");
      }
    } catch {
      addToast("Failed to save school", "error");
    }
  };
  const columns = [
    {
      key: "name",
      header: "School",
      sortable: true,
      render: (row) => <div>
          <span className="font-semibold text-[#1A1A2E]">{row.name}</span>
          <span className="text-[11px] text-[#8A8A9A] ml-2 font-mono">({row.shortName})</span>
        </div>
    },
    {
      key: "domain",
      header: "Domain",
      sortable: true,
      render: (row) => <span className="font-mono text-[#3AAFA9] font-medium">{row.domain}</span>
    },
    {
      key: "usersCount",
      header: "Users",
      sortable: true
    },
    {
      key: "ridesCount",
      header: "Rides",
      sortable: true
    },
    {
      key: "destinations",
      header: "Destinations",
      render: (row) => <span className="font-mono font-bold text-[#1A1A2E]">
          {row.destinations.join(", ")}
        </span>
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge
        label={row.status}
        variant={row.status === "Live" ? "active" : "inactive"}
      />
    }
  ];
  return <div className="flex-1 flex flex-col">
      <PageHeader
    title="Schools"
    subtitle="University configuration · Adding a school = database record, no code change"
    actions={<div className="flex items-center gap-2">
            <button
      type="button"
      onClick={() => navigate("/schools/add")}
      className="px-4 py-2 text-[13px] font-semibold bg-[#3AAFA9] text-white rounded-[8px] hover:bg-[#2B8A85] transition-colors shadow-xs"
    >
              + Add School (Full Page)
            </button>
            <button
      type="button"
      onClick={() => {
        setSelectedSchool(null);
        setIsModalOpen(true);
      }}
      className="px-3.5 py-2 text-[13px] font-semibold border-[1.5px] border-[#E8E8E8] bg-white text-[#4A4A5A] rounded-[8px] hover:border-[#3AAFA9] hover:text-[#3AAFA9] transition-colors"
    >
              Quick Add Modal
            </button>
          </div>}
  />

      <div className="p-5 sm:p-7">
        <DataTable
    columns={columns}
    data={schools}
    keyExtractor={(s) => s.id}
    isLoading={isLoading}
    onRowClick={(s) => {
      setSelectedSchool(s);
      setIsModalOpen(true);
    }}
  />
      </div>

      {
    /* School Create / Edit Modal */
  }
      <SchoolModal
    isOpen={isModalOpen}
    onClose={() => setIsModalOpen(false)}
    onSave={handleSaveSchool}
    initialSchool={selectedSchool}
  />
    </div>;
};
export {
  SchoolsPage
};
