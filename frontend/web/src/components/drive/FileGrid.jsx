import { Copy, Download, Edit3, MoreVertical, Share2, Star, Trash2, X } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "react-hot-toast";
import {
  useCopyFile,
  useDeleteFile,
  useFiles,
  useRecentFiles,
  useRenameFile,
  useStarredFiles,
  useToggleStarFile,
} from "../../hooks/useFiles";
import { useShareFile } from "../../hooks/useSharedFiles";
import { fileApi } from "../../api";
import { fileIconFor, formatBytes, formatDate } from "../../utils/drive";

const FileGrid = ({
  viewMode = "list",
  files: providedFiles,
  queryParams = {},
  variant = "files",
  searchFilter = "",
  isLoading: isLoadingOverride,
  isError: isErrorOverride,
  showActions = true,
}) => {
  const recentFilesQuery = useRecentFiles({
    enabled: variant === "recent" && !providedFiles,
  });
  const starredFilesQuery = useStarredFiles({
    enabled: variant === "starred" && !providedFiles,
  });
  
  // Only fetch files if NOT inside a specific folder (no providedFiles) and not a special variant
  const filesQuery = useFiles(providedFiles ? {} : queryParams, {
    enabled: variant === "files" && !providedFiles,
  });
  
  const activeFilesQuery =
    variant === "recent"
      ? recentFilesQuery
      : variant === "starred"
        ? starredFilesQuery
        : providedFiles ? { data: providedFiles, isLoading: false, isError: false } : filesQuery;
        
  const rawFiles = useMemo(
    () => providedFiles || activeFilesQuery.data || [],
    [activeFilesQuery.data, providedFiles]
  );
  const isLoading = isLoadingOverride ?? (!providedFiles && activeFilesQuery?.isLoading);
  const isError = isErrorOverride ?? (!providedFiles && activeFilesQuery?.isError);
  
  // Custom Mutation Hooks
  const deleteFile = useDeleteFile(queryParams);
  const toggleStar = useToggleStarFile();
  const copyFile = useCopyFile();
  const renameFile = useRenameFile();
  const shareFile = useShareFile();
  
  const [activeMenuId, setActiveMenuId] = useState(null);
  const isRecentVariant = variant === "recent";
  const nameColumnClass = isRecentVariant
    ? showActions
      ? "col-span-7 sm:col-span-7"
      : "col-span-8 sm:col-span-7"
    : "col-span-6 md:col-span-5";
  const sizeColumnClass = isRecentVariant
    ? showActions
      ? "col-span-3 sm:col-span-2"
      : "col-span-4 sm:col-span-2"
    : "col-span-3 md:col-span-2";
  const modifiedColumnClass = isRecentVariant
    ? showActions
      ? "hidden sm:block sm:col-span-2"
      : "hidden sm:block sm:col-span-3"
    : "hidden lg:block lg:col-span-2";
  const actionsColumnClass = isRecentVariant
    ? "col-span-2 text-right sm:col-span-1"
    : "col-span-3 text-right md:col-span-1 lg:col-span-1";

  // Safe Folder & Text Filter Processing
  const files = useMemo(() => {
    let filtered = [...rawFiles];

    // CRUCIAL: ALWAYS enforce folderId constraints locally if folderId context exists
    if (queryParams.folderId) {
      filtered = filtered.filter(
        (file) => 
          file.folderId === queryParams.folderId || 
          file.parentFolder === queryParams.folderId
      );
    }

    // Apply text search clean filter safely if not already processed by parent
    if (searchFilter) {
      filtered = filtered.filter((file) =>
        file.name?.toLowerCase().includes(searchFilter.trim().toLowerCase())
      );
    }

    return filtered;
  }, [rawFiles, queryParams.folderId, searchFilter]);

  const handleDownload = async (file) => {
    try {
      const data = await fileApi.downloadFile(file._id);
      window.open(data.downloadUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

 const shareFileHandler = async (file) => {
  try {
    // 1. Fire the mutation request
    const result = await shareFile.mutateAsync({ fileId: file._id });
    
    // 2. Extract the shareUrl straight from the root body parameters
    const shareUrl = result?.shareUrl || result?.link || result?.url || result?.share?.shareLink;
    console.log("Generated Share URL:", shareUrl);
    
    if (shareUrl) {
      // 3. IMMEDIATE BACKGROUND COPY SYSTEM
      // Creates a temporary, hidden DOM text node to copy synchronously before the browser event tracking expires
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      textArea.style.position = "fixed"; 
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      
      textArea.focus();
      textArea.select();
      
      let autoCopySuccess = false;
      try {
        document.execCommand("copy");
        autoCopySuccess = true;
      } catch (err) {
        console.error("Auto-copy background engine failed:", err);
      }
      
      document.body.removeChild(textArea);

      // 4. TRIGGER INTERACTIVE SUCCESS TOAST
      toast((t) => (
        <div className="flex flex-col gap-2 p-1">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-800">Link created successfully!</span>
            <span className="text-[11px] text-emerald-600 font-medium">
              {autoCopySuccess ? "✓ Copied to clipboard automatically" : "Please copy manual link below"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              readOnly 
              value={shareUrl} 
              className="text-[11px] bg-slate-100 border border-slate-200 p-1.5 rounded max-w-[180px] truncate outline-hidden font-mono text-slate-600"
            />
            <button
              type="button"
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  await navigator.clipboard.writeText(shareUrl);
                  toast.success("Copied!");
                  toast.dismiss(t.id);
                } catch {
                  toast.error("Manual copy blocked.");
                }
              }}
              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-bold shadow-xs active:scale-95 transition-all shrink-0"
            >
              {autoCopySuccess ? "Copy Again" : "Copy"}
            </button>
          </div>
        </div>
      ), { 
        duration: 5000,
        position: "bottom-right"
      });

    } else {
      toast.error("Failed to retrieve a valid sharing link structural payload.");
    }
  } catch (error) {
    console.error("Sharing sequence mutation execution failed:", error);
    toast.error(error?.response?.data?.message || "An unexpected error occurred while processing the link setup.");
  }
};

  const handleRename = (file) => {
    const nextName = window.prompt("Rename file", file.name || "");
    const cleanName = nextName?.trim();

    if (!cleanName || cleanName === file.name) return;

    renameFile.mutate({
      fileId: file._id,
      name: cleanName,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-3 py-2">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex h-12 animate-pulse items-center gap-4 rounded-xl bg-slate-100/80 px-4" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 text-center text-sm font-medium text-rose-600">
        Unable to load files.
      </div>
    );
  }

  if (!files.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
        No matching files found inside this directory.
      </div>
    );
  }

  const renderMenuItems = (file) => (
    <>
      <button
        type="button"
        onClick={() => { toggleStar.mutate(file._id); setActiveMenuId(null); }}
        className="flex w-full items-center gap-3 rounded-xl sm:rounded-lg px-4 sm:px-3 py-3.5 sm:py-2 text-left text-sm sm:text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
      >
        <Star size={16} className={file.isStarred ? "text-amber-500 fill-amber-500" : "text-slate-400"} />
        <span>{file.isStarred ? "Unstar File" : "Star File"}</span>
      </button>
      <button
        type="button"
        onClick={() => { handleRename(file); setActiveMenuId(null); }}
        className="flex w-full items-center gap-3 rounded-xl sm:rounded-lg px-4 sm:px-3 py-3.5 sm:py-2 text-left text-sm sm:text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
      >
        <Edit3 size={16} className="text-slate-400" />
        <span>Rename</span>
      </button>
      <button
        type="button"
        onClick={() => { handleDownload(file); setActiveMenuId(null); }}
        className="flex w-full items-center gap-3 rounded-xl sm:rounded-lg px-4 sm:px-3 py-3.5 sm:py-2 text-left text-sm sm:text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
      >
        <Download size={16} className="text-slate-400" />
        <span>Download</span>
      </button>
      <button
        type="button"
        onClick={() => { copyFile.mutate(file._id); setActiveMenuId(null); }}
        className="flex w-full items-center gap-3 rounded-xl sm:rounded-lg px-4 sm:px-3 py-3.5 sm:py-2 text-left text-sm sm:text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
      >
        <Copy size={16} className="text-slate-400" />
        <span>Make Copy</span>
      </button>
      <button
        type="button"
          onClick={() => { shareFileHandler(file); setActiveMenuId(null); }}
        className="flex w-full items-center gap-3 rounded-xl sm:rounded-lg px-4 sm:px-3 py-3.5 sm:py-2 text-left text-sm sm:text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
      >
        <Share2 size={16} className="text-slate-400" />
        <span>Share File</span>
      </button>
      <div className="my-1 border-t border-slate-100 hidden sm:block" />
      <button
        type="button"
        onClick={() => { deleteFile.mutate(file._id); setActiveMenuId(null); }}
        className="flex w-full items-center gap-3 rounded-xl sm:rounded-lg px-4 sm:px-3 py-3.5 sm:py-2 text-left text-sm sm:text-xs font-semibold text-rose-600 hover:bg-rose-50/80 transition-colors mt-2 sm:mt-0"
      >
        <Trash2 size={16} />
        <span>Move to Trash</span>
      </button>
    </>
  );

  /* ------------------ GRID VIEW ------------------ */
  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {files.map((file) => {
          const isMenuOpen = activeMenuId === file._id;

          return (
            <article
              key={file._id}
              className="group relative rounded-xl border border-slate-200 bg-white p-4 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.08)]"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 border border-slate-100">
                  {fileIconFor(file, 24)}
                </div>
                
                {showActions && (
                <div className="relative flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setActiveMenuId(isMenuOpen ? null : file._id); }}
                    className={`rounded-lg p-2 transition-colors ${isMenuOpen ? "bg-slate-100 text-slate-700" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"}`}
                  >
                    <MoreVertical size={16} />
                  </button>

                  {isMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40 bg-slate-900/20 sm:bg-transparent backdrop-blur-[1px] sm:backdrop-blur-none" onClick={() => setActiveMenuId(null)} />
                      
                      <div
                        className="hidden sm:block absolute right-0 top-10 z-50 w-44 origin-top-right rounded-xl border border-slate-200 bg-white p-1 shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-1 duration-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {renderMenuItems(file)}
                      </div>

                      <div 
                        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t border-slate-200 bg-white p-4 shadow-2xl transition-transform duration-200 animate-in slide-in-from-bottom-full sm:hidden"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
                          <div className="min-w-0 pr-4">
                            <h4 className="truncate text-sm font-bold text-slate-900">{file.name}</h4>
                            <p className="text-xs text-slate-400 font-medium">{formatBytes(file.size)}</p>
                          </div>
                          <button type="button" onClick={() => setActiveMenuId(null)} className="rounded-lg p-1.5 bg-slate-50 text-slate-400 active:bg-slate-100">
                            <X size={16} />
                          </button>
                        </div>
                        <div className="space-y-0.5">{renderMenuItems(file)}</div>
                      </div>
                    </>
                  )}
                </div>
                )}
              </div>

              <h3 className="mt-4 truncate text-sm font-semibold text-slate-900">{file.name}</h3>
              <p className="mt-1 text-xs text-slate-400 font-medium">
                {formatBytes(file.size)} · {formatDate(file.updatedAt || file.createdAt)}
              </p>

              {showActions && (
              <div className="mt-4 hidden sm:flex items-center gap-1 border-t border-slate-100 pt-3 text-slate-400">
                <button type="button" onClick={() => handleDownload(file)} className="rounded-lg p-2 hover:bg-slate-50 hover:text-slate-700 transition-colors" title="Download">
                  <Download size={15} />
                </button>
                <button type="button" onClick={() => copyFile.mutate(file._id)} className="rounded-lg p-2 hover:bg-slate-50 hover:text-slate-700 transition-colors" title="Make Copy">
                  <Copy size={15} />
                </button>
                <button type="button" onClick={() => shareFileHandler(file)} className="rounded-lg p-2 hover:bg-slate-50 hover:text-slate-700 transition-colors" title="Share">
                  <Share2 size={15} />
                </button>
                <button type="button" onClick={() => deleteFile.mutate(file._id)} className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors" title="Move to trash">
                  <Trash2 size={15} />
                </button>
              </div>
              )}
            </article>
          );
        })}
      </div>
    );
  }

  /* ------------------ LIST VIEW ------------------ */
  return (
    <div className="overflow-visible rounded-xl border border-slate-200/70 bg-white shadow-[0_2px_12px_-5px_rgba(0,0,0,0.02)]">
      <div className="grid grid-cols-12 border-b border-slate-200/80 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
        <div className={nameColumnClass}>Name</div>
        {!isRecentVariant && <div className="hidden md:block md:col-span-2">Type</div>}
        <div className={sizeColumnClass}>Size</div>
        <div className={modifiedColumnClass}>Modified</div>
        {showActions && <div className={actionsColumnClass}>Actions</div>}
      </div>

      <div className="divide-y divide-slate-100">
        {files.map((file) => {
          const isMenuOpen = activeMenuId === file._id;

          return (
            <div 
              key={file._id} 
              className={`grid grid-cols-12 items-center px-4 py-2.5 text-sm hover:bg-slate-50/80 transition-all ${
                isMenuOpen ? "relative z-40 bg-slate-50" : "relative z-0"
              }`}
            >
              <div className={`${nameColumnClass} flex min-w-0 items-center gap-3`}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 border border-slate-100">
                  {fileIconFor(file)}
                </span>
                <span className="truncate font-medium text-slate-700">{file.name}</span>
              </div>

              {!isRecentVariant && (
                <div className="hidden text-slate-400 font-medium md:col-span-2 md:block">
                  {file.extension || file.resourceType || "—"}
                </div>
              )}

              <div className={`${sizeColumnClass} text-slate-400 font-medium truncate`}>
                {formatBytes(file.size)}
              </div>

              <div className={`${modifiedColumnClass} text-slate-400`}>
                {formatDate(file.updatedAt || file.createdAt)}
              </div>

              {showActions && (
              <div className={`${actionsColumnClass} relative flex justify-end`}>
                <button 
                  type="button" 
                  onClick={(event) => {
                    event.stopPropagation();
                    setActiveMenuId(isMenuOpen ? null : file._id);
                  }}
                  className={`relative z-50 rounded-lg p-1.5 transition-colors ${isMenuOpen ? "bg-slate-200 text-slate-700" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"}`}
                >
                  <MoreVertical size={16} />
                </button>

                {isMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40 bg-slate-900/20 sm:bg-transparent backdrop-blur-[1px] sm:backdrop-blur-none cursor-default" onClick={() => setActiveMenuId(null)} />
                    <div
                      className="absolute right-0 top-10 z-50 w-44 origin-top-right rounded-xl border border-slate-200 bg-white p-1 shadow-xl ring-1 ring-black/5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {renderMenuItems(file)}
                    </div>
                  </>
                )}
              </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FileGrid;
