import { Navigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import '../Style/ProtectedRoute.css';

export function ProtectedRouteByRole({ children, allowedRoles }) {
  const { user, rol, loading } = useAuth();

  if (loading) {
    return (
      <div className="Protected_Loading">
        Cargando...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(rol)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
