import { Folder, MoreVertical, FileText } from "lucide-react";

const folders = [
  { id: 1, name: "Documents", fileCount: 42, color: "text-[#185FA5] bg-blue-50" },
  { id: 2, name: "Projects", fileCount: 15, color: "text-amber-600 bg-amber-50" },
  { id: 3, name: "Photos", fileCount: 128, color: "text-emerald-600 bg-emerald-50" },
];

const FolderGrid = () => {
  return (
    <div className="mt-4">
      {/* Grid Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Folders</h2>
        <button className="text-sm font-medium text-[#185FA5] hover:text-[#14508c] transition-colors">
          View all
        </button>
      </div>

      {/* Grid Container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {folders.map((folder) => (
          <div
            key={folder.id}
            className="group relative flex flex-col justify-between p-5 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-150 cursor-pointer select-none"
          >
            {/* Top Row: Icon & Actions */}
            <div className="flex items-start justify-between">
              <div className={`p-2.5 rounded-lg ${folder.color} transition-transform group-hover:scale-105 duration-150`}>
                <Folder size={22} fill="currentColor" fillOpacity={0.15} />
              </div>
              
              <button 
                type="button"
                className="p-1 rounded-md text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                onClick={(e) => {
                  e.stopPropagation(); // Prevents entering folder when clicking options
                }}
              >
                <MoreVertical size={16} />
              </button>
            </div>

            {/* Bottom Row: Folder Name & File Metadata */}
            <div className="mt-4">
              <h3 className="font-medium text-gray-900 text-sm tracking-tight truncate">
                {folder.name}
              </h3>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
                <FileText size={12} />
                <span>{folder.fileCount} files</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FolderGrid;