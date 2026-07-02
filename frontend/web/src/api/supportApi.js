import apiClient from "./apiClient";

export const supportApi = {
  createTicket: (payload) => apiClient.post("/support/ticket", payload),
  getTickets: () => apiClient.get("/support/tickets"),
  getTicket: (id) => apiClient.get(`/support/ticket/${id}`),
  reopenTicket: (id) => apiClient.patch(`/support/ticket/${id}/reopen`),
  sendChatMessage: (id, text) =>
    apiClient.post(`/support/ticket/${id}/messages`, { text }),
};

export default supportApi;
