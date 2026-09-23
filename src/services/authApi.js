import { apiClient } from "./apiClient.js";

export const authApi = {
  signup: (data) => apiClient.post("/api/auth/signup", data),
  login: (data) => apiClient.post("/api/auth/login", data),
  logout: () => apiClient.post("/api/auth/logout", {}),
  getMe: () => apiClient.get("/api/auth/me"),
  updateProfile: (data) => apiClient.patch("/api/auth/me", data),
  changePassword: (data) => apiClient.patch("/api/auth/password", data),
  forgotPassword: (email) =>
    apiClient.post("/api/auth/forgot-password", {
      email,
    }),
  resetPassword: (token, newPassword) =>
    apiClient.post("/api/auth/reset-password", {
      token,
      newPassword,
    }),
};
