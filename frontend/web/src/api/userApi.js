import apiClient from "./apiClient";

export const userApi = {
  // Authentication
  register: (payload) => apiClient.post("/auth/register", payload),

  login: (payload) => apiClient.post("/auth/login", payload),

  refresh: () =>
    apiClient.post("/auth/refresh", undefined, {
      skipGlobalError: true,
    }),

  logout: () => apiClient.post("/auth/logout"),

  changePassword: (payload) =>
    apiClient.put("/auth/change-password", payload),

  deleteAccount: () => apiClient.delete("/auth/delete-account"),

  // User Profile
  getProfile: () => apiClient.get("/users/profile"),

  updateProfile: (payload) =>
    apiClient.put("/users/profile", payload),

  uploadAvatar: ({ file, onUploadProgress }) => {
    const formData = new FormData();
    formData.append("avatar", file);

    return apiClient.post("/users/profile/avatar", formData, {
      onUploadProgress,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Email Verification
  verifyEmailSend: () =>
    apiClient.post("/users/verify-email/send"),

  verifyEmailOtp: (otp) =>
    apiClient.post("/users/verify-email/confirm", {
      otp,
    }),

  resendEmailOtp: () =>
    apiClient.post("/users/verify-email/resend"),
};