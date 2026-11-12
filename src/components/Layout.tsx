import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Bell,
  Calendar,
  Building2,
  FileCheck,
  Lightbulb,
  LogOut,
  Route as RouteIcon,
  Users,
} from "lucide-react";
import clsx from "clsx";
import { useAuth } from "../context/AuthContext";

const navItemBase =
  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen">
      <div className="flex min-h-screen">
        <aside className="w-64 border-r border-panel-200 bg-white">
          <div className="flex items-center gap-2.5 border-b border-panel-200 px-4 py-3.5">
            <img
              src="/logo.png"
              alt="YouConnext"
              className="h-9 w-9 object-contain"
            />
            <div className="leading-tight">
              <div className="text-sm font-semibold text-panel-950">YouConnext</div>
              <div className="text-xs text-gray-500">Admin</div>
            </div>
          </div>

          <nav className="p-3">
            <NavLink
              to="/usuarios"
              className={({ isActive }) =>
                clsx(
                  navItemBase,
                  isActive ? "bg-panel-100 text-panel-900" : "text-gray-700",
                )
              }
            >
              <Users size={16} />
              Usuarios
            </NavLink>

            <NavLink
              to="/viajes"
              className={({ isActive }) =>
                clsx(
                  navItemBase,
                  isActive ? "bg-panel-100 text-panel-900" : "text-gray-700",
                  "mt-1",
                )
              }
            >
              <RouteIcon size={16} />
              Viajes
            </NavLink>

            <NavLink
              to="/eventos"
              className={({ isActive }) =>
                clsx(
                  navItemBase,
                  isActive ? "bg-panel-100 text-panel-900" : "text-gray-700",
                  "mt-1",
                )
              }
            >
              <Calendar size={16} />
              Eventos
            </NavLink>

            <NavLink
              to="/organizaciones"
              className={({ isActive }) =>
                clsx(
                  navItemBase,
                  isActive ? "bg-panel-100 text-panel-900" : "text-gray-700",
                  "mt-1",
                )
              }
            >
              <Building2 size={16} />
              Organizaciones
            </NavLink>

            <NavLink
              to="/sugerencias"
              className={({ isActive }) =>
                clsx(
                  navItemBase,
                  isActive ? "bg-panel-100 text-panel-900" : "text-gray-700",
                  "mt-1",
                )
              }
            >
              <Lightbulb size={16} />
              Sugerencias
            </NavLink>

            <NavLink
              to="/caes"
              className={({ isActive }) =>
                clsx(
                  navItemBase,
                  isActive ? "bg-panel-100 text-panel-900" : "text-gray-700",
                  "mt-1",
                )
              }
            >
              <FileCheck size={16} />
              Informes CAE
            </NavLink>

            <NavLink
              to="/notificaciones"
              className={({ isActive }) =>
                clsx(
                  navItemBase,
                  isActive ? "bg-panel-100 text-panel-900" : "text-gray-700",
                  "mt-1",
                )
              }
            >
              <Bell size={16} />
              Notificaciones
            </NavLink>
          </nav>

          <div className="px-4 pb-4">
            <div className="mt-6 rounded-lg bg-panel-50 p-3">
              <div className="text-xs font-medium text-gray-700">
                {user?.email}
              </div>
              <div className="mt-0.5 text-xs text-gray-500">
                Rol: {user?.role ?? "user"}
              </div>
              <button
                onClick={handleLogout}
                className="mt-2 flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
              >
                <LogOut size={14} />
                Cerrar sesión
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1">
          <header className="sticky top-0 z-10 border-b border-panel-200 bg-white/80 backdrop-blur">
            <div className="px-6 py-4">
              <div className="text-sm text-gray-600">
                Panel de administración
              </div>
            </div>
          </header>

          <div className="px-6 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
