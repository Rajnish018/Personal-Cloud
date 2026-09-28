import { Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import RestoreAccount from "../pages/auth/RestoreAccount";

import Dashboard from "../pages/dashboard/Dashboard";
import MyDrive from "../pages/drive/MyDrive";
import Shared from "../pages/shared/Shared";
import Recent from "../pages/recents/Recent";
import Starred from "../pages/stared/Starred";
import Trash from "../pages/trash/Trash";
import Settings from "../pages/setting/Settings";
import FolderView from "../pages/drive/FolderView";

import Profile from "../pages/profile/Profile";
import PublicShare from "../pages/shared/PublicShare";
import Billing from "../pages/billings/Billing";
import Storage from "../pages/storage/storage";

import PrivateRoute from "./PrivateRoute";
import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "../utils/constants";
import HelpSupport from "../pages/helpSupport/HelpSupport";
import VerifyEmail from "../pages/setting/VerifyEmail";
import YourTicket from "../pages/helpSupport/YourTicket";
import LiveTicketChat from "../pages/helpSupport/LiveChatTicket";
import CloudLoader from "../components/loadingScreen/CloudLoader";

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <CloudLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes (Only accessible when LOGGED OUT) */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      <Route
        path="/restore-account"
        element={
          <PublicRoute>
            <RestoreAccount />
          </PublicRoute>
        }
      />

      {/* Completely Open Public Routes 
        Accessible by ANYONE (Logged in, logged out, or anonymous link recipients) 
      */}
      <Route path="/share/:token" element={<PublicShare />} />

      {/* Protected Routes (Only accessible when LOGGED IN) */}
      <Route
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to={ROUTES.HOME} replace />} />
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/drive" element={<MyDrive />} />
        <Route path="/drive/folder/:folderId" element={<FolderView />} />

        <Route path="/shared" element={<Shared />} />

        <Route path="/recent" element={<Recent />} />

        <Route path="/starred" element={<Starred />} />

        <Route path="/trash" element={<Trash />} />

        <Route path="/settings" element={<Settings />} />
        <Route path="/settings/verify-email" element={<VerifyEmail />} />


        <Route path="/profile" element={<Profile />} />


        <Route path="/billing" element={<Billing />} />
        <Route path="/storage" element={<Storage />} />
        <Route path="/help-support" element={<HelpSupport />} />
        <Route path="/ticket/:id" element={<YourTicket />} />
        <Route path="/chat" element={<Navigate to="/help-support" replace />} />
        <Route path="/chat/:id" element={<LiveTicketChat />} />
      </Route>

      {/* Fallback */}
      <Route
        path="*"
        element={<Navigate to={ROUTES.HOME} replace />}
      />
    </Routes>
  );
};

export default AppRoutes;
