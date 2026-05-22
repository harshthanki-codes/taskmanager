import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

/**
 * Protected route wrapper.
 * Redirects unauthenticated users to login page
 * while preserving the attempted destination.
 */
export const ProtectedRoute = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  return <Outlet />;
};

/**
 * Admin-only route wrapper.
 * Non-admin authenticated users are redirected
 * back to their dashboard.
 */
export const AdminRoute = () => {
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};