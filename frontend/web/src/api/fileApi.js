import apiClient from "./apiClient";

export const fileApi = {
  getFiles: (params = {}) => apiClient.get("/files", { params }),
  getRecentFiles: () => apiClient.get("/files/recent"),
  getStarredFiles: () => apiClient.get("/files/starred"),
  getTrashFiles: () => apiClient.get("/files/trash"),
  getFile: (fileId) => apiClient.get(`/files/${fileId}`),
 uploadFile: ({ file, folderId, parentFolder, onUploadProgress }) => {
  const formData = new FormData();
  formData.append("file", file);

  // Extract a clean string ID, avoiding empty arrays or objects
  let folderKey = null;
  
  if (typeof folderId === 'string' && folderId.trim() !== '') {
    folderKey = folderId;
  } else if (typeof parentFolder === 'string' && parentFolder.trim() !== '') {
    folderKey = parentFolder;
  }

  console.log("[fileApi.uploadFile] Checked payload folderKey Destination String:", folderKey);

  if (folderKey) {
    formData.append("folderId", folderKey);
    formData.append("parentFolder", folderKey);
  }

  return apiClient.post("/files/upload", formData, { onUploadProgress });
},
  renameFile: (fileId, payload) => apiClient.put(`/files/${fileId}/rename`, payload),
  moveFile: (fileId, payload) => apiClient.put(`/files/${fileId}/move`, payload),
  copyFile: (fileId) => apiClient.post(`/files/${fileId}/copy`),
  toggleStarFile: (fileId) => apiClient.put(`/files/${fileId}/star`),
  downloadFile: (fileId) => apiClient.get(`/files/${fileId}/download`),
  deleteFile: (fileId) => apiClient.delete(`/files/${fileId}`),
  restoreFile: (fileId) => apiClient.put(`/files/${fileId}/restore`),
  permanentlyDeleteFile: (fileId) => apiClient.delete(`/files/${fileId}/permanent`),
  emptyTrash: () => apiClient.delete("/files/trash/empty"),
  getStorageMetrics: () => apiClient.get("/files/storage-metrics"),
  
};
