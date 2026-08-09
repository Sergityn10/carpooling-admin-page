import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-gray-500">Cargando…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold text-red-600">
            Acceso denegado
          </div>
          <div className="mt-1 text-sm text-gray-500">
            No tienes permisos de administrador.
          </div>
          <div className="mt-1 text-xs text-gray-400">
            Rol actual: {user?.role ?? "sin rol"}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
