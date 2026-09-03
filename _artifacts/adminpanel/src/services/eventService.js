import { apiClient } from "./api";
import { MockStorage } from "./mockStorage";
const eventService = {
  async getEvents(params) {
    try {
      const response = await apiClient.get("/admin/events", { params });
      if (Array.isArray(response.data)) return response.data;
      if (Array.isArray(response.data?.events)) return response.data.events;
      if (Array.isArray(response.data?.data)) return response.data.data;
      throw new Error("Invalid events data structure");
    } catch {
      await new Promise((r) => setTimeout(r, 120));
      let events = MockStorage.getEventLogs();
      if (params?.search) {
        const q = params.search.toLowerCase();
        events = events.filter((e) => e.details.toLowerCase().includes(q) || e.user.toLowerCase().includes(q) || e.tripId && e.tripId.toLowerCase().includes(q) || e.groupId && e.groupId.toLowerCase().includes(q));
      }
      if (params?.eventType && params.eventType !== "all" && params.eventType !== "All events") {
        events = events.filter((e) => e.eventType.toLowerCase() === params.eventType?.toLowerCase());
      }
      if (params?.user && params.user !== "all") {
        events = events.filter((e) => e.user.toLowerCase() === params.user?.toLowerCase());
      }
      return events;
    }
  },
  async logEvent(event) {
    try {
      const response = await apiClient.post("/admin/events", event);
      return response.data;
    } catch {
      return MockStorage.addEventLog(event);
    }
  }
};
export {
  eventService
};
