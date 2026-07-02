import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FolderPlus, Grid, List, Search, X, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import UploadButton from "../../components/drive/UploadButton";
import FolderGrid from "../../components/drive/FolderGrid";
import FileGrid from "../../components/drive/FileGrid";
import { useCreateFolder } from "../../hooks/useFolders";
import { useDebounce } from "../../hooks/useDebounce";
import useLocalStorage from "../../hooks/useLocalStorage";

const MyDrive = () => {
  // Independent layout preferences
  const [folderViewMode, setFolderViewMode] = useLocalStorage("drive.folderViewMode", "grid");
  const [fileViewMode, setFileViewMode] = useLocalStorage("drive.fileViewMode", "list");
  
  // Filtering & Sorting States
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [order, setOrder] = useState("desc");
  
  // Native Modal handling state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const isCreatingFolderRef = useRef(false);
  
  const navigate = useNavigate();
  const createFolder = useCreateFolder();
  
  // 1. Debounce the search term to protect your backend API from rapid calls
  const debouncedSearch = useDebounce(search, 500);

  // 2. Compute query parameters for the server, running only when values change
  const queryParams = useMemo(
    () => ({
      sortBy,
      order,
      search: debouncedSearch.trim().toLowerCase(),
    }),
    [sortBy, order, debouncedSearch]
  );

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    const folderName = newFolderName.trim();

    if (!folderName || isCreatingFolderRef.current || createFolder.isPending) return;

    isCreatingFolderRef.current = true;

    try {
      await createFolder.mutateAsync({ name: folderName });
      setSearch("");
      setNewFolderName("");
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      isCreatingFolderRef.current = false;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-indigo-500/10">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Header Title Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/60 pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Workspace
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              My Drive
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Your safe cloud space to look through, organize, and manage your files.
            </p>
          </div>
          
          {/* Top Actions */}
          <div className="flex items-center gap-3 sm:shrink-0">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              disabled={createFolder.isPending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-98 disabled:opacity-70"
            >
              <FolderPlus size={16} className="text-slate-500" />
              <span>New Folder</span>
            </button>
            <div className="transition-transform active:scale-98">
              <UploadButton compact />
            </div>
          </div>
        </div>

        {/* Global Filter Strip */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs md:flex-row md:items-center md:justify-between">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search files and folders..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-10 text-sm outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort & Order Elements */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 bg-white shadow-sm hover:border-slate-300 transition-colors">
              <SlidersHorizontal size={14} className="text-slate-400" />
              <select 
                value={sortBy} 
                onChange={(event) => setSortBy(event.target.value)} 
                className="bg-transparent text-xs font-semibold text-slate-600 outline-none cursor-pointer pr-1"
              >
                <option value="date">Sort by Date</option>
                <option value="name">Sort by Name</option>
                <option value="size">Sort by Size</option>
                <option value="type">Sort by Type</option>
              </select>
            </div>

            {/* Ascending / Descending Dropdown */}
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 bg-white shadow-sm hover:border-slate-300 transition-colors">
              <ArrowUpDown size={14} className="text-slate-400" />
              <select 
                value={order} 
                onChange={(event) => setOrder(event.target.value)} 
                className="bg-transparent text-xs font-semibold text-slate-600 outline-none cursor-pointer pr-1"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>

          </div>
        </div>

        {/* Content Display Sections */}
        <div className="space-y-6">
          
          {/* 📂 Folders Section Area */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 tracking-wide uppercase">Folders</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {debouncedSearch ? "Showing exact filter matches." : "Your directory layout."}
                </p>
              </div>
              
              {/* Folder View Switcher */}
              <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                <button 
                  type="button" 
                  onClick={() => setFolderViewMode("grid")} 
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${folderViewMode === "grid" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                >
                  <Grid size={13} />
                  <span>Grid</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => setFolderViewMode("list")} 
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${folderViewMode === "list" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                >
                  <List size={13} />
                  <span>List</span>
                </button>
              </div>
            </div>
            
            {/* 3. Passing the debounced text string as a prop to cleanly hide mismatches */}
            <FolderGrid 
              viewMode={folderViewMode} 
              searchFilter={debouncedSearch.trim().toLowerCase()} 
              queryParams={queryParams} 
              onFolderClick={(folder) => navigate(`/drive/folder/${folder._id}`)}
            />
          </section>

          {/* 📄 Files Section Area */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 tracking-wide uppercase">Files</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {debouncedSearch ? "Showing exact filter matches." : "Your documents and assets."}
                </p>
              </div>
              
              {/* File View Switcher */}
              <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                <button 
                  type="button" 
                  onClick={() => setFileViewMode("grid")} 
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${fileViewMode === "grid" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                >
                  <Grid size={13} />
                  <span>Grid</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => setFileViewMode("list")} 
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${fileViewMode === "list" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                >
                  <List size={13} />
                  <span>List</span>
                </button>
              </div>
            </div>
            
            {/* 4. Passing the same text string to the file sub-grid layout */}
            <FileGrid 
              viewMode={fileViewMode} 
              searchFilter={debouncedSearch.trim().toLowerCase()} 
              queryParams={queryParams} 
            />
          </section>
        </div>
      </div>

      {/* New Folder Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <form 
            onSubmit={handleCreateFolder}
            className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl border border-slate-100"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Create New Folder</h3>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-50"
              >
                <X size={18} />
              </button>
            </div>
            <div className="my-5">
              <label htmlFor="folder-name" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Folder Name
              </label>
              <input
                id="folder-name"
                type="text"
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="e.g., Marketing Assets ✨"
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="h-10 rounded-xl px-4 text-sm font-semibold text-slate-500 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newFolderName.trim() || createFolder.isPending}
                className="h-10 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {createFolder.isPending ? "Creating..." : "Create Folder"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default MyDrive;
