import { useState } from "react";

const UserMenu = () => {
  const [hasNotifications, setHasNotifications] = useState(true);

  return (
    <div className="flex items-center gap-4">
      {/* Notification Button */}
      <button
        type="button"
        className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/20"
        aria-label="Open notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>
        
        {/* Active Notification Indicator Dot */}
        {hasNotifications && (
          <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
        )}
      </button>

      {/* Profile Dropdown Trigger */}
      <button
        type="button"
        className="flex items-center gap-2.5 rounded-full p-1 pr-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all focus:outline-none"
      >
        {/* Avatar image wrapper with text fallback setup */}
        <div className="h-8 w-8 overflow-hidden rounded-full bg-sky-600 flex items-center justify-center text-white text-xs font-semibold ring-2 ring-white shadow-sm">
          {/* Replace with <img src={user.avatarUrl} alt="Avatar" /> when ready */}
          <span>JD</span>
        </div>
        
        <span className="hidden sm:inline text-gray-700">John Doe</span>
        
        {/* Small chevron icon to signify action */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="w-3 h-3 text-gray-400 hidden sm:inline"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
    </div>
  );
};

export default UserMenu;