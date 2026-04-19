// src/router/AppRouter.jsx
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Spinner } from "@heroui/react";
import { useAuth } from "../context/AuthContext.jsx";

// Pages
import LoginPage from "../pages/LoginPage.jsx";
import DashboardPage from "../pages/user/DashboardPage.jsx";
import BookingPage from "../pages/user/BookingPage.jsx";
import HistoryPage from "../pages/user/HistoryPage.jsx";
import AdminDashboard from "../pages/admin/AdminDashboard.jsx";
import AddAreaPage from "../pages/admin/AddAreaPage.jsx";
import ManageAreasPage from "../pages/admin/ManageAreasPage.jsx";
import AllBookingsPage from "../pages/admin/AllBookingsPage.jsx";
import AreaStatsPage from "../pages/admin/AreaStatsPage.jsx";
import ForbiddenPage from "../pages/ForbiddenPage.jsx";

function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" color="primary" label="Caricamento..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/forbidden" replace />;
  }

  return children;
}

export default function AppRouter() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-default-50">
        <Spinner size="lg" color="primary" label="Caricamento..." />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forbidden" element={<ForbiddenPage />} />

      {/* User routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute role="user">
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute role="user">
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/booking/:areaId"
        element={
          <ProtectedRoute role="user">
            <BookingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute role="user">
            <HistoryPage />
          </ProtectedRoute>
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/add-area"
        element={
          <ProtectedRoute role="admin">
            <AddAreaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/manage-areas"
        element={
          <ProtectedRoute role="admin">
            <ManageAreasPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/bookings"
        element={
          <ProtectedRoute role="admin">
            <AllBookingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/stats"
        element={
          <ProtectedRoute role="admin">
            <AreaStatsPage />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
