import SearchBar from "./SearchBar";
import UserMenu from "./UserMenu";
import { Menu } from "lucide-react";

const TopNavbar = ({ onMenuClick }) => {
  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 gap-4">
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        {/* Hamburger Menu Button - ONLY shows on mobile/tablet screens */}
        <button
          type="button"
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-700 md:hidden transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        
        <SearchBar />
      </div>

      <UserMenu />
    </header>
  );
};

export default TopNavbar;