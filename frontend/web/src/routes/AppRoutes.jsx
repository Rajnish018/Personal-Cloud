import { Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

import Dashboard from "../pages/drive/Dashboard";
import MyDrive from "../pages/drive/MyDrive";
import Shared from "../pages/drive/Shared";
import Recent from "../pages/drive/Recent";
import Starred from "../pages/drive/Starred";
import Trash from "../pages/drive/Trash";
import Settings from "../pages/drive/Settings";

import Profile from "../pages/profile/Profile";

import PrivateRoute from "./PrivateRoute";
import MainLayout from "../layouts/MainLayout";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}

      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      {/* Protected Routes */}

      <Route
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />

        <Route path="/drive" element={<MyDrive />} />

        <Route path="/shared" element={<Shared />} />

        <Route path="/recent" element={<Recent />} />

        <Route path="/starred" element={<Starred />} />

        <Route path="/trash" element={<Trash />} />

        <Route path="/settings" element={<Settings />} />

        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Fallback */}

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
};

export default AppRoutes;