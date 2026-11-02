import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { KeyRound, Pencil, Trash2 } from "lucide-react";
import { api } from "../api/client";
import type { UserUpdateInput, Usuario, UsuarioInfo } from "../api/types";
import Alert from "../components/ui/Alert";
import { Card, CardSubtitle, CardTitle } from "../components/ui/Card";
import Input from "../components/ui/Input";
import Stat from "../components/ui/Stat";
import { Table, Td, Th } from "../components/ui/Table";
import { formatDateTime } from "../lib/format";

function generateRandomPassword() {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$%&*";
  let pass = "";
  for (let i = 0; i < 10; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

function UserEditForm({
  id,
  user,
  info,
  onSaved,
  onCancel,
}: {
  id: string | number;
  user?: Usuario;
  info?: UsuarioInfo;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<UserUpdateInput>({
    name: user?.name ?? info?.name ?? "",
    surname: user?.surname ?? info?.surname ?? "",
    phone: user?.phone ?? info?.phone ?? "",
    dni: user?.dni ?? "",
    role: user?.role ?? info?.role ?? "user",
    ciudad: user?.ciudad ?? "",
    provincia: user?.provincia ?? "",
    about_me: info?.about_me ?? "",
  });
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const updateMutation = useMutation({
    mutationFn: (data: UserUpdateInput) => api.usuarios.update(id, data),
    onSuccess: () => {
      setSuccessMsg("¡Usuario actualizado con éxito!");
      setTimeout(() => {
        onSaved();
      }, 900);
    },
    onError: (err: Error) => {
      setError(err.message || "No se pudo actualizar la información del usuario.");
    },
  });

  const handleGeneratePassword = () => {
    setNewPassword(generateRandomPassword());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (newPassword && newPassword.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    const payload: UserUpdateInput = {
      name: form.name?.trim() || undefined,
      surname: form.surname?.trim() || undefined,
      phone: form.phone?.trim() || undefined,
      dni: form.dni?.trim() || undefined,
      role: form.role || "user",
      ciudad: form.ciudad?.trim() || undefined,
      provincia: form.provincia?.trim() || undefined,
      about_me: form.about_me?.trim() || undefined,
    };

    if (newPassword) {
      payload.password = newPassword;
    }

    updateMutation.mutate(payload);
  };

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-panel-100 pb-3">
        <div>
          <CardTitle>Editar información del usuario</CardTitle>
          <CardSubtitle>
            Modifica datos de contacto, identidad, rol o restablece credenciales de acceso.
          </CardSubtitle>
        </div>
        <span className="text-xs text-gray-500 font-mono">ID: #{id}</span>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {error ? <Alert variant="error">{error}</Alert> : null}
        {successMsg ? <Alert title="Guardado" variant="info">{successMsg}</Alert> : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-700">Nombre</label>
            <Input
              value={form.name ?? ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nombre"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Apellidos</label>
            <Input
              value={form.surname ?? ""}
              onChange={(e) => setForm({ ...form, surname: e.target.value })}
              placeholder="Apellidos"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-700">Teléfono</label>
            <Input
              value={form.phone ?? ""}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="600123456"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">DNI / NIE</label>
            <Input
              value={form.dni ?? ""}
              onChange={(e) => setForm({ ...form, dni: e.target.value })}
              placeholder="12345678Z"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Rol</label>
            <select
              value={form.role ?? "user"}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full rounded-lg border border-panel-200 bg-white px-3 py-2 text-sm focus:border-panel-800 focus:outline-none"
            >
              <option value="user">Usuario (Pasajero / Conductor)</option>
              <option value="enterprise">Empresa / Corporativo</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-700">Ciudad</label>
            <Input
              value={form.ciudad ?? ""}
              onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
              placeholder="Madrid, Barcelona..."
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Provincia</label>
            <Input
              value={form.provincia ?? ""}
              onChange={(e) => setForm({ ...form, provincia: e.target.value })}
              placeholder="Provincia"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-700">Sobre mí / Notas</label>
          <textarea
            value={form.about_me ?? ""}
            onChange={(e) => setForm({ ...form, about_me: e.target.value })}
            rows={2}
            className="w-full rounded-lg border border-panel-200 bg-white px-3 py-2 text-sm focus:border-panel-800 focus:outline-none"
            placeholder="Breve descripción o notas del usuario..."
          />
        </div>

        {/* Sección de Reseteo Asistido de Contraseña */}
        <div className="rounded-lg bg-yellow-50/70 border border-yellow-200 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-yellow-900">
              Restablecer contraseña (Opcional)
            </label>
            <button
              type="button"
              onClick={handleGeneratePassword}
              className="inline-flex items-center gap-1 text-xs font-medium text-yellow-800 hover:text-yellow-950"
            >
              <KeyRound size={12} />
              <span>Generar nueva clave</span>
            </button>
          </div>
          <Input
            type="text"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Dejar vacío para mantener la contraseña actual..."
          />
          <p className="text-xs text-yellow-700">
            Útil cuando el usuario tiene problemas de acceso o ha olvidado su contraseña. Si indicas una contraseña, sustituirá a la actual inmediatamente.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-panel-100">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-panel-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-panel-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="rounded-lg bg-panel-800 px-4 py-2 text-sm font-medium text-white hover:bg-panel-900 disabled:opacity-50 transition-colors"
          >
            {updateMutation.isPending ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </form>
    </Card>
  );
}

export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const userInfoQuery = useQuery({
    queryKey: ["usuario-info", id],
    queryFn: async () => {
      const res = await api.usuarios.info(id!);
      return res;
    },
    enabled: Boolean(id),
  });

  const userQuery = useQuery({
    queryKey: ["usuario", id],
    queryFn: () => api.usuarios.byId(id!),
    enabled: Boolean(id),
  });

  const trayectosQuery = useQuery({
    queryKey: ["trayectos-conductor", id],
    queryFn: async () => {
      const res = await api.viajes.byConductor(id!);
      return res;
    },
    enabled: Boolean(id),
  });

  const devicesQuery = useQuery({
    queryKey: ["dispositivos-usuario", id],
    queryFn: () => api.dispositivos.byUserId(id!),
    enabled: Boolean(id),
  });

  const walletQuery = useQuery({
    queryKey: ["wallet-config", id],
    queryFn: () => api.walletConfig.byUserId(id!),
    enabled: Boolean(id),
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string | number) => api.usuarios.delete(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      navigate("/usuarios");
    },
    onError: (err: Error) => setDeleteError(err.message),
  });

  if (!id) {
    return (
      <Alert title="Error" variant="error">
        Falta el ID en la URL.
      </Alert>
    );
  }

  const info = userInfoQuery.data?.data;
  const user = userQuery.data;
  const trayectos = Array.isArray(trayectosQuery.data)
    ? trayectosQuery.data
    : [];
  const wallet = walletQuery.data?.config;

  const displayName =
    [user?.name, user?.surname].filter(Boolean).join(" ").trim() ||
    user?.email ||
    `Usuario #${id}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">{displayName}</div>
          <div className="text-sm text-gray-600">{user?.email ?? "-"}</div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-panel-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-panel-50 transition-colors"
          >
            <Pencil size={16} />
            <span>{editing ? "Cancelar edición" : "Editar usuario"}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (
                confirm(
                  `¿Eliminar a "${displayName}"? Esta acción no se puede deshacer.`,
                )
              ) {
                setDeleteError(null);
                deleteMutation.mutate(id!);
              }
            }}
            disabled={deleteMutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            <Trash2 size={16} />
            {deleteMutation.isPending ? "Eliminando…" : "Eliminar usuario"}
          </button>
        </div>
      </div>

      {deleteError ? (
        <Alert title="Error" variant="error">
          {deleteError}
        </Alert>
      ) : null}

      {editing ? (
        <UserEditForm
          id={id!}
          user={user}
          info={info}
          onSaved={() => {
            setEditing(false);
            queryClient.invalidateQueries({ queryKey: ["usuario", id] });
            queryClient.invalidateQueries({ queryKey: ["usuario-info", id] });
            queryClient.invalidateQueries({ queryKey: ["usuarios"] });
          }}
          onCancel={() => setEditing(false)}
        />
      ) : null}

      {userInfoQuery.isLoading ? (
        <Alert title="Cargando">Cargando información…</Alert>
      ) : null}
      {userInfoQuery.isError ? (
        <Alert title="Error" variant="error">
          No se pudo cargar la información del usuario.
        </Alert>
      ) : null}

      {info ? (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <Stat label="Viajes" value={info.viajes ?? trayectos.length ?? 0} />
            <Stat
              label="Valoración media"
              value={info.averageRating?.toFixed(1) ?? "-"}
            />
            <Stat label="Opiniones recibidas" value={info.numOpinions ?? 0} />
            <Stat label="Rol" value={info.role ?? user?.role ?? "user"} />
          </div>

          <Card>
            <CardTitle>Información de contacto y perfil</CardTitle>
            <CardSubtitle>Datos del usuario</CardSubtitle>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Nombre completo:</span>{" "}
                <span className="font-medium">
                  {[user?.name, user?.surname].filter(Boolean).join(" ") || "-"}
                </span>
              </div>
              <div>
                <span className="text-gray-500">DNI:</span>{" "}
                <span className="font-medium">{user?.dni ?? "-"}</span>
              </div>
              <div>
                <span className="text-gray-500">Teléfono:</span>{" "}
                <span className="font-medium">{user?.phone ?? info.phone ?? "-"}</span>
              </div>
              <div>
                <span className="text-gray-500">Ciudad:</span>{" "}
                <span className="font-medium">{user?.ciudad ?? "-"}</span>
              </div>
              <div>
                <span className="text-gray-500">Provincia:</span>{" "}
                <span className="font-medium">{user?.provincia ?? "-"}</span>
              </div>
              <div>
                <span className="text-gray-500">Rol:</span>{" "}
                <span className="font-medium uppercase text-xs tracking-wider px-2 py-0.5 rounded bg-gray-100">
                  {user?.role ?? info.role ?? "user"}
                </span>
              </div>
            </div>
            {info.about_me ? (
              <div className="mt-3 border-t border-panel-100 pt-2 text-sm">
                <span className="text-gray-500">Sobre mí:</span>
                <p className="mt-1 text-gray-700 italic">{info.about_me}</p>
              </div>
            ) : null}
          </Card>
        </>
      ) : null}

      <Card>
        <CardTitle>Trayectos como conductor</CardTitle>
        <CardSubtitle>Viajes publicados por este usuario</CardSubtitle>

        <div className="mt-3">
          {trayectosQuery.isLoading ? <Alert>Cargando trayectos…</Alert> : null}
          {trayectosQuery.isError ? (
            <Alert variant="error">No se pudieron cargar los trayectos.</Alert>
          ) : null}

          {!trayectosQuery.isLoading && !trayectosQuery.isError ? (
            <Table>
              <thead>
                <tr>
                  <Th>Origen</Th>
                  <Th>Destino</Th>
                  <Th>Fecha</Th>
                  <Th className="text-right">Plazas</Th>
                  <Th className="text-right">Precio</Th>
                </tr>
              </thead>
              <tbody>
                {trayectos.slice(0, 20).map((t) => (
                  <tr key={t.id} className="hover:bg-panel-50">
                    <Td className="font-medium">
                      <Link className="hover:underline" to={`/viajes/${t.id}`}>
                        {t.origen}
                      </Link>
                    </Td>
                    <Td>{t.destino}</Td>
                    <Td>{formatDateTime(t.hora)}</Td>
                    <Td className="text-right">
                      {t.disponible}/{t.plazas}
                    </Td>
                    <Td className="text-right">{t.precio}€</Td>
                  </tr>
                ))}

                {trayectos.length === 0 ? (
                  <tr>
                    <Td colSpan={5} className="py-8 text-center text-gray-600">
                      Sin trayectos
                    </Td>
                  </tr>
                ) : null}
              </tbody>
            </Table>
          ) : null}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Monedero</CardTitle>
            <CardSubtitle>
              Configuración del monedero virtual del usuario
            </CardSubtitle>
          </div>
          <Link
            to={`/usuarios/${id}/monedero`}
            className="rounded-lg bg-panel-800 px-3 py-2 text-sm font-medium text-white hover:bg-panel-900"
          >
            Ver monedero
          </Link>
        </div>
        <div className="mt-3">
          {walletQuery.isLoading ? (
            <Alert>Cargando configuración del monedero…</Alert>
          ) : walletQuery.isError ? (
            <Alert variant="error">
              No se pudo cargar la configuración del monedero.
            </Alert>
          ) : wallet ? (
            <div className="flex flex-wrap gap-4 text-sm">
              <span>
                <span className="text-gray-500">Estado:</span>{" "}
                <span
                  className={`font-medium ${wallet.wallet_enabled ? "text-green-600" : "text-red-600"}`}
                >
                  {wallet.wallet_enabled ? "Activo" : "Desactivado"}
                </span>
              </span>
              <span>
                <span className="text-gray-500">Saldo:</span>{" "}
                {wallet.wallet_balance_cents != null
                  ? `${(wallet.wallet_balance_cents / 100).toFixed(2)}€`
                  : "-"}
              </span>
              <span>
                <span className="text-gray-500">Stripe:</span>{" "}
                {wallet.stripe_account_id ? "Conectado" : "No conectado"}
              </span>
            </div>
          ) : null}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Dispositivos</CardTitle>
            <CardSubtitle>
              Dispositivos registrados para notificaciones push
            </CardSubtitle>
          </div>
          <Link
            to={`/usuarios/${id}/dispositivos`}
            className="rounded-lg bg-panel-800 px-3 py-2 text-sm font-medium text-white hover:bg-panel-900"
          >
            Ver dispositivos
          </Link>
        </div>
        <div className="mt-3">
          {devicesQuery.isLoading ? (
            <Alert>Cargando dispositivos…</Alert>
          ) : devicesQuery.isError ? (
            <Alert variant="error">
              No se pudieron cargar los dispositivos.
            </Alert>
          ) : (
            <div className="text-sm text-gray-600">
              {devicesQuery.data?.length ?? 0} dispositivo(s) activo(s)
            </div>
          )}
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          <Link className="underline" to="/usuarios">
            Volver a usuarios
          </Link>
        </div>
        <button
          type="button"
          onClick={() => {
            if (
              confirm(
                `¿Eliminar a "${displayName}"? Esta acción no se puede deshacer.`,
              )
            ) {
              setDeleteError(null);
              deleteMutation.mutate(id!);
            }
          }}
          disabled={deleteMutation.isPending}
          className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          <Trash2 size={16} />
          {deleteMutation.isPending ? "Eliminando…" : "Eliminar usuario"}
        </button>
      </div>
    </div>
  );
}
