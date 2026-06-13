import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/sidebar/Sidebar";
import TopNavbar from "../components/navbar/TopNavbar";
import { X } from "lucide-react"; 

const MainLayout = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] text-slate-900 font-sans antialiased overflow-hidden">
      
      {/* 1. DESKTOP SIDEBAR: Stays docked on desktop viewports (md and up) */}
      <Sidebar />

      {/* 2. MOBILE DRAWER: Slides out from the left on mobile/tablet viewports */}
      <div 
        className={`fixed inset-0 z-50 flex md:hidden transition-opacity duration-300 ${
          isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop overlay shade */}
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" 
          onClick={() => setIsMobileOpen(false)}
        />

        {/* Floating Sidebar Content Container */}
        <div 
          className={`relative w-64 bg-white h-full flex flex-col transition-transform duration-300 ease-out shadow-2xl ${
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Close Menu Button */}
          <div className="absolute right-4 top-4 z-50">
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Render an instance of the sidebar internally for mobile view */}
          <div className="flex-1 overflow-y-auto">
            {/* Added the onItemClick callback here to close the drawer upon navigation */}
            <Sidebar 
              isMobile={true} 
              onItemClick={() => setIsMobileOpen(false)} 
            />
          </div>
        </div>
      </div>

      {/* 3. RIGHT CONTENT WRAPPER */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        
        {/* Top Navbar Layer - We pass down the toggle button click state handler */}
        <TopNavbar onMenuClick={() => setIsMobileOpen(true)} />

        {/* Primary Page Scroll Canvas */}
        <main className="flex-1 overflow-y-auto bg-[#f8fafc] relative focus:outline-none">
          <div className="w-full h-full">
            <Outlet />
          </div>
        </main>
      </div>

    </div>
  );
};

export default MainLayout;