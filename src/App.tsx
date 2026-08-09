import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import UsersPage from "./pages/UsersPage";
import UserDetailPage from "./pages/UserDetailPage";
import UserDevicesPage from "./pages/UserDevicesPage";
import TripsPage from "./pages/TripsPage";
import TripDetailPage from "./pages/TripDetailPage";
import EventsPage from "./pages/EventsPage";
import EventDetailPage from "./pages/EventDetailPage";
import CompaniesPage from "./pages/CompaniesPage";
import CompanyDetailPage from "./pages/CompanyDetailPage";
import SuggestionsPage from "./pages/SuggestionsPage";
import CaesPage from "./pages/CaesPage";

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
        <Route path="/viajes" element={<TripsPage />} />
        <Route path="/viajes/:id" element={<TripDetailPage />} />
        <Route path="/eventos" element={<EventsPage />} />
        <Route path="/eventos/:id" element={<EventDetailPage />} />
        <Route path="/empresas" element={<CompaniesPage />} />
        <Route path="/empresas/:id" element={<CompanyDetailPage />} />
        <Route path="/sugerencias" element={<SuggestionsPage />} />
        <Route path="/caes" element={<CaesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
