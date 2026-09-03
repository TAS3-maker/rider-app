import { useState, useEffect } from "react";
import { PageHeader } from "../components/common/PageHeader";
import { settingsService } from "../services/configServices";
import { useApp } from "../context/AppContext";
const SettingsPage = () => {
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminRole, setNewAdminRole] = useState("Admin");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const { refreshKey, addToast } = useApp();
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    settingsService.getSettings().then((data) => {
      if (isMounted) setSettings(data);
    }).catch(() => {
      addToast("Failed to load platform settings", "error");
    }).finally(() => {
      if (isMounted) setIsLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [refreshKey, addToast]);
  const handleSave = async (e) => {
    e.preventDefault();
    if (!settings) return;
    setIsSaving(true);
    try {
      await settingsService.updateSettings(settings);
      addToast("Platform settings and business rules saved successfully", "success");
    } catch {
      addToast("Failed to save settings", "error");
    } finally {
      setIsSaving(false);
    }
  };
  const handleReset = async () => {
    if (window.confirm("Reset all platform settings to initial system defaults?")) {
      const reset = await settingsService.resetToDefaults();
      setSettings(reset);
      addToast("Settings reset to system defaults", "info");
    }
  };
  const handleToggleTrigger = (key) => {
    if (!settings) return;
    setSettings({
      ...settings,
      notificationTriggers: {
        ...settings.notificationTriggers,
        [key]: !settings.notificationTriggers[key]
      }
    });
  };
  const handleInviteAdmin = (e) => {
    e.preventDefault();
    if (!newAdminEmail || !settings) return;
    const newAdmin = {
      id: `adm_${Date.now()}`,
      email: newAdminEmail,
      role: `${newAdminRole} \xB7 School management`
    };
    setSettings({
      ...settings,
      adminAccounts: [...settings.adminAccounts, newAdmin]
    });
    setNewAdminEmail("");
    setShowInviteModal(false);
    addToast(`Invitation sent to ${newAdminEmail}`, "success");
  };
  if (isLoading || !settings) {
    return <div className="flex-1 flex items-center justify-center p-12">
        <div className="w-6 h-6 border-2 border-[#3AAFA9] border-t-transparent rounded-full animate-spin" />
      </div>;
  }
  return <div className="flex-1 flex flex-col">
      <PageHeader
    title="Settings"
    subtitle="Platform configuration & business rules"
  />

      <div className="p-5 sm:p-7 max-w-4xl">
        <form onSubmit={handleSave} className="space-y-5">
          {
    /* Card 1: Matching & Group Rules */
  }
          <div className="bg-white rounded-[10px] p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-[#E8E8E8]">
            <h3 className="text-[15px] font-bold text-[#1A1A2E] mb-4">
              Matching & Group Rules
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[12px] font-semibold text-[#4A4A5A] mb-1.5 block">
                  Max Group Size
                </label>
                <input
    type="number"
    min={2}
    max={6}
    value={settings.maxGroupSize}
    onChange={(e) => setSettings({ ...settings, maxGroupSize: Number(e.target.value) })}
    className="w-full px-3.5 py-2.5 border-[1.5px] border-[#E8E8E8] rounded-[8px] text-[14px] text-[#1A1A2E] focus:border-[#3AAFA9] focus:outline-none"
  />
              </div>

              <div>
                <label className="text-[12px] font-semibold text-[#4A4A5A] mb-1.5 block">
                  Time Window for Matching (minutes)
                </label>
                <input
    type="number"
    step={15}
    value={settings.matchingTimeWindowMinutes}
    onChange={(e) => setSettings({
      ...settings,
      matchingTimeWindowMinutes: Number(e.target.value)
    })}
    className="w-full px-3.5 py-2.5 border-[1.5px] border-[#E8E8E8] rounded-[8px] text-[14px] text-[#1A1A2E] focus:border-[#3AAFA9] focus:outline-none"
  />
              </div>

              <div>
                <label className="text-[12px] font-semibold text-[#4A4A5A] mb-1.5 block">
                  Booker Discount Amount ($)
                </label>
                <input
    type="number"
    step={0.5}
    value={settings.bookerDiscountAmount}
    onChange={(e) => setSettings({
      ...settings,
      bookerDiscountAmount: Number(e.target.value)
    })}
    className="w-full px-3.5 py-2.5 border-[1.5px] border-[#E8E8E8] rounded-[8px] text-[14px] text-[#1A1A2E] focus:border-[#3AAFA9] focus:outline-none"
  />
              </div>

              <div>
                <label className="text-[12px] font-semibold text-[#4A4A5A] mb-1.5 block">
                  Airport Arrival Buffer (minutes before flight)
                </label>
                <input
    type="number"
    step={15}
    value={settings.airportArrivalBufferMinutes}
    onChange={(e) => setSettings({
      ...settings,
      airportArrivalBufferMinutes: Number(e.target.value)
    })}
    className="w-full px-3.5 py-2.5 border-[1.5px] border-[#E8E8E8] rounded-[8px] text-[14px] text-[#1A1A2E] focus:border-[#3AAFA9] focus:outline-none"
  />
              </div>
            </div>
          </div>

          {
    /* Card 2: Automated Push Triggers */
  }
          <div className="bg-white rounded-[10px] p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-[#E8E8E8]">
            <h3 className="text-[15px] font-bold text-[#1A1A2E] mb-4">
              Automated Push Triggers
            </h3>

            <div className="space-y-3 text-[13px] text-[#1A1A2E]">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
    type="checkbox"
    checked={settings.notificationTriggers.break14d}
    onChange={() => handleToggleTrigger("break14d")}
    className="w-4 h-4 rounded text-[#3AAFA9] focus:ring-[#3AAFA9] border-[#E8E8E8]"
  />
                <span>14 days before academic break</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
    type="checkbox"
    checked={settings.notificationTriggers.break3d}
    onChange={() => handleToggleTrigger("break3d")}
    className="w-4 h-4 rounded text-[#3AAFA9] focus:ring-[#3AAFA9] border-[#E8E8E8]"
  />
                <span>3 days before academic break</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
    type="checkbox"
    checked={settings.notificationTriggers.riderAdded}
    onChange={() => handleToggleTrigger("riderAdded")}
    className="w-4 h-4 rounded text-[#3AAFA9] focus:ring-[#3AAFA9] border-[#E8E8E8]"
  />
                <span>Rider added to group (instant)</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
    type="checkbox"
    checked={settings.notificationTriggers.groupFull}
    onChange={() => handleToggleTrigger("groupFull")}
    className="w-4 h-4 rounded text-[#3AAFA9] focus:ring-[#3AAFA9] border-[#E8E8E8]"
  />
                <span>Group reaches 4 riders (instant)</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
    type="checkbox"
    checked={settings.notificationTriggers.flightReminder3h}
    onChange={() => handleToggleTrigger("flightReminder3h")}
    className="w-4 h-4 rounded text-[#3AAFA9] focus:ring-[#3AAFA9] border-[#E8E8E8]"
  />
                <span>Flight departure -3 hours (day-of reminder)</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
    type="checkbox"
    checked={settings.notificationTriggers.reimbursement2h}
    onChange={() => handleToggleTrigger("reimbursement2h")}
    className="w-4 h-4 rounded text-[#3AAFA9] focus:ring-[#3AAFA9] border-[#E8E8E8]"
  />
                <span>Post-trip reimbursement reminder (+2 hours)</span>
              </label>
            </div>
          </div>

          {
    /* Card 3: Admin Accounts */
  }
          <div className="bg-white rounded-[10px] p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-[#E8E8E8]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold text-[#1A1A2E]">Admin Accounts</h3>
              <button
    type="button"
    onClick={() => setShowInviteModal(true)}
    className="px-3 py-1.5 text-[12px] font-semibold text-[#3AAFA9] border border-[#3AAFA9]/30 rounded-[6px] hover:bg-[#E8F6F5] transition-colors"
  >
                + Invite Admin
              </button>
            </div>

            <div className="space-y-2.5">
              {settings.adminAccounts.map((admin) => <div
    key={admin.id}
    className="flex items-center justify-between p-3 bg-[#FAFAFA] rounded-[8px] border border-[#E8E8E8] text-[13px]"
  >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#28CA42]" />
                    <span className="font-semibold text-[#1A1A2E]">{admin.email}</span>
                  </div>
                  <span className="text-[12px] text-[#8A8A9A] font-medium">{admin.role}</span>
                </div>)}
            </div>
          </div>

          {
    /* Action Buttons */
  }
          <div className="flex items-center gap-3 pt-2">
            <button
    type="submit"
    disabled={isSaving}
    className="px-5 py-2.5 bg-[#3AAFA9] text-white text-[13px] font-semibold rounded-[8px] hover:bg-[#2B8A85] transition-colors shadow-xs flex items-center gap-2"
  >
              {isSaving && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <span>Save Settings</span>
            </button>
            <button
    type="button"
    onClick={handleReset}
    className="px-5 py-2.5 bg-transparent border-[1.5px] border-[#E8E8E8] text-[#4A4A5A] text-[13px] font-semibold rounded-[8px] hover:bg-white transition-colors"
  >
              Reset to Defaults
            </button>
          </div>
        </form>
      </div>

      {
    /* Invite Admin Mini Dialog */
  }
      {showInviteModal && <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[12px] p-5 w-full max-w-sm shadow-xl border border-[#E8E8E8]">
            <h4 className="text-[15px] font-bold text-[#1A1A2E] mb-3">Invite Team Admin</h4>
            <form onSubmit={handleInviteAdmin} className="space-y-3">
              <div>
                <label className="text-[12px] font-semibold text-[#4A4A5A] mb-1 block">
                  Email Address
                </label>
                <input
    type="email"
    required
    value={newAdminEmail}
    onChange={(e) => setNewAdminEmail(e.target.value)}
    placeholder="admin@ridepact.com"
    className="w-full px-3 py-2 border border-[#E8E8E8] rounded-[8px] text-[13px] focus:border-[#3AAFA9] focus:outline-none"
  />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-[#4A4A5A] mb-1 block">Role</label>
                <select
    value={newAdminRole}
    onChange={(e) => setNewAdminRole(e.target.value)}
    className="w-full px-3 py-2 border border-[#E8E8E8] rounded-[8px] text-[13px] bg-white focus:border-[#3AAFA9] focus:outline-none"
  >
                  <option value="Admin">Admin (Full school management)</option>
                  <option value="Viewer">Viewer (Read-only analytics)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
    type="button"
    onClick={() => setShowInviteModal(false)}
    className="px-3 py-1.5 text-[12px] font-medium text-[#8A8A9A]"
  >
                  Cancel
                </button>
                <button
    type="submit"
    className="px-4 py-1.5 text-[12px] font-semibold bg-[#3AAFA9] text-white rounded-[6px]"
  >
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>}
    </div>;
};
export {
  SettingsPage
};
