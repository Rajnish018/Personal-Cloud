import { useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import Sidebar from "../components/sidebar/Sidebar";
import TopNavbar from "../components/navbar/TopNavbar";
import { X } from "lucide-react"; 
import { folderApi } from "../api";
import toast from "react-hot-toast";

const MainLayout = () => {
  const queryClient = useQueryClient();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderName, setFolderName] = useState("");

  // Extract nested directory paths from router streams
  const { folderId } = useParams();
  const currentFolderContextId = folderId || null;

  const handleCreateFolderSubmit = async (e) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    const toastId = toast.loading("Creating folder...");
    try {
      await folderApi.createFolder({
        name: folderName.trim(),
        parentFolder: currentFolderContextId,
      });

      // Force instant React Query synchronization inside views
      await queryClient.invalidateQueries({ queryKey: ["folders"] });
      await queryClient.invalidateQueries({ queryKey: ["files"] });

      toast.success("Folder created successfully", { id: toastId });
      setIsFolderModalOpen(false);
      setFolderName("");
    } catch (err) {
      console.error("[MainLayout] Directory creation error:", err);
      toast.error("Failed to create folder", { id: toastId });
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] text-slate-900 font-sans antialiased overflow-hidden">
      
      {/* 1. DESKTOP SIDEBAR */}
      <Sidebar 
        currentFolderId={currentFolderContextId}
        onCreateFolder={() => setIsFolderModalOpen(true)}
      />

      {/* 2. MOBILE DRAWER OVERLAY */}
      <div 
        className={`fixed inset-0 z-50 flex md:hidden transition-opacity duration-300 ${
          isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />

        <div 
          className={`relative w-64 bg-white h-full flex flex-col transition-transform duration-300 ease-out shadow-2xl ${
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="absolute right-4 top-4 z-50">
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <Sidebar 
              isMobile={true} 
              currentFolderId={currentFolderContextId}
              onCreateFolder={() => {
                setIsMobileOpen(false);
                setIsFolderModalOpen(true);
              }} 
              onItemClick={() => setIsMobileOpen(false)} 
            />
          </div>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE DISPLAY WRAPPER */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <TopNavbar onMenuClick={() => setIsMobileOpen(true)} />

        <main className="flex-1 overflow-y-auto bg-[#f8fafc] relative focus:outline-none">
          <div className="w-full h-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* 4. ACCESSIBLE CREATION MODAL VIEW DIALOG */}
      {isFolderModalOpen && (
        <div 
          tabIndex={-1}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 animate-in fade-in duration-200 outline-none"
          onClick={() => {
            setIsFolderModalOpen(false);
            setFolderName("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setIsFolderModalOpen(false);
              setFolderName("");
            }
          }}
        >
          <div 
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-slate-100/80 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[16px] font-bold tracking-tight text-slate-900 mb-4">
              New folder
            </h3>
            
            <form onSubmit={handleCreateFolderSubmit} className="space-y-4">
              <div className="relative">
                <input
                  autoFocus
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="Untitled folder"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/30 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition duration-200 focus:border-[#185FA5]/40 focus:bg-white focus:ring-4 focus:ring-[#185FA5]/5"
                />
              </div>

              <div className="flex justify-end gap-2 text-sm font-bold pt-1">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsFolderModalOpen(false);
                    setFolderName("");
                  }} 
                  className="rounded-xl px-4 py-2.5 text-slate-500 transition hover:bg-slate-50 active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={!folderName.trim()} 
                  className="rounded-xl bg-[#185FA5] px-5 py-2.5 text-white shadow-sm transition hover:bg-[#14508c] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default MainLayout;