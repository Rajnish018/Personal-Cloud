import apiClient from "./apiClient";

export const authApi = {
  register: (payload) => apiClient.post("/auth/register", payload),
  login: (payload) => apiClient.post("/auth/login", payload),
  refresh: () => apiClient.post("/auth/refresh", undefined, { skipGlobalError: true }),
  logout: () => apiClient.post("/auth/logout"),
  getProfile: () => apiClient.get("/users/profile"),
  updateProfile: (payload) => apiClient.put("/users/profile", payload),
  changePassword: (payload) => apiClient.put("/auth/change-password", payload),
  deleteAccount: () => apiClient.delete("/auth/delete-account"),
  restoreAccount: (payload) => apiClient.post("/auth/restore-account", payload),
};
