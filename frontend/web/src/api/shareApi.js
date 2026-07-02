import apiClient from "./apiClient";

export const shareApi = {
  shareFile: (fileId, payload = {}) => apiClient.post(`/share/file/${fileId}`, payload),
  shareFolder: (folderId, payload = {}) =>
    apiClient.post(`/share/folder/${folderId}`, payload),
  getMyShares: () => apiClient.get("/share"),
  getSharedWithMe: () => apiClient.get("/share/shared-with-me"),
  getSharedResource: (shareToken) => apiClient.get(`/share/${shareToken}/resource`),
  downloadSharedFile: (shareToken) => apiClient.get(`/share/${shareToken}/download`),
  updatePermission: (shareId, payload) =>
    apiClient.put(`/share/${shareId}/permission`, payload),
  revokeShare: (shareId) => apiClient.delete(`/share/${shareId}`),
};
