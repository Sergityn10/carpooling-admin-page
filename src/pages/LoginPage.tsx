import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { Car } from "lucide-react";

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/usuarios" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/usuarios");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Error al iniciar sesión";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-panel-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-panel-800 text-white">
            <Car size={24} />
          </div>
          <h1 className="text-xl font-semibold text-panel-900">
            YouConnext Admin
          </h1>
          <p className="text-sm text-gray-500">
            Inicia sesión para acceder al panel
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-panel-200 bg-white p-6 shadow-sm"
        >
          {error ? (
            <Alert title="Error" variant="error">
              {error}
            </Alert>
          ) : null}

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@youconnext.es"
              required
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Iniciando sesión…" : "Iniciar sesión"}
          </Button>
        </form>
      </div>
    </div>
  );
}
