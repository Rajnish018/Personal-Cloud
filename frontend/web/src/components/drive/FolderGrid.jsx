import { Edit3, Folder, MoreVertical, Share2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useDeleteFolder, useFolders, useRenameFolder } from "../../hooks/useFolders";
import { useShareFolder } from "../../hooks/useSharedFiles";
import { formatDate } from "../../utils/drive";

const FolderGrid = ({ 
  viewMode = "grid", 
  folders: providedFolders, 
  queryParams = {}, 
  searchFilter = "",
  onFolderClick // New callback prop captured from MyDrive
}) => {
  // Only fetch root folders if NOT inside a specific folder (no providedFolders)
  const foldersQuery = useFolders(providedFolders ? {} : queryParams);
  const rawFolders = providedFolders || foldersQuery.data || [];
  const isLoading = !providedFolders && foldersQuery.isLoading;
  const isError = !providedFolders && foldersQuery.isError;
  const deleteFolder = useDeleteFolder();
  const renameFolder = useRenameFolder();
  const shareFolder = useShareFolder();

  const [activeMenuId, setActiveMenuId] = useState(null);

  // Client side fallback filter to guarantee non-matching folders vanish instantly
  const folders = rawFolders.filter((folder) =>
    searchFilter ? folder.name.toLowerCase().includes(searchFilter) : true
  );

  const copyShareUrl = async (shareUrl) => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied");
    } catch {
      toast((t) => (
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="max-w-56 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600"
          />
          <button
            type="button"
            onClick={() => toast.dismiss(t.id)}
            className="rounded bg-slate-900 px-2 py-1 text-xs font-semibold text-white"
          >
            Done
          </button>
        </div>
      ));
    }
  };

  const handleShareFolder = async (folder) => {
    try {
      const result = await shareFolder.mutateAsync({ folderId: folder._id });
      const shareUrl = result?.shareUrl || result?.share?.shareLink;
      if (shareUrl) {
        await copyShareUrl(shareUrl);
      }
    } catch {
      // The mutation hook shows the user-facing error toast.
    }
  };

  const handleRenameFolder = (folder) => {
    const nextName = window.prompt("Rename folder", folder.name || "");
    const cleanName = nextName?.trim();

    if (!cleanName || cleanName === folder.name) return;

    renameFolder.mutate({
      folderId: folder._id,
      name: cleanName,
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex h-24 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 text-center text-sm font-medium text-rose-600">
        Unable to load folders.
      </div>
    );
  }

  if (!folders.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
        No matching folders found.
      </div>
    );
  }

  /* ------------------ LIST VIEW ------------------ */
  if (viewMode === "list") {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-[0_2px_12px_-5px_rgba(0,0,0,0.02)]">
        {folders.map((folder) => {
          const isMenuOpen = activeMenuId === folder._id;

          return (
            <div 
              key={folder._id} 
              className="grid grid-cols-12 items-center border-b border-slate-100 px-4 py-2.5 text-sm last:border-0 hover:bg-slate-50/80 transition-all cursor-pointer group"
              onClick={() => onFolderClick?.(folder)} // Opens the folder on row item click
            >
              <div className="col-span-6 flex items-center gap-3 min-w-0">
                <span className="rounded-lg bg-blue-50/80 p-2 text-[#185FA5] shrink-0 border border-blue-100/50 group-hover:bg-blue-100 transition-colors">
                  <Folder size={16} fill="currentColor" fillOpacity={0.1} />
                </span>
                <span className="font-medium text-slate-700 truncate group-hover:text-indigo-600 transition-colors">
                  {folder.name}
                </span>
              </div>
              <div className="col-span-4 text-slate-400 font-medium text-xs select-none">
                Updated {formatDate(folder.updatedAt || folder.createdAt)}
              </div>
              
              <div className="col-span-2 text-right relative flex justify-end">
                <button 
                  type="button" 
                  onClick={(e) => {
                    e.stopPropagation(); // STOPS the row click navigation from firing
                    setActiveMenuId(isMenuOpen ? null : folder._id);
                  }}
                  className={`rounded-lg p-1.5 transition-colors relative z-20 ${isMenuOpen ? "bg-slate-100 text-slate-700" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"}`}
                >
                  <MoreVertical size={16} />
                </button>

                {isMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }} />
                    <div 
                      className="absolute right-0 top-8 z-20 w-40 origin-top-right rounded-xl border border-slate-200 bg-white p-1 shadow-lg ring-1 ring-black/5 animate-in fade-in slide-in-from-top-1 duration-100"
                      onClick={(e) => e.stopPropagation()} // Keeps popover clicks safe
                    >
                      <button
                        type="button"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleShareFolder(folder);
                          setActiveMenuId(null); 
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        <Share2 size={14} />
                        <span>Share Folder</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleRenameFolder(folder);
                          setActiveMenuId(null); 
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        <Edit3 size={14} />
                        <span>Rename</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          deleteFolder.mutate(folder._id); 
                          setActiveMenuId(null); 
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 size={14} />
                        <span>Delete Folder</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  /* ------------------ GRID VIEW ------------------ */
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      {folders.map((folder) => {
        const isMenuOpen = activeMenuId === folder._id;

        return (
          <article 
            key={folder._id} 
            onClick={() => onFolderClick?.(folder)} // Opens the folder on card click
            className="group relative rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.08)] cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-blue-50/80 border border-blue-100/50 p-2.5 text-[#185FA5] group-hover:bg-blue-100 transition-colors">
                <Folder size={20} fill="currentColor" fillOpacity={0.15} />
              </div>
              
              <div className="relative">
                <button 
                  type="button" 
                  onClick={(e) => {
                    e.stopPropagation(); // STOPS the folder navigation from firing when managing the menu
                    setActiveMenuId(isMenuOpen ? null : folder._id);
                  }}
                  className={`rounded-lg p-1 transition-colors relative z-20 ${
                    isMenuOpen ? "bg-slate-100 text-slate-700" : "text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-600"
                  }`}
                >
                  <MoreVertical size={16} />
                </button>

                {isMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }} />
                    <div 
                      className="absolute right-0 top-7 z-20 w-36 origin-top-right rounded-xl border border-slate-200 bg-white p-1 shadow-lg ring-1 ring-black/5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleShareFolder(folder);
                          setActiveMenuId(null); 
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-gray-600 hover:bg-gray-50"
                      >
                        <Share2 size={14} />
                        <span>Share</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleRenameFolder(folder);
                          setActiveMenuId(null); 
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-gray-600 hover:bg-gray-50"
                      >
                        <Edit3 size={14} />
                        <span>Rename</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          deleteFolder.mutate(folder._id); 
                          setActiveMenuId(null); 
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <h3 className="mt-4 truncate text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
              {folder.name}
            </h3>
            <p className="mt-1 text-xs text-slate-400 font-medium">
              Updated {formatDate(folder.updatedAt || folder.createdAt)}
            </p>
          </article>
        );
      })}
    </div>
  );
};

export default FolderGrid;
