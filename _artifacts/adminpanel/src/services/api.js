import axios from "axios";
const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || "/api";
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 1e4,
  headers: {
    "Content-Type": "application/json"
  }
});
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("ridepact_admin_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
apiClient.interceptors.response.use(
  (response) => {
    const contentType = String(response.headers?.["content-type"] || "");
    if (typeof response.data === "string" && (contentType.includes("text/html") || response.data.trim().startsWith("<!DOCTYPE") || response.data.trim().startsWith("<html"))) {
      const error = new Error("Invalid JSON response: Received HTML from SPA fallback");
      return Promise.reject(error);
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("ridepact_admin_token");
      localStorage.removeItem("ridepact_admin_user");
      window.dispatchEvent(new Event("ridepact_unauthorized"));
    }
    return Promise.reject(error);
  }
);
export {
  apiClient
};
