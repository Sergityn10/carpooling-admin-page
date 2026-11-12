import { Navigate, Route, Routes, useParams } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import UsersPage from "./pages/UsersPage";
import UserDetailPage from "./pages/UserDetailPage";
import UserDevicesPage from "./pages/UserDevicesPage";
import WalletPage from "./pages/WalletPage";
import TripsPage from "./pages/TripsPage";
import TripDetailPage from "./pages/TripDetailPage";
import EventsPage from "./pages/EventsPage";
import EventDetailPage from "./pages/EventDetailPage";
import OrganizationsPage from "./pages/OrganizationsPage";
import OrganizationDetailPage from "./pages/OrganizationDetailPage";
import SuggestionsPage from "./pages/SuggestionsPage";
import CaesPage from "./pages/CaesPage";
import NotificationsPage from "./pages/NotificationsPage";

function LegacyCompanyRedirect() {
  const { id } = useParams();
  return <Navigate to={id ? `/organizaciones/${id}` : "/organizaciones"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/usuarios" replace />} />
        <Route path="/usuarios" element={<UsersPage />} />
        <Route path="/usuarios/:id" element={<UserDetailPage />} />
        <Route
          path="/usuarios/:id/dispositivos"
          element={<UserDevicesPage />}
        />
        <Route path="/usuarios/:id/monedero" element={<WalletPage />} />
        <Route path="/viajes" element={<TripsPage />} />
        <Route path="/viajes/:id" element={<TripDetailPage />} />
        <Route path="/eventos" element={<EventsPage />} />
        <Route path="/eventos/:id" element={<EventDetailPage />} />

        {/* Organizaciones (B2B Ecosistema) */}
        <Route path="/organizaciones" element={<OrganizationsPage />} />
        <Route path="/organizaciones/:id" element={<OrganizationDetailPage />} />

        {/* Redirecciones retrocompatibles */}
        <Route path="/empresas" element={<Navigate to="/organizaciones" replace />} />
        <Route path="/empresas/:id" element={<LegacyCompanyRedirect />} />

        <Route path="/sugerencias" element={<SuggestionsPage />} />
        <Route path="/caes" element={<CaesPage />} />
        <Route path="/notificaciones" element={<NotificationsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
