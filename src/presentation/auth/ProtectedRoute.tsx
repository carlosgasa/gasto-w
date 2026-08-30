import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { signOutUser } from "../../infrastructure/firebase/authService";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, authorized } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  if (!authorized) {
    signOutUser();
    return (
      <div className="unauthorized">
        <p>Esta cuenta no tiene acceso a Cuentas.</p>
      </div>
    );
  }

  return <>{children}</>;
}
