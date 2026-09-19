import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../services/AuthContext.jsx";

export default function ProtectedRoute({ requireMfa = false }) {
  const { loggedIn, mfaVerified } = useAuth();

  if (!loggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (requireMfa && !mfaVerified) {
    return <Navigate to="/mfa" replace />;
  }

  return <Outlet />;
}
