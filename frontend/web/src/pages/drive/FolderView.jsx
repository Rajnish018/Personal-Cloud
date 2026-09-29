  import { useMemo, useRef, useState } from "react";
  import { ArrowLeft, Grid, List, Search, X, SlidersHorizontal, ArrowUpDown, FolderPlus, ChevronRight, Home } from "lucide-react";
  import { useNavigate, useParams, Link } from "react-router-dom";
  import FolderGrid from "../../components/drive/FolderGrid";
  import FileGrid from "../../components/drive/FileGrid";
  import UploadButton from "../../components/drive/UploadButton";
  import { useFolderContents, useCreateFolder } from "../../hooks/useFolders";
  import { useDebounce } from "../../hooks/useDebounce";
  import useLocalStorage from "../../hooks/useLocalStorage";

  const FolderView = () => {
    const navigate = useNavigate();
    const { folderId } = useParams();
    
    // Clean string representations for nested context guardrails
    const cleanFolderId = typeof folderId === 'string' ? folderId.trim() : null;

    // Persistent layout view styles across navigation instances
    const [folderViewMode, setFolderViewMode] = useLocalStorage("drive.folderViewMode", "grid");
    const [fileViewMode, setFileViewMode] = useLocalStorage("drive.fileViewMode", "list");
    
    // Sorting & Filtering parameters
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("name"); // 'name' | 'date' | 'size'
    const [order, setOrder] = useState("asc");   // 'asc' | 'desc'

    // New Folder modal handling hooks
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const isCreatingFolderRef = useRef(false);
    const createFolder = useCreateFolder();

    const debouncedSearch = useDebounce(search, 500);
    const searchFilter = debouncedSearch.trim().toLowerCase();

    // 1. Pass cleanFolderId to the hook for unified server-side sync loops
    const folderContentsQuery = useFolderContents(cleanFolderId, { sortBy, order, search: searchFilter });
    const folder = folderContentsQuery.data?.folder;
    const rawFolders = useMemo(
      () => folderContentsQuery.data?.folders || [],
      [folderContentsQuery.data?.folders]
    );
    const rawFiles = useMemo(
      () => folderContentsQuery.data?.files || [],
      [folderContentsQuery.data?.files]
    );

    // 2. Client-Side Sorting & Filtering Fallback Strategy
    const processedFolders = useMemo(() => {
      let result = [...rawFolders];

      // Local Search Filter
      if (searchFilter) {
        result = result.filter(f => f.name?.toLowerCase().includes(searchFilter));
      }

      // Local Sort Logic
      result.sort((a, b) => {
        let compareA = sortBy === "date" ? new Date(a.updatedAt || a.createdAt) : a.name?.toLowerCase() || "";
        let compareB = sortBy === "date" ? new Date(b.updatedAt || b.createdAt) : b.name?.toLowerCase() || "";

        if (compareA < compareB) return order === "asc" ? -1 : 1;
        if (compareA > compareB) return order === "asc" ? 1 : -1;
        return 0;
      });

      return result;
    }, [rawFolders, searchFilter, sortBy, order]);

    const processedFiles = useMemo(() => {
      let result = [...rawFiles];

      // Local Search Filter
      if (searchFilter) {
        result = result.filter(f => f.name?.toLowerCase().includes(searchFilter));
      }

      // Local Sort Logic
      result.sort((a, b) => {
        let compareA, compareB;

        if (sortBy === "date") {
          compareA = new Date(a.updatedAt || a.createdAt).getTime();
          compareB = new Date(b.updatedAt || b.createdAt).getTime();
        } else if (sortBy === "size") {
          compareA = a.size || 0;
          compareB = b.size || 0;
        } else {
          compareA = a.name?.toLowerCase() || "";
          compareB = b.name?.toLowerCase() || "";
        }

        if (compareA < compareB) return order === "asc" ? -1 : 1;
        if (compareA > compareB) return order === "asc" ? 1 : -1;
        return 0;
      });

      return result;
    }, [rawFiles, searchFilter, sortBy, order]);

    // Combined tracking object for child components to enforce guardrail parameters
    const queryParams = useMemo(() => ({
      sortBy,
      order,
      search: searchFilter,
      folderId: cleanFolderId
    }), [sortBy, order, searchFilter, cleanFolderId]);

    const breadcrumbs = useMemo(() => {
      return Array.isArray(folder?.path) 
        ? folder.path 
        : Array.isArray(folder?.ancestors) 
          ? folder.ancestors 
          : [];
    }, [folder]);

    const isLoading = folderContentsQuery.isLoading;
    const isError = folderContentsQuery.isError;

    const handleCreateFolder = async (e) => {
      e.preventDefault();
      const folderName = newFolderName.trim();

      if (!folderName || isCreatingFolderRef.current || createFolder.isPending) return;
      isCreatingFolderRef.current = true;

      try {
        await createFolder.mutateAsync({ name: folderName, parentFolder: cleanFolderId });
        setNewFolderName("");
        setIsModalOpen(false);
      } catch (error) {
        console.error("Failed to create sub-folder:", error);
      } finally {
        isCreatingFolderRef.current = false;
      }
    };

    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-indigo-500/10">
        <div className="mx-auto max-w-6xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
          
          {/* Navigation Action Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/60 pb-5">
            <div className="flex flex-col items-start gap-3">
              <button
                type="button"
                onClick={() => navigate("/drive")}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-98"
              >
                <ArrowLeft size={14} />
                <span>Back to Drive</span>
              </button>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Folder</p>
                <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl truncate max-w-md">
                  {isLoading ? "Loading folder..." : folder?.name || "Folder contents"}
                </h1>
              </div>
            </div>

            {/* Contextual Workspace Interaction Buttons */}
            {!isLoading && !isError && (
              <div className="flex items-center gap-3 sm:shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  disabled={createFolder.isPending}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-98 disabled:opacity-70"
                >
                  <FolderPlus size={16} className="text-slate-500" />
                  <span>New Subfolder</span>
                </button>
                <div className="transition-transform active:scale-98">
                  <UploadButton compact folderId={cleanFolderId} />
                </div>
              </div>
            )}
          </div>

          {/* 🧭 Dynamic Structural Breadcrumb Navigation Trail */}
          {!isLoading && !isError && (
            <nav className="flex items-center gap-1.5 flex-wrap rounded-xl border border-slate-200/50 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-500 shadow-sm">
              <Link
                to="/drive"
                className="flex items-center gap-1 hover:text-indigo-600 text-slate-500 transition-colors"
              >
                <Home size={15} />
                <span className="hidden sm:inline">Root Drive</span>
              </Link>
              
              {breadcrumbs.map((crumb) => (
                <div key={crumb._id} className="flex items-center gap-1.5 min-w-0">
                  <ChevronRight size={14} className="text-slate-300 shrink-0" />
                  <Link
                    to={`/drive/folder/${crumb._id}`}
                    className="truncate hover:text-indigo-600 text-slate-500 transition-colors max-w-[120px] sm:max-w-[180px]"
                  >
                    {crumb.name}
                  </Link>
                </div>
              ))}

              {folder && (
                <div className="flex items-center gap-1.5 min-w-0">
                  <ChevronRight size={14} className="text-slate-300 shrink-0" />
                  <span className="truncate text-slate-900 font-bold max-w-[120px] sm:max-w-[180px]">
                    {folder.name}
                  </span>
                </div>
              )}
            </nav>
          )}

          {/* Global Filter & Sorting Strip */}
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search inside this folder..."
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

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 bg-white shadow-sm hover:border-slate-300 transition-colors">
                <SlidersHorizontal size={14} className="text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-600 outline-none cursor-pointer pr-1"
                >
                  <option value="name">Sort by Name</option>
                  <option value="date">Sort by Date</option>
                  <option value="size">Sort by Size</option>
                </select>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 bg-white shadow-sm hover:border-slate-300 transition-colors">
                <ArrowUpDown size={14} className="text-slate-400" />
                <select
                  value={order}
                  onChange={(event) => setOrder(event.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-600 outline-none cursor-pointer pr-1"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </div>
          </div>

          {/* Central State Renderers */}
          {isLoading && (
            <div className="space-y-4">
              {[1, 2].map((n) => (
                <div key={n} className="h-32 w-full animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          )}

          {isError && (
            <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-8 text-center text-sm font-medium text-rose-600">
              Unable to load this folder context or folder path does not exist.
            </div>
          )}

          {/* Content Render Areas */}
          {!isLoading && !isError && (
            <div className="space-y-6">
              
              {/* Folders List/Grid */}
              <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 tracking-wide uppercase">Subfolders</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Nested directories.
                    </p>
                  </div>

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
                
                <FolderGrid
                  viewMode={folderViewMode}
                  folders={processedFolders}
                  searchFilter={searchFilter}
                  queryParams={queryParams}
                  onFolderClick={(targetFolder) => navigate(`/drive/folder/${targetFolder._id}`)}
                />
              </section>

              {/* Files List/Grid */}
              <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 tracking-wide uppercase">Files</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Documents inside this directory.
                    </p>
                  </div>

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
                
                <FileGrid
                  viewMode={fileViewMode}
                  files={processedFiles}
                  searchFilter={searchFilter}
                  queryParams={queryParams}
                />
              </section>
            </div>
          )}
        </div>

        {/* New Sub-Folder Modal Container */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <form 
              onSubmit={handleCreateFolder}
              className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Create New Subfolder</h3>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-50"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="my-5">
                <label htmlFor="subfolder-name" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Folder Name
                </label>
                <input
                  id="subfolder-name"
                  type="text"
                  autoFocus
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g., Deep Nested Subfolder"
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

  export default FolderView;
