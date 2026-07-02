import { Files, Folder, Share2, Star, ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import UploadButton from "../../components/drive/UploadButton";
import StorageCard from "../../components/drive/StorageCard";
import FolderGrid from "../../components/drive/FolderGrid";
import FileGrid from "../../components/drive/FileGrid";
import { useProfile } from "../../hooks/useUsers";

const Dashboard = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useProfile();
  const userName = data?.user?.name || data?.name || "";
  const storage = data?.storage || {};
  
  // Greeting based on the time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const stats = [
    { 
      label: "My Files", 
      value: storage.totalFiles || 0, 
      icon: Files, 
      color: "text-blue-600 bg-blue-50 border-blue-100",
      description: "Everything you've saved"
    },
    { 
      label: "Folders", 
      value: storage.totalFolders || 0, 
      icon: Folder, 
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
      description: "Organized spaces"
    },
    { 
      label: "Shared with others", 
      value: storage.sharedFiles || 0, 
      icon: Share2, 
      color: "text-indigo-600 bg-indigo-50 border-indigo-100",
      description: "Collaborative files"
    },
    { 
      label: "Favorites", 
      value: storage.starredFiles || 0, 
      icon: Star, 
      color: "text-amber-500 bg-amber-50 border-amber-100",
      description: "Quick access items"
    },
  ];

  // Root configuration parameter tracking contexts passed to layout components
  const rootQueryParams = {
    sortBy: "name",
    order: "asc",
    search: "",
    folderId: "" // Clean empty string signaling root directory workspace boundary
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-indigo-500/10">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Friendly Header Section */}
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200/60 pb-6 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
              <Sparkles size={14} className="animate-pulse" />
              <span>Welcome Back</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {getGreeting()}{userName ? `, ${userName.split(' ')[0]}` : ''}! 👋
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Here’s a quick look at what’s happening in your digital workspace today.
            </p>
          </div>
          <div className="sm:shrink-0 transition-transform active:scale-98">
            {/* Bound the upload context explicitly to the empty-string root path directory context */}
            <UploadButton compact folderId="" />
          </div>
        </div>

        {/* Informative & Warm Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div 
              key={stat.label} 
              className="group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:border-slate-300"
            >
              <div className={`rounded-xl border p-3 transition-transform duration-300 group-hover:scale-105 ${stat.color}`}>
                <stat.icon size={22} strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-400 truncate">{stat.label}</p>
                {isLoading ? (
                  <div className="h-7 w-12 animate-pulse rounded bg-slate-100 mt-0.5" />
                ) : (
                  <p className="mt-0.5 text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</p>
                )}
                <p className="text-[11px] text-slate-400 mt-0.5 font-normal truncate opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {stat.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          
          {/* Left Column: Folders & Files */}
          <div className="order-1 space-y-6 lg:col-span-8">
            
            {/* Folders Section */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Your Folders</h2>
                  <p className="text-xs text-slate-400">Quickly jump into your organized projects</p>
                </div>
                <button 
                  type="button"
                  onClick={() => navigate("/drive/folders")}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline transition-all"
                >
                  <span>See all</span>
                  <ArrowRight size={14} />
                </button>
              </div>
              <FolderGrid onFolderClick={(folder) => navigate(`/drive/folder/${folder._id}`)} />
            </section>
            
            {/* Recent Activity Section */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Recent Activity</h2>
                  <p className="text-xs text-slate-400">Files you've recently opened or updated</p>
                </div>
              </div>
              {/* Pass down synchronized query constraints to handle global list invalidations */}
              <FileGrid variant="recent" queryParams={rootQueryParams} showActions={false} />
            </section>
          </div>
          
          {/* Right Column: Storage Info */}
          <aside className="order-2 space-y-6 lg:col-span-4">
            <div className="sticky top-6 space-y-4">
              <div className="px-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Storage Overview</h3>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white p-1 shadow-xs">
                <StorageCard />
              </div>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
