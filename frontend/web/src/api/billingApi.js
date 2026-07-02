import apiClient from "./apiClient";

export const billingApi = {
  getPlans: () => apiClient.get("/billing/plans"),
  getSummary: () => apiClient.get("/billing/summary"),
  updatePlan: (plan) => apiClient.post("/billing/upgrade", { plan }),
};
