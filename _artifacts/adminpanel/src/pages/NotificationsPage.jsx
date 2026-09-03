import { useState, useEffect } from "react";
import { PageHeader } from "../components/common/PageHeader";
import { DataTable } from "../components/common/DataTable";
import { NotificationPreviewModal } from "../components/modals/NotificationPreviewModal";
import { notificationService } from "../services/configServices";
import { useApp } from "../context/AppContext";
const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [school, setSchool] = useState("All Schools");
  const [audience, setAudience] = useState("All registered students");
  const [title, setTitle] = useState("\u{1F525} Thanksgiving rides are filling up!");
  const [message, setMessage] = useState(
    "47 students are looking for rides on Nov 24. Post your trip now and save 60% vs. riding solo."
  );
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { refreshKey, addToast } = useApp();
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    notificationService.getNotifications().then((data) => {
      if (isMounted) setNotifications(Array.isArray(data) ? data : []);
    }).catch(() => {
      if (isMounted) setNotifications([]);
      addToast("Failed to load notifications", "error");
    }).finally(() => {
      if (isMounted) setIsLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [refreshKey, addToast]);
  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!title || !message) {
      addToast("Please enter both title and message body", "error");
      return;
    }
    setIsSending(true);
    try {
      const created = await notificationService.sendNotification({
        title,
        message,
        school,
        audience
      });
      setNotifications((prev) => [created, ...prev]);
      addToast("Push notification broadcast sent successfully!", "success");
      setTitle("");
      setMessage("");
    } catch {
      addToast("Failed to broadcast notification", "error");
    } finally {
      setIsSending(false);
    }
  };
  const columns = [
    {
      key: "date",
      header: "Date",
      sortable: true,
      render: (row) => <span className="font-medium text-[#1A1A2E]">{row.date}</span>
    },
    {
      key: "title",
      header: "Title",
      sortable: true,
      render: (row) => <span className="font-semibold text-[#1A1A2E]">{row.title}</span>
    },
    {
      key: "target",
      header: "Target",
      render: (row) => <span className="text-[#4A4A5A]">{row.target}</span>
    },
    {
      key: "opened",
      header: "Opened",
      render: (row) => <span className="text-[#2B8A85] font-semibold">{row.opened}</span>
    },
    {
      key: "tripsCreated",
      header: "Trips Created",
      render: (row) => <span className="font-bold text-[#1A1A2E]">{row.tripsCreated}</span>
    }
  ];
  return <div className="flex-1 flex flex-col">
      <PageHeader
    title="Push Notifications"
    subtitle="Broadcast & scheduled push messages"
  />

      <div className="p-5 sm:p-7 space-y-6">
        {
    /* Send Manual Notification Card */
  }
        <div className="bg-white rounded-[10px] p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-[#E8E8E8]">
          <h3 className="text-[15px] font-bold text-[#1A1A2E] mb-4">Send Manual Notification</h3>

          <form onSubmit={handleSendNotification} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[12px] font-semibold text-[#4A4A5A] mb-1.5 block">
                  School
                </label>
                <select
    value={school}
    onChange={(e) => setSchool(e.target.value)}
    className="w-full px-3.5 py-2.5 border-[1.5px] border-[#E8E8E8] rounded-[8px] text-[13px] text-[#1A1A2E] bg-white focus:border-[#3AAFA9] focus:outline-none"
  >
                  <option value="All Schools">All Schools</option>
                  <option value="UMich">University of Michigan (UMich)</option>
                  <option value="MSU">Michigan State University (MSU)</option>
                </select>
              </div>
              <div>
                <label className="text-[12px] font-semibold text-[#4A4A5A] mb-1.5 block">
                  Target Audience
                </label>
                <select
    value={audience}
    onChange={(e) => setAudience(e.target.value)}
    className="w-full px-3.5 py-2.5 border-[1.5px] border-[#E8E8E8] rounded-[8px] text-[13px] text-[#1A1A2E] bg-white focus:border-[#3AAFA9] focus:outline-none"
  >
                  <option value="All registered students">All registered students</option>
                  <option value="Students with no active trips">Students with no active trips</option>
                  <option value="Students traveling for Thanksgiving">Students traveling for Thanksgiving</option>
                  <option value="Verified students only">Verified students only</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[12px] font-semibold text-[#4A4A5A] mb-1.5 block">
                Notification Title
              </label>
              <input
    type="text"
    required
    value={title}
    onChange={(e) => setTitle(e.target.value)}
    placeholder="🔥 Thanksgiving rides are filling up!"
    className="w-full px-3.5 py-2.5 border-[1.5px] border-[#E8E8E8] rounded-[8px] text-[14px] text-[#1A1A2E] focus:border-[#3AAFA9] focus:outline-none"
  />
            </div>

            <div>
              <label className="text-[12px] font-semibold text-[#4A4A5A] mb-1.5 block">
                Notification Message
              </label>
              <textarea
    rows={3}
    required
    value={message}
    onChange={(e) => setMessage(e.target.value)}
    placeholder="47 students are looking for rides on Nov 24. Post your trip now and save 60% vs. riding solo."
    className="w-full px-3.5 py-2.5 border-[1.5px] border-[#E8E8E8] rounded-[8px] text-[14px] text-[#1A1A2E] focus:border-[#3AAFA9] focus:outline-none"
  />
            </div>

            <div className="flex items-center gap-2.5">
              <button
    type="submit"
    disabled={isSending}
    className="px-5 py-2.5 bg-[#3AAFA9] text-white text-[13px] font-semibold rounded-[8px] hover:bg-[#2B8A85] transition-colors shadow-xs flex items-center gap-2"
  >
                {isSending && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                <span>Send Notification</span>
              </button>
              <button
    type="button"
    onClick={() => setIsPreviewOpen(true)}
    className="px-5 py-2.5 bg-transparent border-[1.5px] border-[#E8E8E8] text-[#4A4A5A] text-[13px] font-semibold rounded-[8px] hover:bg-[#F9FAFB] transition-colors"
  >
                Preview
              </button>
            </div>
          </form>
        </div>

        {
    /* Recent Notifications Table */
  }
        <div className="space-y-3">
          <h3 className="text-[15px] font-bold text-[#1A1A2E]">Recent Notifications</h3>
          <DataTable
    columns={columns}
    data={notifications}
    keyExtractor={(n) => n.id}
    isLoading={isLoading}
  />
        </div>
      </div>

      <NotificationPreviewModal
    isOpen={isPreviewOpen}
    onClose={() => setIsPreviewOpen(false)}
    title={title}
    message={message}
    audience={`${school} \xB7 ${audience}`}
  />
    </div>;
};
export {
  NotificationsPage
};
