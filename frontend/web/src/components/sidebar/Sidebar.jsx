import {
  HardDrive,
  Clock3,
  Star,
  Share2,
  Trash2,
  Settings,
} from "lucide-react";
import { NavLink, Link } from "react-router-dom";

const menuItems = [
  {
    name: "My Drive",
    icon: HardDrive,
    path: "/drive",
  },
  {
    name: "Shared",
    icon: Share2,
    path: "/shared",
    badge: 3, 
  },
  {
    name: "Recent",
    icon: Clock3,
    path: "/recent",
  },
  {
    name: "Starred",
    icon: Star,
    path: "/starred",
  },
  {
    name: "Trash",
    icon: Trash2,
    path: "/trash",
    badge: "New", 
  },
];

// Added props to handle mobile layout variations and automatic menu drawer closing
const Sidebar = ({ isMobile = false, onItemClick }) => {
  return (
    <aside 
      className={`
        w-64 h-screen border-r border-gray-200 bg-white flex flex-col justify-between flex-shrink-0 select-none
        ${isMobile ? "w-full h-full border-r-0" : "hidden md:flex sticky top-0"}
      `}
    >
      
      {/* Top Section: Branding & Navigation */}
      <div className="flex flex-col gap-6">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <Link to="/" onClick={onItemClick} className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#185FA5] text-white shadow-sm shadow-[#185FA5]/20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="w-4 h-4 text-[#85B7EB]"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z" />
              </svg>
            </div>
            <span className="text-[16px] font-bold tracking-tight text-gray-900 group-hover:text-[#185FA5] transition-colors duration-150">
              NimbusDrive
            </span>
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1 px-3 relative">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onItemClick} // Triggers closing the mobile container drawer upon route choice
              className={({ isActive }) =>
                `group/item flex items-center justify-between rounded-lg px-4 py-2.5 text-sm font-medium relative transition-all duration-150 overflow-hidden
                 ${
                   isActive
                     ? "bg-[#f0f7ff] text-[#185FA5]"
                     : "text-gray-600 hover:bg-gray-50/70 hover:text-gray-900"
                 }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <item.icon 
                      size={18} 
                      className={`flex-shrink-0 transition-colors duration-150 ${
                        isActive ? "text-[#185FA5]" : "text-gray-400 group-hover/item:text-gray-600"
                      }`} 
                    />
                    <span>{item.name}</span>
                  </div>

                  {item.badge && (
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full transition-colors duration-150 ${
                      isActive 
                        ? "bg-[#185FA5]/10 text-[#185FA5]" 
                        : "bg-gray-100 text-gray-500 group-hover/item:bg-gray-200/60"
                    }`}>
                      {item.badge}
                    </span>
                  )}

                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#185FA5] rounded-r-full" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom Section: Settings Link */}
      <div className="p-3 border-t border-gray-100">
        <NavLink
          to="/settings"
          onClick={onItemClick} // Closes drawer if settings are clicked on mobile
          className={({ isActive }) =>
            `group/settings flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium relative transition-all duration-150
             ${
               isActive
                 ? "bg-[#f0f7ff] text-[#185FA5]"
                 : "text-gray-600 hover:bg-gray-50/70 hover:text-gray-900"
             }`
          }
        >
          {({ isActive }) => (
            <>
              <Settings 
                size={18} 
                className={`flex-shrink-0 transition-colors duration-150 ${
                  isActive ? "text-[#185FA5]" : "text-gray-400 group-hover/settings:text-gray-600"
                }`} 
              />
              <span>Settings</span>
              
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#185FA5] rounded-r-full" />
              )}
            </>
          )}
        </NavLink>
      </div>
      
    </aside>
  );
};

export default Sidebar;