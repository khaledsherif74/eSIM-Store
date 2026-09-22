import { apiClient } from "./apiClient.js";

export const adminApi = {
  login: (username, password) => apiClient.post("/api/admin/login", { username, password }),
  logout: () => apiClient.post("/api/admin/logout", {}),
  session: () => apiClient.get("/api/admin/session"),
  forgotPassword: (email) => apiClient.post("/api/admin/forgot-password", { email }),
  resetPassword: (token, newPassword) => apiClient.post("/api/admin/reset-password", { token, newPassword }),
  listOrders: ({ page = 1, pageSize = 25, status = "" } = {}) => {
    const params = new URLSearchParams({ page, pageSize, ...(status ? { status } : {}) });
    return apiClient.get(`/api/admin/orders?${params}`);
  },
  getOrder: (orderId) => apiClient.get(`/api/admin/orders/${encodeURIComponent(orderId)}`),
  triggerSync: () => apiClient.post("/api/admin/sync", {}),
  syncStatus: () => apiClient.get("/api/admin/sync/status"),
  getSettings: () => apiClient.get("/api/admin/settings"),
  updateSettings: (settings) => apiClient.put("/api/admin/settings", settings),
  getSecrets: () => apiClient.get("/api/admin/secrets"),
  updateSecret: (key, value) => apiClient.put("/api/admin/secrets", { key, value }),
  listClients: ({ page = 1, limit = 25, q = "" } = {}) => {
    const params = new URLSearchParams({ page, limit, ...(q ? { q } : {}) });
    return apiClient.get(`/api/admin/clients?${params}`);
  },
  getClientHistory: (userId) => apiClient.get(`/api/admin/clients/${userId}/history`),
};
