import { FileText, MoreVertical, FileCode, Image as ImageIcon, File } from "lucide-react";

const files = [
  { id: 1, name: "Resume.pdf", size: "1.2 MB", type: "pdf", updated: "2 hours ago" },
  { id: 2, name: "Project_Proposal.docx", size: "450 KB", type: "doc", updated: "Yesterday" },
  { id: 3, name: "Logo_Final.png", size: "3.8 MB", type: "image", updated: "Jun 10, 2026" },
  { id: 4, name: "App.jsx", size: "12 KB", type: "code", updated: "Jun 08, 2026" },
];

// Helper to get color/icon based on extension
const getFileIcon = (type) => {
  switch (type) {
    case "pdf": return <FileText className="text-red-500" size={20} />;
    case "doc": return <FileText className="text-blue-500" size={20} />;
    case "image": return <ImageIcon className="text-purple-500" size={20} />;
    case "code": return <FileCode className="text-orange-500" size={20} />;
    default: return <File className="text-gray-400" size={20} />;
  }
};

const FileGrid = () => {
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Recent Files</h2>
        <button className="text-sm font-medium text-sky-600 hover:text-sky-700 transition-colors">
          View all
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Table Header */}
        <div className="grid grid-cols-12 border-b bg-gray-50/50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
          <div className="col-span-6 lg:col-span-7">Name</div>
          <div className="col-span-3 lg:col-span-2">Size</div>
          <div className="hidden lg:block lg:col-span-2">Last Modified</div>
          <div className="col-span-3 lg:col-span-1 text-right">Action</div>
        </div>

        {/* File Rows */}
        <div className="divide-y divide-gray-100">
          {files.map((file) => (
            <div
              key={file.id}
              className="grid grid-cols-12 items-center px-4 py-3.5 hover:bg-gray-50 transition-colors group cursor-pointer"
            >
              {/* File Name & Icon */}
              <div className="col-span-6 lg:col-span-7 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-50 group-hover:bg-white transition-colors">
                  {getFileIcon(file.type)}
                </div>
                <span className="text-sm font-medium text-gray-700 truncate">
                  {file.name}
                </span>
              </div>

              {/* Size */}
              <div className="col-span-3 lg:col-span-2 text-sm text-gray-500">
                {file.size}
              </div>

              {/* Modified Date */}
              <div className="hidden lg:block lg:col-span-2 text-sm text-gray-500">
                {file.updated}
              </div>

              {/* Options Menu */}
              <div className="col-span-3 lg:col-span-1 text-right">
                <button className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FileGrid;