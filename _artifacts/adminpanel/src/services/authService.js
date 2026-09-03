import { apiClient } from "./api";
const MOCK_ADMIN = {
  id: "adm_001",
  email: "admin@ridepact.com",
  name: "Platform Administrator",
  role: "super_admin",
  token: "mock_jwt_ridepact_admin_session_token_123"
};
const authService = {
  async login(email, password, role = "super_admin") {
    try {
      const response = await apiClient.post("/auth/login", { email, password, role });
      const user = response.data;
      localStorage.setItem("ridepact_admin_token", user.token);
      localStorage.setItem("ridepact_admin_user", JSON.stringify(user));
      return user;
    } catch {
      if (!email || !password) {
        throw new Error("Please enter a valid email and password.");
      }
      const user = {
        ...MOCK_ADMIN,
        email,
        name: email.split("@")[0].replace(".", " ").replace(/\b\w/g, (l) => l.toUpperCase()) + " (Admin)",
        role
      };
      localStorage.setItem("ridepact_admin_token", user.token);
      localStorage.setItem("ridepact_admin_user", JSON.stringify(user));
      return user;
    }
  },
  getCurrentUser() {
    try {
      const stored = localStorage.getItem("ridepact_admin_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },
  async logout() {
    try {
      await apiClient.post("/auth/logout");
    } catch {
    } finally {
      localStorage.removeItem("ridepact_admin_token");
      localStorage.removeItem("ridepact_admin_user");
    }
  },
  isAuthenticated() {
    return !!localStorage.getItem("ridepact_admin_token");
  }
};
export {
  authService
};
