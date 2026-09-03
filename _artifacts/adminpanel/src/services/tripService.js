import { apiClient } from "./api";
import { MockStorage } from "./mockStorage";
const tripService = {
  async getTrips(params) {
    try {
      const response = await apiClient.get("/admin/trips", { params });
      if (Array.isArray(response.data)) return response.data;
      if (Array.isArray(response.data?.trips)) return response.data.trips;
      if (Array.isArray(response.data?.data)) return response.data.data;
      throw new Error("Invalid trips data structure");
    } catch {
      await new Promise((r) => setTimeout(r, 120));
      let trips = MockStorage.getTrips();
      if (params?.search) {
        const q = params.search.toLowerCase();
        trips = trips.filter((t) => t.id.toLowerCase().includes(q) || t.route.toLowerCase().includes(q) || t.bookerName.toLowerCase().includes(q));
      }
      if (params?.status && params.status !== "all" && params.status !== "All statuses") {
        trips = trips.filter((t) => t.status.toLowerCase() === params.status?.toLowerCase());
      }
      if (params?.direction && params.direction !== "all" && params.direction !== "All directions") {
        trips = trips.filter((t) => t.route.toLowerCase().includes(params.direction?.toLowerCase() || ""));
      }
      return trips;
    }
  },
  async getTripById(id) {
    try {
      const response = await apiClient.get(`/admin/trips/${id}`);
      return response.data;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
      const trip = MockStorage.getTripById(id);
      if (!trip) throw new Error("Trip not found");
      return trip;
    }
  },
  async updateTripStatus(id, status) {
    try {
      const response = await apiClient.patch(`/admin/trips/${id}/status`, { status });
      return response.data;
    } catch {
      await new Promise((r) => setTimeout(r, 150));
      return MockStorage.updateTripStatus(id, status);
    }
  }
};
export {
  tripService
};
