import { apiClient } from "./api";
import { MockStorage } from "./mockStorage";
const userService = {
  async getUsers(params) {
    try {
      const response = await apiClient.get("/admin/users", { params });
      if (Array.isArray(response.data)) return response.data;
      if (Array.isArray(response.data?.users)) return response.data.users;
      if (Array.isArray(response.data?.data)) return response.data.data;
      throw new Error("Invalid users data structure");
    } catch {
      await new Promise((r) => setTimeout(r, 120));
      let users = MockStorage.getUsers();
      if (params?.search) {
        const query = params.search.toLowerCase();
        users = users.filter((u) => u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query) || u.paymentHandle.toLowerCase().includes(query));
      }
      if (params?.school && params.school !== "all") {
        users = users.filter((u) => u.school.toLowerCase() === params.school.toLowerCase());
      }
      if (params?.status && params.status !== "all") {
        users = users.filter((u) => u.status === params.status);
      }
      if (params?.verification && params.verification !== "all") {
        users = users.filter((u) => u.verificationStatus === params.verification);
      }
      return users;
    }
  },
  async getUserById(id) {
    try {
      const response = await apiClient.get(`/admin/users/${id}`);
      return response.data;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
      const user = MockStorage.getUserById(id);
      if (!user) throw new Error("User not found");
      return user;
    }
  },
  async updateUserStatus(id, status) {
    try {
      const response = await apiClient.patch(`/admin/users/${id}/status`, { status });
      return response.data;
    } catch {
      await new Promise((r) => setTimeout(r, 150));
      return MockStorage.updateUserStatus(id, status);
    }
  },
  async getUserRides(id) {
    try {
      const response = await apiClient.get(`/admin/users/${id}/rides`);
      return response.data;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
      const allTrips = MockStorage.getTrips();
      return allTrips.filter((t) => t.bookerId === id);
    }
  }
};
export {
  userService
};
