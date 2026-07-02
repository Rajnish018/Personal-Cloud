import apiClient from "./apiClient";

export const folderApi = {
  getRootFolders: (params = {}) => apiClient.get("/folders", { params }),
  getTrashFolders: () => apiClient.get("/folders/trash"),
  getFolderContents: (folderId, params = {}) =>
    apiClient.get(`/folders/${folderId}`, { params }),
  createFolder: (payload) =>
    apiClient.post("/folders", {
      ...payload,
      parentFolder: payload.parentFolder ?? payload.parentId,
    }),
  renameFolder: (folderId, payload) =>
    apiClient.put(`/folders/${folderId}`, payload),
  moveFolder: (folderId, payload) => apiClient.put(`/folders/${folderId}/move`, payload),
  deleteFolder: (folderId) => apiClient.delete(`/folders/${folderId}`),
  restoreFolder: (folderId) => apiClient.put(`/folders/${folderId}/restore`),
  permanentlyDeleteFolder: (folderId) =>
    apiClient.delete(`/folders/${folderId}/permanent`),
  emptyTrash: () => apiClient.delete("/folders/trash/empty"),
};
