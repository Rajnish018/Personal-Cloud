import { useRef, useState } from "react";
// import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useDropzone } from "react-dropzone";
import { FolderUp, Loader2, Upload } from "lucide-react";

import { folderApi } from "../../api";
import { useUploadFile } from "../../hooks/useFiles";

const UploadButton = ({ compact = false, folderId = null }) => {
  const folderInputRef = useRef(null);
  // const queryClient = useQueryClient();
  const [progress, setProgress] = useState({});
  const [isUploadingFolder, setIsUploadingFolder] = useState(false);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  // Cleanly normalize context string representations
  const cleanFolderContextId = typeof folderId === 'string' ? folderId.trim() : null;

  // Pass active subfolder location straight to custom uploading state hooks
  const uploadMutation = useUploadFile({ folderId: cleanFolderContextId });

  // Handle standard flat multi-file selections or drag-and-drops
  const uploadFiles = async (acceptedFiles, targetFolderId = cleanFolderContextId) => {
    if (!acceptedFiles.length) return;
    setIsUploadingFiles(true);
    
    const toastId = toast.loading(`Uploading ${acceptedFiles.length} file(s)...`);
    try {
      const destinationString = typeof targetFolderId === 'string' ? targetFolderId : null;

      for (const file of acceptedFiles) {
        await uploadMutation.mutateAsync({
          file,
          folderId: destinationString,
          parentFolder: destinationString,
          onUploadProgress: (event) => {
            if (!event.total) return;
            setProgress((prev) => ({
              ...prev,
              [file.name]: Math.round((event.loaded * 100) / event.total),
            }));
          },
        });
      }

      // Single definitive success trigger after the entire queue processes
      toast.success(
        acceptedFiles.length > 1 ? "All files uploaded successfully" : "File uploaded successfully", 
        { id: toastId }
      );
    } catch (error) {
      console.error("[UploadButton] Single file stream upload error:", error);
      toast.error("Failed to complete file upload queue", { id: toastId });
    } finally {
      setProgress({});
      setIsUploadingFiles(false);
    }
  };

  // Helper routine generating sub-directories
  const ensureFolderPath = async (pathParts, folderCache) => {
    let parentFolder = cleanFolderContextId; 
    let cacheKey = "";

    for (const name of pathParts) {
      cacheKey = `${cacheKey}/${name}`;

      if (folderCache.has(cacheKey)) {
        const cachedValue = folderCache.get(cacheKey);
        parentFolder = typeof cachedValue === 'string' ? cachedValue : cachedValue?._id || cachedValue?.id;
        continue;
      }

      const response = await folderApi.createFolder({
        name,
        parentFolder, 
        reuseExisting: true,
      });

      const newFolderId = response?.data?.folder?._id || response?.folder?._id || response?.data?._id;
      
      if (!newFolderId) {
        throw new Error(`Failed to establish subdirectory reference for path segment: ${name}`);
      }

      parentFolder = newFolderId;
      folderCache.set(cacheKey, parentFolder);
    }

    return parentFolder;
  };

  // Handle nested hierarchy uploads
  const uploadFolder = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (!files.length) return;
    setIsUploadingFolder(true);
    
    const toastId = toast.loading("Structuring and uploading folder directory...");

    try {
      const folderCache = new Map();

      for (const file of files) {
        const relativePath = file.webkitRelativePath || file.name;
        const parts = relativePath.split("/").filter(Boolean);
        const pathParts = parts.slice(0, -1);
        
        const targetFolderId = await ensureFolderPath(pathParts, folderCache);
        const destinationString = typeof targetFolderId === 'string' ? targetFolderId : null;

        await uploadMutation.mutateAsync({
          file,
          folderId: destinationString,
          parentFolder: destinationString,
          onUploadProgress: (event) => {
            if (!event.total) return;
            setProgress((prev) => ({
              ...prev,
              [relativePath]: Math.round((event.loaded * 100) / event.total),
            }));
          },
        });
      }

      toast.success("Folder directory structured and uploaded successfully", { id: toastId });
    } catch (error) {
      console.error("[UploadButton] Nested structure construction failure:", error);
      toast.error("Failed to upload structured folder directory", { id: toastId });
    } finally {
      setProgress({});
      setIsUploadingFolder(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: uploadFiles,
    noClick: true,
    noKeyboard: true,
    multiple: true,
  });

  const currentProgress = Object.values(progress).at(-1);
  const isUploading = isUploadingFiles || isUploadingFolder;

  const primaryLabel = isUploading
    ? `${currentProgress || 0}%`
    : compact
      ? "Upload"
      : "Upload Files";

  const folderLabel = isUploadingFolder ? "Folder..." : "Folder";

  const controls = (
    <>
      <input {...getInputProps()} />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        webkitdirectory=""
        directory=""
        onChange={uploadFolder}
        className="hidden"
      />
      <button
        type="button"
        onClick={open}
        disabled={isUploading}
        className="inline-flex h-11 items-center justify-center gap-2.5 rounded-xl bg-[#185FA5] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#14508c] disabled:opacity-70 active:scale-98"
      >
        {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
        {primaryLabel}
      </button>
      <button
        type="button"
        onClick={() => folderInputRef.current?.click()}
        disabled={isUploading}
        className="inline-flex h-11 items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-70 active:scale-98"
      >
        <FolderUp size={18} />
        {!compact && "Upload "}
        {folderLabel}
      </button>
    </>
  );

  if (compact) {
    return <div className="flex flex-wrap items-center gap-2">{controls}</div>;
  }

  return (
    <div
      {...getRootProps()}
      className={`rounded-xl border border-dashed p-4 transition ${isDragActive ? "border-[#185FA5] bg-blue-50" : "border-slate-200 bg-white"}`}
    >
      <div className="flex flex-wrap items-center gap-2">{controls}</div>
      <p className="mt-2 text-xs text-slate-500 select-none">
        Drag files here or upload files and folders.
      </p>
    </div>
  );
};

export default UploadButton;