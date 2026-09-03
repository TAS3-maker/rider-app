import { apiClient } from "./api";
import { MockStorage } from "./mockStorage";
const groupService = {
  async getGroups(params) {
    try {
      const response = await apiClient.get("/admin/groups", { params });
      if (Array.isArray(response.data)) return response.data;
      if (Array.isArray(response.data?.groups)) return response.data.groups;
      if (Array.isArray(response.data?.data)) return response.data.data;
      throw new Error("Invalid groups data structure");
    } catch {
      await new Promise((r) => setTimeout(r, 120));
      let groups = MockStorage.getGroups();
      if (params?.search) {
        const q = params.search.toLowerCase();
        groups = groups.filter((g) => g.id.toLowerCase().includes(q) || g.tripId.toLowerCase().includes(q) || g.bookerName.toLowerCase().includes(q));
      }
      if (params?.type && params.type !== "all") {
        groups = groups.filter((g) => g.type.toLowerCase() === params.type?.toLowerCase());
      }
      if (params?.status && params.status !== "all") {
        groups = groups.filter((g) => g.status.toLowerCase() === params.status?.toLowerCase());
      }
      return groups;
    }
  },
  async getGroupById(id) {
    try {
      const response = await apiClient.get(`/admin/groups/${id}`);
      return response.data;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
      const group = MockStorage.getGroupById(id);
      if (!group) throw new Error("Group not found");
      return group;
    }
  }
};
export {
  groupService
};
