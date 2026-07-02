export const ROUTES = {
  HOME: "/dashboard",
  LOGIN: "/login",
  REGISTER: "/register",
  PROFILE: "/profile",
};

export const QUERY_KEYS = {
  authUser: ["auth", "user"],
  profile: ["users", "profile"],
  files: (params = {}) => ["files", params],
  recentFiles: ["files", "recent"],
  starredFiles: ["files", "starred"],
  trashFiles: ["files", "trash"],
  storageMetrics: ["storageMetrics"],
  folders: (params = {}) => ["folders", params],
  trashFolders: ["folders", "trash"],
  sharedFiles: ["share", "shared-with-me"],
  shares: ["share", "mine"],
  notifications: ["notifications"],
  unreadNotifications: ["notifications", "unread-count"],
  users: ["users"],
  billingPlans: ["billing", "plans"],
  billingSummary: ["billing", "summary"],
  
};

export const DEFAULT_STALE_TIME = 60 * 1000;
export const DEFAULT_CACHE_TIME = 5 * 60 * 1000;
