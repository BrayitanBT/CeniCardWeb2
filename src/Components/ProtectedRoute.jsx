import { Navigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import '../Style/ProtectedRoute.css';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

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

  return children;
}