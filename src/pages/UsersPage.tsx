import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Check, Copy, KeyRound, Trash2, UserPlus } from "lucide-react";
import clsx from "clsx";
import { api } from "../api/client";
import type { UserCreateInput, Usuario } from "../api/types";
import Alert from "../components/ui/Alert";
import { Card, CardSubtitle, CardTitle } from "../components/ui/Card";
import Input from "../components/ui/Input";
import { Table, Td, Th } from "../components/ui/Table";
import { formatRelative } from "../lib/format";

function matchesUser(u: Usuario, q: string) {
  const query = q.trim().toLowerCase();
  if (!query) return true;
  return (
    (u.name ?? "").toLowerCase().includes(query) ||
    (u.surname ?? "").toLowerCase().includes(query) ||
    (u.email ?? "").toLowerCase().includes(query) ||
    (u.dni ?? "").toLowerCase().includes(query) ||
    String(u.id).includes(query)
  );
}

function generateRandomPassword() {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$%&*";
  let pass = "";
  for (let i = 0; i < 10; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

function UserCreateForm({ onCreated }: { onCreated: (newUserId?: number) => void }) {
  const [form, setForm] = useState<UserCreateInput>({
    email: "",
    password: "",
    name: "",
    surname: "",
    phone: "",
    dni: "",
    role: "user",
  });
  const [error, setError] = useState<string | null>(null);
  const [createdResult, setCreatedResult] = useState<{
    email: string;
    password: string;
    userId?: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [marketingAccepted, setMarketingAccepted] = useState(false);

  const createMutation = useMutation({
    mutationFn: (data: UserCreateInput) => api.usuarios.create(data),
    onSuccess: (res) => {
      setCreatedResult({
        email: form.email,
        password: form.password,
        userId: res.userId,
      });
      onCreated(res.userId);
    },
    onError: (err: Error) => {
      setError(err.message || "No se pudo crear el usuario.");
    },
  });

  const handleGeneratePassword = () => {
    const p = generateRandomPassword();
    setForm((prev) => ({ ...prev, password: p }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.email.trim()) {
      setError("El correo electrónico es obligatorio.");
      return;
    }
    if (!form.password || form.password.length < 6) {
      setError("La contraseña es obligatoria y debe tener al menos 6 caracteres.");
      return;
    }
    if (!acceptedTerms) {
      setError("Es obligatorio confirmar la aceptación de los Términos y la Política de Privacidad.");
      return;
    }
    createMutation.mutate({
      email: form.email.trim(),
      password: form.password,
      name: form.name?.trim() || undefined,
      surname: form.surname?.trim() || undefined,
      phone: form.phone?.trim() || undefined,
      dni: form.dni?.trim() || undefined,
      role: form.role || "user",
      consents: {
        privacy_policy_accepted: acceptedTerms,
        terms_of_service_accepted: acceptedTerms,
        marketing_accepted: marketingAccepted,
        privacy_version: "v1.0",
        terms_version: "v1.0",
      },
    });
  };

  const handleCopy = () => {
    if (!createdResult) return;
    const text = `Acceso Carpooling:\nEmail: ${createdResult.email}\nContraseña temporal: ${createdResult.password}\nWeb: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (createdResult) {
    return (
      <Card>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-green-700 font-semibold text-base">
            <Check size={20} />
            <span>Usuario creado con éxito</span>
          </div>
          <p className="text-sm text-gray-600">
            Facilita estas credenciales de acceso temporal al usuario para que pueda iniciar sesión:
          </p>
          <div className="rounded-lg bg-panel-50 border border-panel-200 p-3 text-sm font-mono space-y-1">
            <div>
              <span className="text-gray-500">Email:</span>{" "}
              <strong>{createdResult.email}</strong>
            </div>
            <div>
              <span className="text-gray-500">Contraseña provisional:</span>{" "}
              <strong>{createdResult.password}</strong>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-panel-800 px-3 py-2 text-sm font-medium text-white hover:bg-panel-900 transition-colors"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? "¡Copiado al portapapeles!" : "Copiar credenciales"}</span>
            </button>
            {createdResult.userId ? (
              <Link
                to={`/usuarios/${createdResult.userId}`}
                className="inline-flex items-center gap-1 rounded-lg border border-panel-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-panel-100 transition-colors"
              >
                Ver ficha del usuario
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setCreatedResult(null);
                setForm({
                  email: "",
                  password: "",
                  name: "",
                  surname: "",
                  phone: "",
                  dni: "",
                  role: "user",
                });
              }}
              className="rounded-lg px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Crear otro usuario
            </button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-panel-100 pb-3">
        <div>
          <CardTitle>Crear usuario asistido</CardTitle>
          <CardSubtitle>
            Alta rápida para usuarios con problemas de registro. Solo el email y contraseña son obligatorios.
          </CardSubtitle>
        </div>
        <span className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
          Lo obligatorio marcado con (*)
        </span>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {/* Sección Obligatoria */}
        <div className="rounded-lg bg-panel-50 p-3 border border-panel-200 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-panel-900">
            1. Datos de acceso obligatorios
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700">
                Email * <span className="text-gray-400 font-normal">(Identificador único)</span>
              </label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="usuario@ejemplo.com"
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700">
                  Contraseña temporal * <span className="text-gray-400 font-normal">(mín. 6 car.)</span>
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                >
                  <KeyRound size={12} />
                  <span>Generar clave segura</span>
                </button>
              </div>
              <Input
                type="text"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Escribe o pulsa generar..."
                required
              />
            </div>
          </div>
        </div>

        {/* Sección Opcional */}
        <div className="space-y-3 pt-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            2. Datos personales y rol (Opcionales - se pueden editar después)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600">Nombre</label>
              <Input
                value={form.name ?? ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nombre"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Apellidos</label>
              <Input
                value={form.surname ?? ""}
                onChange={(e) => setForm({ ...form, surname: e.target.value })}
                placeholder="Apellidos"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Teléfono</label>
              <Input
                value={form.phone ?? ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="600123456"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600">DNI / NIE</label>
              <Input
                value={form.dni ?? ""}
                onChange={(e) => setForm({ ...form, dni: e.target.value })}
                placeholder="12345678Z"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Rol del usuario</label>
              <select
                value={form.role ?? "user"}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full rounded-lg border border-panel-200 bg-white px-3 py-2 text-sm focus:border-panel-800 focus:outline-none"
              >
                <option value="user">Usuario estándar (Pasajero / Conductor)</option>
                <option value="enterprise">Empresa / Corporativo</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
        </div>

        {/* Consentimientos legales obligatorios */}
        <div className="rounded-lg bg-blue-50/70 border border-blue-200 p-3 space-y-2">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-panel-800 focus:ring-panel-800"
              required
            />
            <span className="text-xs text-gray-700">
              <strong>Consentimiento legal requerido (*):</strong> El usuario acepta (o autoriza al soporte técnico) los{" "}
              <span className="font-semibold text-panel-900">Términos y Condiciones</span> y la{" "}
              <span className="font-semibold text-panel-900">Política de Privacidad</span>.
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer pl-6">
            <input
              type="checkbox"
              checked={marketingAccepted}
              onChange={(e) => setMarketingAccepted(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-gray-300 text-panel-800 focus:ring-panel-800"
            />
            <span className="text-xs text-gray-500">
              Acepta comunicaciones y novedades de la plataforma (opcional)
            </span>
          </label>
        </div>

        {error ? <Alert variant="error">{error}</Alert> : null}

        <div className="flex justify-end gap-2 pt-2 border-t border-panel-100">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-panel-800 px-4 py-2 text-sm font-medium text-white hover:bg-panel-900 disabled:opacity-50 transition-colors"
          >
            <UserPlus size={16} />
            <span>{createMutation.isPending ? "Creando usuario…" : "Crear usuario"}</span>
          </button>
        </div>
      </form>
    </Card>
  );
}

export default function UsersPage() {
  const [q, setQ] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const usuariosQuery = useQuery({
    queryKey: ["usuarios"],
    queryFn: api.usuarios.list,
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string | number) => api.usuarios.delete(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    },
    onError: (err: Error) => {
      setDeleteError(err.message || "No se pudo eliminar el usuario.");
    },
  });

  const handleDeleteUser = (e: React.MouseEvent, u: Usuario) => {
    e.stopPropagation();
    const displayName =
      [u.name, u.surname].filter(Boolean).join(" ").trim() ||
      u.email ||
      `Usuario #${u.id}`;
    if (
      confirm(
        `¿Eliminar a "${displayName}"? Esta acción no se puede deshacer.`,
      )
    ) {
      setDeleteError(null);
      deleteMutation.mutate(u.id);
    }
  };

  const filtered = useMemo(() => {
    const arr = (usuariosQuery.data ?? []) as Usuario[];
    return arr.filter((u) => matchesUser(u, q));
  }, [usuariosQuery.data, q]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">Usuarios</div>
          <div className="text-sm text-gray-600">
            Listado y gestión de usuarios registrados
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-panel-800 px-3 py-2 text-sm font-medium text-white hover:bg-panel-900 transition-colors"
        >
          <UserPlus size={16} />
          <span>{showCreate ? "Cancelar alta" : "Nuevo usuario"}</span>
        </button>
      </div>

      {showCreate ? (
        <UserCreateForm
          onCreated={() => {
            queryClient.invalidateQueries({ queryKey: ["usuarios"] });
          }}
        />
      ) : null}

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Buscar</CardTitle>
            <CardSubtitle>
              Filtra por DNI, nombre, apellidos, email o ID
            </CardSubtitle>
          </div>
          <div className="w-80 max-w-full">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar…"
            />
          </div>
        </div>
      </Card>

      {deleteError ? (
        <Alert title="Error al eliminar" variant="error">
          {deleteError}
        </Alert>
      ) : null}

      {usuariosQuery.isLoading ? (
        <Alert title="Cargando">Cargando usuarios…</Alert>
      ) : null}

      {usuariosQuery.isError ? (
        <Alert title="Error" variant="error">
          No se pudieron cargar los usuarios.
        </Alert>
      ) : null}

      {!usuariosQuery.isLoading && !usuariosQuery.isError ? (
        <Table>
          <thead>
            <tr>
              <Th>Usuario</Th>
              <Th>Email</Th>
              <Th>Rol</Th>
              <Th className="text-right">Creado</Th>
              <Th className="text-right">Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const fullName = [u.name, u.surname].filter(Boolean).join(" ").trim();
              const initial = ((fullName || u.email || "U")[0] || "U").toUpperCase();

              return (
                <tr
                  key={u.id}
                  onClick={() => navigate(`/usuarios/${u.id}`)}
                  className="cursor-pointer hover:bg-panel-50 transition-colors"
                >
                  <Td className="font-medium">
                    <div className="flex items-center gap-3">
                      {u.img_perfil ? (
                        <img
                          src={u.img_perfil}
                          alt=""
                          className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-panel-200 text-xs font-semibold text-panel-800">
                          {initial}
                        </div>
                      )}
                      <div className="min-w-0">
                        <Link
                          to={`/usuarios/${u.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-panel-900 underline-offset-2 hover:underline"
                        >
                          {fullName ? (
                            <span>{fullName}</span>
                          ) : (
                            <span className="italic text-gray-500">
                              Sin nombre {u.email ? `(${u.email})` : `(#${u.id})`}
                            </span>
                          )}
                        </Link>
                        {u.dni ? (
                          <div className="text-xs font-normal text-gray-500">
                            DNI: {u.dni}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </Td>
                  <Td>{u.email ?? "-"}</Td>
                  <Td>
                    <span
                      className={clsx(
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                        u.role === "admin"
                          ? "bg-red-100 text-red-700"
                          : u.role === "enterprise"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700",
                      )}
                    >
                      {u.role ?? "user"}
                    </span>
                  </Td>
                  <Td className="text-right text-gray-600">
                    {formatRelative(u.created_at)}
                  </Td>
                  <Td className="text-right">
                    <button
                      type="button"
                      onClick={(e) => handleDeleteUser(e, u)}
                      disabled={
                        deleteMutation.isPending &&
                        deleteMutation.variables === u.id
                      }
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 transition-colors"
                      title="Eliminar usuario"
                    >
                      <Trash2 size={14} />
                      <span>
                        {deleteMutation.isPending &&
                        deleteMutation.variables === u.id
                          ? "Eliminando…"
                          : "Eliminar"}
                      </span>
                    </button>
                  </Td>
                </tr>
              );
            })}

            {filtered.length === 0 ? (
              <tr>
                <Td className="py-8 text-center text-gray-600" colSpan={5}>
                  Sin resultados
                </Td>
              </tr>
            ) : null}
          </tbody>
        </Table>
      ) : null}
    </div>
  );
}
