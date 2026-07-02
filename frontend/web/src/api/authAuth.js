import apiClient from "./apiClient";

export const authApi = {
  login: (data) => apiClient.post("/auth/login", data),

  register: (data) => apiClient.post("/auth/register", data),

  logout: () => apiClient.post("/auth/logout"),

  forgotPassword: (email) =>
    apiClient.post("/auth/forgot-password", { email }),

  verifyOtp: (data) =>
    apiClient.post("/auth/verify-otp", data),

  resetPassword: (data) =>
    apiClient.post("/auth/reset-password", data),
};