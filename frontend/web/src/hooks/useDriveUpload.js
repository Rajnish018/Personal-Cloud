import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { folderApi } from "../api/folderApi";
import { useUploadFile } from "../hooks/useFiles";

export const useDriveUpload = (folderId = null) => {
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const [progress, setProgress] = useState({});
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [isUploadingFolder, setIsUploadingFolder] = useState(false);

  const cleanFolderId = typeof folderId === "string" ? folderId.trim() : null;
  const uploadMutation = useUploadFile({ folderId: cleanFolderId });

  // Standard File upload handler
  const handleFileUploadChange = async (event) => {
    const acceptedFiles = Array.from(event.target.files || []);
    event.target.value = ""; // Reset input
    if (!acceptedFiles.length) return;

    setIsUploadingFiles(true);
    const toastId = toast.loading(`Uploading ${acceptedFiles.length} file(s)...`);

    try {
      for (const file of acceptedFiles) {
        await uploadMutation.mutateAsync({
          file,
          folderId: cleanFolderId,
          parentFolder: cleanFolderId,
          onUploadProgress: (e) => {
            if (!e.total) return;
            setProgress((prev) => ({
              ...prev,
              [file.name]: Math.round((e.loaded * 100) / e.total),
            }));
          },
        });
      }
      toast.success(acceptedFiles.length > 1 ? "All files uploaded" : "File uploaded", { id: toastId });
    } catch (error) {
      console.error("[useDriveUpload] File upload error:", error);
      toast.error("Failed to upload files", { id: toastId });
    } finally {
      setProgress({});
      setIsUploadingFiles(false);
    }
  };

  // Helper function to create/resolve path names
  const ensureFolderPath = async (pathParts, folderCache) => {
    let parentFolder = cleanFolderId;
    let cacheKey = "";

    for (const name of pathParts) {
      cacheKey = `${cacheKey}/${name}`;
      if (folderCache.has(cacheKey)) {
        parentFolder = folderCache.get(cacheKey);
        continue;
      }

      const response = await folderApi.createFolder({
        name,
        parentFolder,
        reuseExisting: true,
      });

      const newId = response?.data?.folder?._id || response?.folder?._id || response?.data?._id;
      if (!newId) throw new Error(`Subdirectory failure: ${name}`);

      parentFolder = newId;
      folderCache.set(cacheKey, parentFolder);
    }
    return parentFolder;
  };

  // Directory Folder upload handler
  const handleFolderUploadChange = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = ""; // Reset input
    if (!files.length) return;

    setIsUploadingFolder(true);
    const toastId = toast.loading("Structuring and uploading folder...");

    try {
      const folderCache = new Map();
      for (const file of files) {
        const relativePath = file.webkitRelativePath || file.name;
        const parts = relativePath.split("/").filter(Boolean);
        const pathParts = parts.slice(0, -1);

        const targetFolderId = await ensureFolderPath(pathParts, folderCache);

        await uploadMutation.mutateAsync({
          file,
          folderId: targetFolderId,
          parentFolder: targetFolderId,
          onUploadProgress: (e) => {
            if (!e.total) return;
            setProgress((prev) => ({
              ...prev,
              [relativePath]: Math.round((e.loaded * 100) / e.total),
            }));
          },
        });
      }
      toast.success("Folder uploaded successfully", { id: toastId });
    } catch (error) {
      console.error("[useDriveUpload] Folder directory upload failure:", error);
      toast.error("Failed to upload folder structural hierarchy", { id: toastId });
    } finally {
      setProgress({});
      setIsUploadingFolder(false);
    }
  };

  const triggerFileUpload = () => fileInputRef.current?.click();
  const triggerFolderUpload = () => folderInputRef.current?.click();

  return {
    fileInputRef,
    folderInputRef,
    isUploading: isUploadingFiles || isUploadingFolder,
    progress,
    triggerFileUpload,
    triggerFolderUpload,
    handleFileUploadChange,
    handleFolderUploadChange,
  };
};