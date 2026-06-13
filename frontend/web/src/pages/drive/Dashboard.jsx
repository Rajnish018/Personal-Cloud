import {  Share2, Star, Files } from "lucide-react";
import UploadButton from "../../components/drive/UploadButton";
import StorageCard from "../../components/drive/StorageCard";
import FolderGrid from "../../components/drive/FolderGrid";
import FileGrid from "../../components/drive/FileGrid";

const Dashboard = () => {
  // Mock overview data for the quick stats row
  const stats = [
    { label: "Total Files", value: "1,248", icon: Files, color: "text-blue-600 bg-blue-50" },
    { label: "Shared Items", value: "84", icon: Share2, color: "text-purple-600 bg-purple-50" },
    { label: "Starred", value: "12", icon: Star, color: "text-amber-600 bg-amber-50" },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 sm:p-6 md:p-8 lg:p-10">
      <div className="max-w-[1400px] mx-auto space-y-6 lg:space-y-8">
        
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Overview of your cloud storage workspace.
            </p>
          </div>
          <div className="w-full sm:w-auto flex-shrink-0">
            <UploadButton />
          </div>
        </div>

        {/* Quick Stats Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div 
              key={stat.label} 
              className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-150"
            >
              <div className={`p-2.5 rounded-lg ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900 mt-0.5">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Dashboard Content Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* Main Content Workspace Column (Folders & Files) */}
          <div className="col-span-1 lg:col-span-8 space-y-6 lg:space-y-8 order-2 lg:order-1">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm">
              <FolderGrid />
            </div>
            
            <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm">
              <FileGrid />
            </div>
          </div>

          {/* Right Sidebar Utility Column (Analytics & Storage) */}
          <div className="col-span-1 lg:col-span-4 lg:sticky lg:top-6 order-1 lg:order-2 space-y-6">
            <StorageCard />
            
            {/* Added a subtle contextual shortcut helper card to balance the sidebar */}
            <div className="rounded-xl border border-dashed border-gray-200 bg-gradient-to-br from-blue-50/40 to-indigo-50/20 p-5 text-center">
              <p className="text-xs font-semibold text-[#185FA5] uppercase tracking-wider">Need more space?</p>
              <p className="text-sm text-gray-600 mt-1.5 px-4">
                Invite your team members to NimbusDrive and earn up to <span className="font-bold text-gray-900">10 GB</span> free bonus room.
              </p>
              <button type="button" className="mt-4 text-xs font-bold text-white bg-[#185FA5] hover:bg-[#14508c] px-4 py-2 rounded-lg transition-colors">
                Get Started
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;