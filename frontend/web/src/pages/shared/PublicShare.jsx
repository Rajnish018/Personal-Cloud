import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { 
  Download, 
  FileText, 
  Folder, 
  Loader2, 
  ShieldAlert, 
  Eye, 
  Layers,
  ArrowLeft
} from "lucide-react";
import { shareApi } from "../../api";
import { useSharedResource } from "../../hooks/useSharedFiles";
import { fileIconFor, formatBytes, formatDate } from "../../utils/drive";

const PublicShare = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useSharedResource(token);
  const [isDownloading, setIsDownloading] = useState(false);

  const resource = data?.resource;
  const share = data?.share;
  const childFiles = data?.files || [];
  const childFolders = data?.folders || [];
  
  const ownerName = share?.owner?.name || share?.owner?.email || "External User";
  const isFolder = share?.resourceType === "folder";
  const canDownload = (share?.permissions || []).some((permission) =>
    ["download", "edit", "owner"].includes(permission)
  );

  const itemCountLabel = useMemo(() => {
    if (!isFolder) return formatBytes(resource?.size);
    const count = childFiles.length + childFolders.length;
    return `${count} ${count === 1 ? "item" : "items"}`;
  }, [childFiles.length, childFolders.length, isFolder, resource?.size]);

  // Download file and save directly to the computer
  const handleDownload = async () => {
    if (isDownloading || !canDownload) return;
    setIsDownloading(true);

    try {
      const result = await shareApi.downloadSharedFile(token);
      let downloadUrl = result.downloadUrl;

      // If API returns raw binary stream blob instead of a pre-made URL string
      if (!downloadUrl) {
        const blob = new Blob([result], { type: resource?.mimeType || "application/octet-stream" });
        downloadUrl = window.URL.createObjectURL(blob);
      }

      // Create a hidden anchor element to force the save pipeline
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", resource?.name || "download");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the locally allocated blob URL memory if applicable
      if (!result.downloadUrl) {
        setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 100);
      }

      toast.success("Download started successfully.");
    } catch (err) {
      console.error("Download failed:", err);
      toast.error(err?.response?.data?.message || "Unable to download file.");
    } finally {
      setIsDownloading(false);
    }
  };

  const errorMessage = error?.response?.data?.message || "This shared link is no longer valid or has expired.";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900 flex flex-col justify-between font-sans">
      
      {/* FIXED NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 w-full border-b border-slate-200 bg-white/85 backdrop-blur-md px-4 py-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <Layers className="h-5 w-5 text-indigo-600" />
            <span className="text-sm">CloudDrive <span className="font-normal text-slate-400">| Public Share</span></span>
          </div>
          <button 
            onClick={() => navigate("/login")}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* MAIN CONTENT (pt-20 prevents the fixed navbar from overlapping the card) */}
      <main className="mx-auto flex-1 w-full max-w-5xl flex flex-col px-4 pt-24 pb-10 sm:px-6 lg:px-8 justify-center">
        <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          
          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-700">Accessing Portal</p>
                <p className="text-xs text-slate-400 mt-0.5">Fetching shared resources safely...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {isError && !isLoading && (
            <div className="flex flex-col items-center justify-center gap-4 text-center p-8 py-16 max-w-md mx-auto">
              <div className="rounded-2xl bg-rose-50 border border-rose-100 p-3 text-rose-600">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Shared item unavailable</h1>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">{errorMessage}</p>
              </div>
              <button 
                onClick={() => navigate("/")}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline"
              >
                <ArrowLeft size={14} />
                Return Home
              </button>
            </div>
          )}

          {/* Success / Loaded State */}
          {!isLoading && !isError && (
            <div className="divide-y divide-slate-100">
              
              {/* Header Info Banner */}
              <header className="p-6 sm:p-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                    {isFolder ? <Folder className="h-6 w-6 text-indigo-600 fill-indigo-50" /> : fileIconFor(resource, 24)}
                  </div>
                  <div className="min-w-0">
                    <span className="inline-block px-2 py-0.5 rounded bg-slate-100 border text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Shared by {ownerName}
                    </span>
                    <h1 className="truncate text-xl font-bold text-slate-900 tracking-tight sm:text-2xl">
                      {resource?.name || "Shared item"}
                    </h1>
                    <p className="mt-1 text-xs text-slate-500 font-medium flex items-center gap-1.5 flex-wrap">
                      <span>{itemCountLabel}</span>
                      {resource?.updatedAt && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span>Modified {formatDate(resource.updatedAt)}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Download Button */}
                {!isFolder && canDownload && (
                  <button
                    type="button"
                    disabled={isDownloading}
                    onClick={handleDownload}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0 cursor-pointer"
                  >
                    {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    Download File
                  </button>
                )}
              </header>

              {/* Main Content Body */}
              <div className="p-6 sm:p-8 bg-slate-50/50">
                {isFolder ? (
                  /* Folder Directory View */
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
                    <div className="grid grid-cols-12 border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 select-none">
                      <div className="col-span-7 sm:col-span-8">Item Name</div>
                      <div className="col-span-3 sm:col-span-2 text-right sm:text-left">Size</div>
                      <div className="hidden sm:block sm:col-span-2 text-right">Type</div>
                    </div>
                    
                    <div className="divide-y divide-slate-100">
                      {[...childFolders, ...childFiles].length ? (
                        <>
                          {childFolders.map((folder) => (
                            <div key={folder._id} className="grid grid-cols-12 items-center px-4 py-3 text-sm hover:bg-slate-50/50 group transition-colors">
                              <div className="col-span-7 sm:col-span-8 flex min-w-0 items-center gap-3">
                                <Folder className="h-5 w-5 shrink-0 text-indigo-500 fill-indigo-50/20 group-hover:scale-105 transition-transform" />
                                <span className="truncate font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">{folder.name}</span>
                              </div>
                              <div className="col-span-3 sm:col-span-2 text-right sm:text-left text-xs font-medium text-slate-400">—</div>
                              <div className="hidden sm:block sm:col-span-2 text-right text-xs font-bold text-slate-400 uppercase tracking-wide">Folder</div>
                            </div>
                          ))}
                          
                          {childFiles.map((file) => (
                            <div key={file._id} className="grid grid-cols-12 items-center px-4 py-3 text-sm hover:bg-slate-50/50 group transition-colors">
                              <div className="col-span-7 sm:col-span-8 flex min-w-0 items-center gap-3">
                                <span className="shrink-0 group-hover:scale-105 transition-transform">{fileIconFor(file)}</span>
                                <span className="truncate font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">{file.name}</span>
                              </div>
                              <div className="col-span-3 sm:col-span-2 text-right sm:text-left text-xs font-semibold text-slate-400">{formatBytes(file.size)}</div>
                              <div className="hidden sm:block sm:col-span-2 text-right text-xs font-bold text-slate-400 uppercase tracking-wide truncate">{file.extension || "File"}</div>
                            </div>
                          ))}
                        </>
                      ) : (
                        /* Empty Folder State */
                        <div className="flex flex-col items-center justify-center gap-2.5 px-4 py-16 text-center text-slate-400">
                          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-700">This folder is empty</p>
                            <p className="text-xs text-slate-400 mt-0.5">No files found inside this directory.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Single File Preview Card View */
                  <div className="flex flex-col items-center justify-center py-10 px-4 border border-dashed border-slate-200 bg-white rounded-xl text-center max-w-xl mx-auto shadow-xs">
                    <div className="p-4 bg-indigo-50/50 border border-indigo-100/50 text-indigo-600 rounded-2xl mb-4">
                      {fileIconFor(resource, 40)}
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 break-all max-w-md px-2">
                      {resource?.name || "Shared File"}
                    </h3>
                    <p className="text-xs font-semibold text-slate-400 mt-1">
                      Size: {formatBytes(resource?.size)}
                    </p>
                    
                    <div className="mt-6 flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100 text-xs font-medium text-slate-400 select-none">
                      <Eye size={14} />
                      <span>
                        {canDownload
                          ? "Anyone with this link can view and download this file"
                          : "Anyone with this link can view this file. Downloads are disabled by the owner"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-5 text-[11px] text-slate-400 font-medium">
        © {new Date().getFullYear()} CloudDrive. All rights reserved.
      </footer>
    </div>
  );
};

export default PublicShare;
