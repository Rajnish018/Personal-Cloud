import { useState } from "react";
import { toast } from "react-hot-toast";
import {
  Clock3,
  FileText,
  Image as ImageIcon,
  Video,
  MoreVertical,
  History,
  Calendar,
  Download,
  Trash2,
  Share2,
  Loader2,
  AlertCircle,
  FileSpreadsheet,
  FileX,
} from "lucide-react";
import { fileApi } from "../../api";
import { useDeleteFile, useRecentFiles } from "../../hooks/useFiles";
import { useShareFile } from "../../hooks/useSharedFiles";
import { formatBytes, formatDate } from "../../utils/drive";

const getFileType = (file) => {
  if (file.resourceType === "image" || file.mimeType?.startsWith("image/")) return "image";
  if (file.resourceType === "video" || file.mimeType?.startsWith("video/")) return "video";
  if (
    file.mimeType?.includes("spreadsheet") ||
    file.mimeType?.includes("excel") ||
    ["csv", "xls", "xlsx"].includes(file.extension)
  ) {
    return "spreadsheet";
  }
  return "document";
};

const Recent = () => {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const { data: recentFiles = [], isLoading, isError, error } = useRecentFiles();
  const deleteFile = useDeleteFile();
  const shareFile = useShareFile();

  const toggleDropdown = (id, event) => {
    event.stopPropagation();
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  const handleDownload = async (file) => {
    setActiveDropdown(null);

    try {
      const data = await fileApi.downloadFile(file._id);
      window.open(data.downloadUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Download failed:", err);
      toast.error(err?.response?.data?.message || "Failed to prepare download.");
    }
  };

  const handleShare = async (file) => {
    setActiveDropdown(null);

    try {
      const result = await shareFile.mutateAsync({ fileId: file._id });
      const shareUrl = result?.shareUrl || result?.link || result?.url || result?.share?.shareLink;

      if (shareUrl) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Share link copied");
      }
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  const handleDelete = (file) => {
    setActiveDropdown(null);
    deleteFile.mutate(file._id);
  };

  const getFileIcon = (file) => {
    const type = getFileType(file);

    switch (type) {
      case "image":
        return (
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shrink-0">
            <ImageIcon size={18} />
          </div>
        );
      case "video":
        return (
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 shrink-0">
            <Video size={18} />
          </div>
        );
      case "spreadsheet":
        return (
          <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl border border-teal-100 shrink-0">
            <FileSpreadsheet size={18} />
          </div>
        );
      default:
        return (
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shrink-0">
            <FileText size={18} />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 antialiased selection:bg-[#185FA5]/10 select-none">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-4 sm:space-y-6">
        <header className="bg-white rounded-3xl border border-gray-200 p-4 sm:p-6 shadow-sm flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="p-2.5 sm:p-3 bg-gray-50 rounded-2xl text-gray-700 border border-gray-100 shrink-0">
              <Clock3 className="h-5 w-5 sm:h-6 sm:w-6 text-[#185FA5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                Timeline
              </div>
              <h1 className="text-xl font-extrabold tracking-tight text-gray-950 sm:text-2xl lg:text-3xl">
                Recent Files
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 hidden xs:block">
                Quickly review and manage files recently updated in your workspace.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl self-start sm:self-center">
            <History className="h-4 w-4 text-gray-400" />
            <div className="text-left">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 leading-none">Recent Items</div>
              <div className="text-xs font-extrabold text-gray-800 mt-0.5">
                {isLoading ? "..." : `${recentFiles.length} items`}
              </div>
            </div>
          </div>
        </header>

        <main className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden min-h-[340px] flex flex-col justify-center">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <Loader2 size={32} className="text-[#185FA5] animate-spin" />
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Loading recent files...</p>
            </div>
          )}

          {!isLoading && isError && (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-3 max-w-sm mx-auto">
              <div className="p-3 bg-red-50 text-red-600 rounded-2xl border border-red-100">
                <AlertCircle size={22} />
              </div>
              <h3 className="text-sm font-bold text-gray-800">Connection Interrupted</h3>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">
                {error?.response?.data?.message || "Failed to load recent files."}
              </p>
            </div>
          )}

          {!isLoading && !isError && recentFiles.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-3 max-w-sm mx-auto">
              <div className="p-3 bg-gray-50 text-gray-400 rounded-2xl border border-gray-100">
                <FileX size={22} />
              </div>
              <h3 className="text-sm font-bold text-gray-800">No recent files</h3>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">
                Files you upload, update, or download recently will appear here.
              </p>
            </div>
          )}

          {!isLoading && !isError && recentFiles.length > 0 && (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      <th className="px-6 py-4">File Name</th>
                      <th className="px-6 py-4">Last Modified</th>
                      <th className="px-6 py-4">Size</th>
                      <th className="px-6 py-4 text-right pr-10">Options</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {recentFiles.map((file) => (
                      <tr key={file._id} className="hover:bg-gray-50/40 group transition-all duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3.5">
                            {getFileIcon(file)}
                            <span className="font-bold text-gray-800 group-hover:text-[#185FA5] cursor-pointer transition-colors max-w-xs truncate block">
                              {file.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-gray-500 font-semibold text-xs">
                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                            <span>{formatDate(file.updatedAt || file.createdAt)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-400 font-bold text-xs">
                          {formatBytes(file.size)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right pr-6 relative">
                          <button
                            type="button"
                            onClick={(event) => toggleDropdown(file._id, event)}
                            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-all"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {activeDropdown === file._id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)} />
                              <div className="absolute right-6 top-12 w-44 bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 z-20 text-left animate-fade-in-fast">
                                <DropdownItem icon={Download} label="Download" onClick={() => handleDownload(file)} />
                                <DropdownItem icon={Share2} label="Share Link" onClick={() => handleShare(file)} />
                                <div className="border-t border-gray-100 my-1" />
                                <DropdownItem icon={Trash2} label="Remove" variant="danger" onClick={() => handleDelete(file)} />
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="block md:hidden divide-y divide-gray-100">
                {recentFiles.map((file) => (
                  <div key={file._id} className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50/30">
                    <div className="flex items-center gap-3 min-w-0">
                      {getFileIcon(file)}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate">{file.name}</p>
                        <div className="flex items-center gap-2 text-[11px] text-gray-400 font-semibold mt-0.5">
                          <span>{formatDate(file.updatedAt || file.createdAt)}</span>
                          <span>•</span>
                          <span>{formatBytes(file.size)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={(event) => toggleDropdown(file._id, event)}
                        className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-all"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {activeDropdown === file._id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)} />
                          <div className="absolute right-0 top-10 w-44 bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 z-20 text-left">
                            <DropdownItem icon={Download} label="Download" onClick={() => handleDownload(file)} />
                            <DropdownItem icon={Share2} label="Share Link" onClick={() => handleShare(file)} />
                            <div className="border-t border-gray-100 my-1" />
                            <DropdownItem icon={Trash2} label="Remove" variant="danger" onClick={() => handleDelete(file)} />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

const DropdownItem = ({ icon: Icon, label, variant, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-bold transition-colors ${
      variant === "danger" ? "text-red-600 hover:bg-red-50" : "text-gray-700 hover:bg-gray-50"
    }`}
  >
    <Icon size={14} className={variant === "danger" ? "text-red-500" : "text-gray-400"} />
    {label}
  </button>
);

export default Recent;
