import { apiClient } from "./api";
import { MockStorage } from "./mockStorage";
const schoolService = {
  async getSchools() {
    try {
      const response = await apiClient.get("/admin/schools");
      if (Array.isArray(response.data)) return response.data;
      if (Array.isArray(response.data?.schools)) return response.data.schools;
      if (Array.isArray(response.data?.data)) return response.data.data;
      throw new Error("Invalid schools response");
    } catch {
      await new Promise((r) => setTimeout(r, 100));
      return MockStorage.getSchools();
    }
  },
  async addSchool(school) {
    try {
      const response = await apiClient.post("/admin/schools", school);
      return response.data;
    } catch {
      await new Promise((r) => setTimeout(r, 150));
      return MockStorage.addSchool(school);
    }
  },
  async updateSchool(id, updates) {
    try {
      const response = await apiClient.patch(`/admin/schools/${id}`, updates);
      return response.data;
    } catch {
      await new Promise((r) => setTimeout(r, 150));
      return MockStorage.updateSchool(id, updates);
    }
  }
};
const destinationService = {
  async getDestinations() {
    try {
      const response = await apiClient.get("/admin/destinations");
      if (Array.isArray(response.data)) return response.data;
      if (Array.isArray(response.data?.destinations)) return response.data.destinations;
      if (Array.isArray(response.data?.data)) return response.data.data;
      throw new Error("Invalid destinations response");
    } catch {
      await new Promise((r) => setTimeout(r, 100));
      return MockStorage.getDestinations();
    }
  },
  async addDestination(dest) {
    try {
      const response = await apiClient.post("/admin/destinations", dest);
      return response.data;
    } catch {
      await new Promise((r) => setTimeout(r, 150));
      return MockStorage.addDestination(dest);
    }
  },
  async updateDestination(id, updates) {
    try {
      const response = await apiClient.patch(`/admin/destinations/${id}`, updates);
      return response.data;
    } catch {
      await new Promise((r) => setTimeout(r, 150));
      return MockStorage.updateDestination(id, updates);
    }
  }
};
const pickupService = {
  async getPickupLocations() {
    try {
      const response = await apiClient.get("/admin/pickups");
      if (Array.isArray(response.data)) return response.data;
      if (Array.isArray(response.data?.pickups)) return response.data.pickups;
      if (Array.isArray(response.data?.data)) return response.data.data;
      throw new Error("Invalid pickups response");
    } catch {
      await new Promise((r) => setTimeout(r, 100));
      return MockStorage.getPickupLocations();
    }
  },
  async addPickupLocation(pickup) {
    try {
      const response = await apiClient.post("/admin/pickups", pickup);
      return response.data;
    } catch {
      await new Promise((r) => setTimeout(r, 150));
      return MockStorage.addPickupLocation(pickup);
    }
  },
  async updatePickupLocation(id, updates) {
    try {
      const response = await apiClient.patch(`/admin/pickups/${id}`, updates);
      return response.data;
    } catch {
      await new Promise((r) => setTimeout(r, 150));
      return MockStorage.updatePickupLocation(id, updates);
    }
  }
};
const calendarService = {
  async getBreakDates() {
    try {
      const response = await apiClient.get("/admin/events/calendar");
      if (Array.isArray(response.data)) return response.data;
      if (Array.isArray(response.data?.breaks)) return response.data.breaks;
      if (Array.isArray(response.data?.data)) return response.data.data;
      throw new Error("Invalid break dates response");
    } catch {
      await new Promise((r) => setTimeout(r, 100));
      return MockStorage.getBreakDates();
    }
  },
  async addBreakDate(breakDate) {
    try {
      const response = await apiClient.post("/admin/events/calendar", breakDate);
      return response.data;
    } catch {
      await new Promise((r) => setTimeout(r, 150));
      return MockStorage.addBreakDate(breakDate);
    }
  },
  async updateBreakDate(id, updates) {
    try {
      const response = await apiClient.patch(`/admin/events/calendar/${id}`, updates);
      return response.data;
    } catch {
      await new Promise((r) => setTimeout(r, 150));
      return MockStorage.updateBreakDate(id, updates);
    }
  },
  async triggerNotification(id, type) {
    try {
      const response = await apiClient.post(`/admin/events/calendar/${id}/trigger-notification`, { type });
      return response.data;
    } catch {
      await new Promise((r) => setTimeout(r, 150));
      return MockStorage.triggerBreakNotification(id, type);
    }
  }
};
const breakDateService = calendarService;
const pickupLocationService = pickupService;
const notificationService = {
  async getNotifications() {
    try {
      const response = await apiClient.get("/admin/notifications/history");
      if (Array.isArray(response.data)) return response.data;
      if (Array.isArray(response.data?.notifications)) return response.data.notifications;
      if (Array.isArray(response.data?.data)) return response.data.data;
      throw new Error("Invalid notifications response");
    } catch {
      await new Promise((r) => setTimeout(r, 100));
      return MockStorage.getNotifications();
    }
  },
  async sendNotification(notif) {
    try {
      const response = await apiClient.post("/admin/notifications", notif);
      return response.data;
    } catch {
      await new Promise((r) => setTimeout(r, 200));
      return MockStorage.addNotification(notif);
    }
  }
};
const settingsService = {
  async getSettings() {
    try {
      const response = await apiClient.get("/admin/settings");
      return response.data;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
      return MockStorage.getSettings();
    }
  },
  async saveSettings(settings) {
    try {
      const response = await apiClient.patch("/admin/settings", settings);
      return response.data;
    } catch {
      await new Promise((r) => setTimeout(r, 200));
      return MockStorage.updateSettings(settings);
    }
  },
  async updateSettings(settings) {
    return this.saveSettings(settings);
  },
  async resetToDefaults() {
    try {
      const response = await apiClient.post("/admin/settings/reset");
      return response.data;
    } catch {
      await new Promise((r) => setTimeout(r, 150));
      return MockStorage.resetSettings();
    }
  }
};
const dashboardService = {
  async getStats() {
    try {
      const response = await apiClient.get("/admin/dashboard");
      return response.data;
    } catch {
      await new Promise((r) => setTimeout(r, 120));
      return MockStorage.getDashboardStats();
    }
  }
};
export {
  breakDateService,
  calendarService,
  dashboardService,
  destinationService,
  notificationService,
  pickupLocationService,
  pickupService,
  schoolService,
  settingsService
};
