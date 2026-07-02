import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  HardDrive,
  Clock3,
  Star,
  Share2,
  Trash2,
  Settings,
  ChevronRight,
  Cloud,
  X,
  Menu,
  FolderOpen,
  FileText,
  Plus,
  // Search,
  ChevronDown,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { useRecentFiles, useStarredFiles, useStorageMetrics, useTrashFiles } from "../../hooks/useFiles";
import { useMyShares } from "../../hooks/useSharedFiles";
import { useDriveUpload } from "../../hooks/useDriveUpload"; // 🛠️ Import our new hook

const Sidebar = ({ 
  isMobile = false, 
  onItemClick, 
  onClose,
  onCreateFolder, // Callback function showing a new folder prompt/modal
  currentFolderId = null // Pass dynamic path context if navigating nested folders
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showNewMenu, setShowNewMenu] = useState(false);
  // const [searchQuery, setSearchQuery] = useState("");
  const [storageExpanded, setStorageExpanded] = useState(true);

  // Hook up core file system drivers
  const {
    fileInputRef,
    folderInputRef,
    isUploading,
    triggerFileUpload,
    triggerFolderUpload,
    handleFileUploadChange,
    handleFolderUploadChange,
  } = useDriveUpload(currentFolderId);

  // Fetch live metrics data
  const { data: recentFiles } = useRecentFiles();
  const { data: starredFiles } = useStarredFiles();
  const { data: trashFiles } = useTrashFiles();
  const { data: shares } = useMyShares();

  const currentRecentCount = (recentFiles || []).length;
  const currentStarredCount = (starredFiles || []).length;
  const currentTrashCount = (trashFiles || []).length;
  const currentSharedCount = (shares || []).length;

  const lastSeenRecent = Number(localStorage.getItem("lastSeenRecent") || 0);
  const lastSeenStarred = Number(localStorage.getItem("lastSeenStarred") || 0);
  const lastSeenTrash = Number(localStorage.getItem("lastSeenTrash") || 0);
  const lastSeenShared = Number(localStorage.getItem("lastSeenShared") || 0);

  useEffect(() => {
    if (location.pathname === "/recent") localStorage.setItem("lastSeenRecent", currentRecentCount);
    if (location.pathname === "/starred") localStorage.setItem("lastSeenStarred", currentStarredCount);
    if (location.pathname === "/trash") localStorage.setItem("lastSeenTrash", currentTrashCount);
    if (location.pathname === "/shared") localStorage.setItem("lastSeenShared", currentSharedCount);
  }, [location.pathname, currentRecentCount, currentStarredCount, currentTrashCount, currentSharedCount]);

  const unreadRecent = currentRecentCount > lastSeenRecent ? currentRecentCount - lastSeenRecent : 0;
  const unreadStarred = currentStarredCount > lastSeenStarred ? currentStarredCount - lastSeenStarred : 0;
  const unreadTrash = currentTrashCount > lastSeenTrash ? currentTrashCount - lastSeenTrash : 0;
  const unreadShared = currentSharedCount > lastSeenShared ? currentSharedCount - lastSeenShared : 0;

  const { data: storageMetrics } = useStorageMetrics();
  
  const rawUsedBytes = storageMetrics?.usedSpaceBytes || 0;
  const rawTotalBytes = storageMetrics?.totalSpaceBytes || (15 * Math.pow(1024, 3));

  // console.log("[Sidebar] Storage Metrics:", { rawUsedBytes, rawTotalBytes, storageMetrics });
  const formatStorageValue = (bytes) => {
    const mb = bytes / Math.pow(1024, 2);
    const gb = bytes / Math.pow(1024, 3);
    return gb < 0.1 ? `${mb.toFixed(0)} MB` : `${gb.toFixed(1)} GB`;
  };

  const storagePercent = rawTotalBytes > 0 ? Math.min((rawUsedBytes / rawTotalBytes) * 100, 100) : 0;
  const rawFreeBytes = Math.max(rawTotalBytes - rawUsedBytes, 0);

  const mainMenuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { name: "My Drive", icon: HardDrive, path: "/drive" },
    { name: "Shared", icon: Share2, path: "/shared", badge: unreadShared > 0 ? unreadShared : null },
    { name: "Recent", icon: Clock3, path: "/recent", badge: unreadRecent > 0 ? unreadRecent : null },
    { name: "Starred", icon: Star, path: "/starred", badge: unreadStarred > 0 ? unreadStarred : null },
    { name: "Trash", icon: Trash2, path: "/trash", badge: unreadTrash > 0 ? unreadTrash : null },
  ];

  const sidebarWidth = isCollapsed ? "w-20" : "w-72";
  const mobileClasses = isMobile ? "w-full h-full" : `hidden md:flex sticky top-0 ${sidebarWidth}`;

  const handleMenuAction = (actionCallback) => {
    setShowNewMenu(false);
    if (actionCallback) actionCallback();
    if (onItemClick) onItemClick(); 
  };

  return (
    <>
      {/* Hidden Native File Element Drivers */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileUploadChange}
        className="hidden"
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        webkitdirectory=""
        directory=""
        onChange={handleFolderUploadChange}
        className="hidden"
      />

      {/* Mobile Overlay */}
      {isMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          h-screen border-r border-slate-200/80 bg-white flex flex-col flex-shrink-0 select-none
          transition-all duration-300 ease-in-out z-50
          ${mobileClasses}
          ${isMobile ? "fixed left-0 top-0 shadow-2xl" : ""}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-slate-100">
          <Link
            to="/dashboard"
            onClick={onItemClick}
            className={`flex items-center gap-3 group ${isCollapsed && !isMobile ? "justify-center w-full" : ""}`}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#185FA5] to-[#0d3a66] text-white shadow-lg shadow-[#185FA5]/20 shrink-0">
              <Cloud size={18} className="text-white/90" />
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <span className="text-[15px] font-bold tracking-tight text-slate-900 group-hover:text-[#185FA5] transition-colors duration-200 block">
                  Personal Cloud
                </span>
              </div>
            )}
          </Link>

          <div className="flex items-center gap-1">
            {!isMobile && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                title={isCollapsed ? "Expand" : "Collapse"}
              >
                {isCollapsed ? <ChevronRight size={16} /> : <Menu size={16} />}
              </button>
            )}
            {isMobile && (
              <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          {/* New Button */}
          <div className="px-4 py-4">
            <div className="relative">
              <button
                onClick={() => setShowNewMenu(!showNewMenu)}
                disabled={isUploading}
                className={`
                  flex items-center gap-2.5 rounded-xl bg-[#185FA5] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#185FA5]/25
                  transition-all duration-200 hover:bg-[#14508c] hover:shadow-xl hover:shadow-[#185FA5]/30 active:scale-[0.98] disabled:opacity-70
                  ${isCollapsed && !isMobile ? "justify-center w-12 h-12 px-0" : "w-full"}
                `}
              >
                {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                {!isCollapsed && <span>{isUploading ? "Uploading..." : "New"}</span>}
              </button>

              {/* Dropdown Menu */}
              {showNewMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowNewMenu(false)} />
                  <div className="absolute left-0 top-full mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 z-20 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                    <NewMenuItem 
                      icon={FolderOpen} 
                      label="New folder" 
                      onClick={() => handleMenuAction(onCreateFolder)} 
                    />
                    <NewMenuItem 
                      icon={FileText} 
                      label="File upload"  
                      onClick={() => handleMenuAction(triggerFileUpload)} 
                    />
                    <NewMenuItem 
                      icon={FolderOpen} 
                      label="Folder upload"  
                      onClick={() => handleMenuAction(triggerFolderUpload)} 
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Search
          {!isCollapsed && (
            <div className="px-4 pb-2">
              <div className="relative group">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#185FA5] transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search in Drive..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-[#185FA5]/30 focus:bg-white focus:ring-4 focus:ring-[#185FA5]/5"
                />
              </div>
            </div>
          )} */}

          {/* Main Navigation */}
          <nav className="px-3 py-2 space-y-0.5">
            {!isCollapsed && (
              <div className="px-3 pb-2 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Navigation</span>
              </div>
            )}
            {mainMenuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onItemClick}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold relative transition-all duration-200
                   ${isCollapsed && !isMobile ? "justify-center px-2" : ""}
                   ${isActive ? "bg-[#185FA5]/8 text-[#185FA5]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 shrink-0 ${isActive ? "bg-[#185FA5]/10" : "bg-transparent group-hover:bg-slate-100"}`}>
                      <item.icon size={18} className={`transition-colors duration-200 ${isActive ? "text-[#185FA5]" : "text-slate-400 group-hover:text-slate-600"}`} />
                    </div>
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 truncate">{item.name}</span>
                        {item.badge && !isActive && (
                          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#185FA5] px-1.5 text-[10px] font-bold text-white shadow-sm animate-in zoom-in duration-200">
                            {item.badge > 99 ? "99+" : item.badge}
                          </span>
                        )}
                        {isActive && <div className="h-1.5 w-1.5 rounded-full bg-[#185FA5]" />}
                      </>
                    )}
                    {isActive && !isCollapsed && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#185FA5] rounded-r-full" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Storage Section */}
          {!isCollapsed && (
            <div className="px-4 py-3">
              <button onClick={() => setStorageExpanded(!storageExpanded)} className="flex w-full items-center justify-between px-1 py-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Storage</span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${storageExpanded ? "" : "-rotate-90"}`} />
              </button>

              {storageExpanded && (
                <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#185FA5]/10 text-[#185FA5]"><HardDrive size={16} /></div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{formatStorageValue(rawUsedBytes)}</p>
                        <p className="text-[11px] text-slate-500">of {formatStorageValue(rawTotalBytes)} used</p>
                      </div>
                    </div>
                  </div>
                  <div className="w-full h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#185FA5] to-[#4A9FD4] transition-all duration-700" style={{ width: `${storagePercent}%` }} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                    <span>{Math.round(storagePercent)}% used</span>
                    <span>{formatStorageValue(rawFreeBytes)} free</span>
                  </div>
                  <button onClick={() => { navigate("/billing"); if (onItemClick) onItemClick(); }} className="mt-3 w-full rounded-lg border border-slate-200 bg-white py-2 text-[12px] font-bold text-[#185FA5] transition hover:bg-[#185FA5] hover:text-white hover:border-[#185FA5]">
                    Upgrade Storage
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Settings / Help */}
        <div className="border-t border-slate-100 p-3 space-y-1">
          <NavLink to="/settings" onClick={onItemClick} className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-200 ${isCollapsed && !isMobile ? "justify-center px-2" : ""} ${isActive ? "bg-[#185FA5]/8 text-[#185FA5]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
            {({ isActive }) => (
              <>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 shrink-0 ${isActive ? "bg-[#185FA5]/10" : "bg-transparent group-hover:bg-slate-100"}`}>
                  <Settings size={18} className={`transition-colors duration-200 ${isActive ? "text-[#185FA5]" : "text-slate-400 group-hover:text-slate-600"}`} />
                </div>
                {!isCollapsed && <span className="flex-1">Settings</span>}
                {!isCollapsed && isActive && <div className="h-1.5 w-1.5 rounded-full bg-[#185FA5]" />}
              </>
            )}
          </NavLink>

          {!isCollapsed && (
            <button onClick={() => { navigate("/help-support"); if (onItemClick) onItemClick(); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:text-slate-900">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-transparent shrink-0"><HelpCircle size={18} className="text-slate-400" /></div>
              <span className="flex-1 text-left">Help & Support</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

const NewMenuItem = ({ icon: Icon, label, shortcut, onClick }) => (
  <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50 text-left">
    <Icon size={16} className="text-slate-400 shrink-0" />
    <span className="flex-1">{label}</span>
    {shortcut && <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-500">{shortcut}</span>}
  </button>
);

export default Sidebar;