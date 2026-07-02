import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { formatDate } from "../../utils/drive";

import {
  Bell,
  Settings,
  HardDrive,
  CreditCard,
  LogOut,
  ChevronDown,
} from "lucide-react";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from "../../hooks/useNotifications";

const UserMenu = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const notificationsQuery = useNotifications({ page: 1, limit: 5, unread: true });
  const unreadCountQuery = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const notifications = notificationsQuery.data || [];
  const unreadCount = unreadCountQuery.data || 0;
  const hasNotifications = unreadCount > 0;

  const initials = (user?.name || user?.email || "U")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      markRead.mutate(notification._id || notification.id);
    }

    if (notification.link) {
      window.open(notification.link, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="relative flex items-center gap-4"
    >
      {/* Notifications */}
      <button
        type="button"
        onClick={() => {
          setIsNotificationsOpen((prev) => !prev);
          setIsOpen(false);
        }}
        className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={22} />

        {hasNotifications && (
          <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
        )}
      </button>

      {isNotificationsOpen && (
        <div className="absolute right-20 top-14 z-[9999] w-80 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl animate-in fade-in zoom-in duration-200">
          <div className="flex items-center justify-between border-b border-gray-100 p-4">
            <div>
              <p className="font-semibold text-gray-900">Notifications</p>
              <p className="text-xs text-gray-500">{unreadCount} unread</p>
            </div>
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              disabled={!unreadCount || markAllRead.isPending}
              className="text-xs font-semibold text-[#185FA5] disabled:text-gray-300"
            >
              Mark all read
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto py-1">
            {notificationsQuery.isLoading ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400">Loading...</div>
            ) : notifications.length ? (
              notifications.map((notification) => (
                <button
                  key={notification._id || notification.id}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className="flex w-full gap-3 px-4 py-3 text-left hover:bg-gray-50"
                >
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${notification.isRead ? "bg-gray-200" : "bg-blue-600"}`} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-gray-900">
                      {notification.title || "Notification"}
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-xs text-gray-500">
                      {notification.message}
                    </span>
                    <span className="mt-1 block text-[11px] font-medium text-gray-400">
                      {formatDate(notification.createdAt)}
                    </span>
                  </span>
                </button>
              ))
            ) : (
              <div className="px-4 py-6 text-center text-sm text-gray-400">No unread notifications.</div>
            )}
          </div>
        </div>
      )}

      {/* User Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setIsOpen((prev) => !prev);
            setIsNotificationsOpen(false);
          }}
          className="flex items-center gap-3 rounded-full p-1 pr-3 hover:bg-gray-50 transition-all"
        >
          {/* Avatar */}
          <div className="h-9 w-9 rounded-full bg-sky-600 flex items-center justify-center text-white text-sm font-semibold shadow">
            {initials}
          </div>

          {/* User Info */}
          <div className="hidden sm:flex flex-col items-start">
            <span className="text-sm font-medium text-gray-900">
              {user?.name || "Account"}
            </span>

            {/* <span className="text-xs text-gray-500 truncate max-w-[140px]">
              {user?.email}
            </span> */}
          </div>

          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 top-14 z-[9999] w-64 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl animate-in fade-in zoom-in duration-200">
            {/* User Header */}
            <div className="border-b border-gray-100 p-4">
              <p className="font-semibold text-gray-900">
                {user?.name || "User"}
              </p>

              <p className="truncate text-sm text-gray-500">
                {user?.email}
              </p>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              

              <button
                onClick={() => {
                  navigate("/settings");
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Settings size={18} />
                <span>Settings</span>
              </button>

              <button
                onClick={() => {
                  navigate("/storage");
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <HardDrive size={18} />
                <span>Storage</span>
              </button>

              <button
                onClick={() => {
                  navigate("/billing");
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <CreditCard size={18} />
                <span>Billing</span>
              </button>

              <div className="my-2 border-t border-gray-100" />

              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserMenu;
