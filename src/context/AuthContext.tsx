import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { http } from "../api/http";

export type AuthUser = {
  userId: string;
  email: string;
  role: string;
  img_perfil?: string | null;
};

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

const STORAGE_KEY = "youconnext_admin_auth";

function safeSetAuth(data: unknown) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Quota exceeded: limpiar localStorage y reintentar
    try {
      localStorage.clear();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Si aun asi falla, ignorar (la sesion funcionara en memoria
    }
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Detectar formato antiguo (user.rol en vez de user.role) y descartarlo
        if (parsed.user?.rol || !parsed.user?.role) {
          localStorage.removeItem(STORAGE_KEY);
          setLoading(false);
          return;
        }
        setUser(parsed.user);
        setToken(parsed.token);

        // Validar el token contra la nueva API
        http<{
          status: string;
          message: string;
          token: string;
          data: {
            userId: string;
            email: string;
            role?: string;
            img_perfil?: string | null;
          };
        }>("users", "/api/auth/validate", {
          headers: { Authorization: `Bearer ${parsed.token}` },
        })
          .then((res) => {
            // Actualizar user con datos frescos de la API
            const validatedUser: AuthUser = {
              userId: res.data.userId,
              email: res.data.email,
              role: res.data.role ?? parsed.user.role,
              img_perfil: res.data.img_perfil ?? parsed.user.img_perfil ?? null,
            };
            const newAuthData = {
              user: validatedUser,
              token: res.token ?? parsed.token,
            };
            safeSetAuth(newAuthData);
            setUser(validatedUser);
            setToken(res.token ?? parsed.token);
          })
          .catch(() => {
            // Token inválido o API no accesible → limpiar sesión
            localStorage.removeItem(STORAGE_KEY);
            setUser(null);
            setToken(null);
          })
          .finally(() => setLoading(false));
        return;
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await http<{
      status: string;
      message: string;
      userId: string;
      token: string;
      img_perfil?: string | null;
    }>("users", "/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    const authUser: AuthUser = {
      userId: res.userId,
      email,
      role: "admin",
      img_perfil: res.img_perfil ?? null,
    };

    const authData = { user: authUser, token: res.token };
    safeSetAuth(authData);
    setUser(authUser);
    setToken(res.token);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
