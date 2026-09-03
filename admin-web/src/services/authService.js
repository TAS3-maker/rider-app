import { apiClient } from "./api";

// RidePact admin authentication — wired to the single Node/Express backend.
// Shared JWT system; only users with role === "admin" may sign in here.
const TOKEN_KEY = "ridepact_admin_token";
const USER_KEY = "ridepact_admin_user";

const authService = {
  async login(email, password) {
    const { data } = await apiClient.post("/auth/login", { email, password });
    if (!data || !data.accessToken || !data.user) {
      throw new Error("Unexpected response from server");
    }
    if (data.user.role !== "admin") {
      throw new Error("Not authorized: admin access only");
    }
    const user = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name || "Platform Administrator",
      role: data.user.role,
      token: data.accessToken,
    };
    localStorage.setItem(TOKEN_KEY, user.token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },

  getCurrentUser() {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  async logout() {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      /* stateless JWT — ignore network errors on logout */
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  },

  isAuthenticated() {
    return !!localStorage.getItem(TOKEN_KEY);
  },
};

export { authService };
