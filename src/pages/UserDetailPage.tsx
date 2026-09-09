import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { RotateCcw, Trash2 } from "lucide-react";
import { api } from "../api/client";
import type { WalletConfig } from "../api/types";
import Alert from "../components/ui/Alert";
import { Card, CardSubtitle, CardTitle } from "../components/ui/Card";
import Stat from "../components/ui/Stat";
import { Table, Td, Th } from "../components/ui/Table";
import { formatDateTime } from "../lib/format";

export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const userInfoQuery = useQuery({
    queryKey: ["usuario-info", id],
    queryFn: () => api.usuarios.info(id!),
    enabled: Boolean(id),
  });

  const userQuery = useQuery({
    queryKey: ["usuario", id],
    queryFn: () => api.usuarios.byId(id!),
    enabled: Boolean(id),
  });

  const trayectosQuery = useQuery({
    queryKey: ["trayectos-conductor", id],
    queryFn: () => api.viajes.byConductor(id!),
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

  const [walletError, setWalletError] = useState<string | null>(null);

  const updateWalletMutation = useMutation({
    mutationFn: (data: Partial<WalletConfig>) =>
      api.walletConfig.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet-config", id] });
      setWalletError(null);
    },
    onError: (err: Error) => setWalletError(err.message),
  });

  const toggleWalletMutation = useMutation({
    mutationFn: (wallet_enabled: boolean) =>
      api.walletConfig.toggle(id!, wallet_enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet-config", id] });
      setWalletError(null);
    },
    onError: (err: Error) => setWalletError(err.message),
  });

  const resetWalletMutation = useMutation({
    mutationFn: () => api.walletConfig.reset(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet-config", id] });
      setWalletError(null);
    },
    onError: (err: Error) => setWalletError(err.message),
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

  return (
    <div className="space-y-4">
      <div>
        <div className="text-lg font-semibold">
          {user?.name ?? "Usuario"} {user?.surname ?? ""}
        </div>
        <div className="text-sm text-gray-600">{user?.email ?? "-"}</div>
      </div>

      {deleteError ? (
        <Alert title="Error" variant="error">
          {deleteError}
        </Alert>
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
            <Stat label="Viajes" value={info.viajes ?? 0} />
            <Stat
              label="Valoración media"
              value={info.averageRating?.toFixed(1) ?? "-"}
            />
            <Stat label="Opiniones recibidas" value={info.numOpinions ?? 0} />
            <Stat label="Rol" value={info.role ?? user?.role ?? "user"} />
          </div>

          <Card>
            <CardTitle>Información de contacto</CardTitle>
            <CardSubtitle>Datos del usuario</CardSubtitle>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Teléfono:</span>{" "}
                {info.phone ?? "-"}
              </div>
              <div>
                <span className="text-gray-500">DNI:</span> {user?.dni ?? "-"}
              </div>
              <div>
                <span className="text-gray-500">Teléfono:</span>{" "}
                {user?.phone ?? "-"}
              </div>
            </div>
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
          {wallet ? (
            <button
              onClick={() => {
                if (
                  confirm(
                    "¿Restaurar la configuración del monedero a valores por defecto?",
                  )
                ) {
                  resetWalletMutation.mutate();
                }
              }}
              disabled={resetWalletMutation.isPending}
              className="flex items-center gap-1.5 rounded-lg border border-panel-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-panel-50 disabled:opacity-50"
            >
              <RotateCcw size={14} />
              {resetWalletMutation.isPending
                ? "Restaurando…"
                : "Restaurar defaults"}
            </button>
          ) : null}
        </div>

        <div className="mt-3">
          {walletError ? (
            <Alert title="Error" variant="error">
              {walletError}
            </Alert>
          ) : null}

          {walletQuery.isLoading ? (
            <Alert>Cargando configuración del monedero…</Alert>
          ) : walletQuery.isError ? (
            <Alert variant="error">
              No se pudo cargar la configuración del monedero.
            </Alert>
          ) : wallet ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-panel-200 p-3">
                <div>
                  <div className="text-sm font-medium">Monedero activo</div>
                  <div className="text-xs text-gray-500">
                    Switch maestro para activar/desactivar el monedero
                  </div>
                </div>
                <button
                  onClick={() =>
                    toggleWalletMutation.mutate(!wallet.wallet_enabled)
                  }
                  disabled={toggleWalletMutation.isPending}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    wallet.wallet_enabled ? "bg-green-500" : "bg-gray-300"
                  } disabled:opacity-50`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      wallet.wallet_enabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <WalletToggle
                  label="Recargas"
                  description="Permite recargas al monedero"
                  enabled={wallet.recharges_enabled}
                  disabled={
                    !wallet.wallet_enabled || updateWalletMutation.isPending
                  }
                  onToggle={() =>
                    updateWalletMutation.mutate({
                      recharges_enabled: !wallet.recharges_enabled,
                    })
                  }
                />
                <WalletToggle
                  label="Retiros"
                  description="Permite retiros desde el monedero"
                  enabled={wallet.payouts_enabled}
                  disabled={
                    !wallet.wallet_enabled || updateWalletMutation.isPending
                  }
                  onToggle={() =>
                    updateWalletMutation.mutate({
                      payouts_enabled: !wallet.payouts_enabled,
                    })
                  }
                />
                <WalletToggle
                  label="Pagos"
                  description="Permite pagos de trayectos desde el monedero"
                  enabled={wallet.payments_enabled}
                  disabled={
                    !wallet.wallet_enabled || updateWalletMutation.isPending
                  }
                  onToggle={() =>
                    updateWalletMutation.mutate({
                      payments_enabled: !wallet.payments_enabled,
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <WalletLimitInput
                  label="Recarga mínima (€)"
                  value={wallet.min_recharge_cents}
                  disabled={
                    !wallet.wallet_enabled || updateWalletMutation.isPending
                  }
                  onSave={(cents) =>
                    updateWalletMutation.mutate({ min_recharge_cents: cents })
                  }
                />
                <WalletLimitInput
                  label="Recarga máxima (€)"
                  value={wallet.max_recharge_cents}
                  disabled={
                    !wallet.wallet_enabled || updateWalletMutation.isPending
                  }
                  onSave={(cents) =>
                    updateWalletMutation.mutate({ max_recharge_cents: cents })
                  }
                />
                <WalletLimitInput
                  label="Retiro diario máximo (€)"
                  value={wallet.max_daily_payout_cents}
                  disabled={
                    !wallet.wallet_enabled || updateWalletMutation.isPending
                  }
                  onSave={(cents) =>
                    updateWalletMutation.mutate({
                      max_daily_payout_cents: cents,
                    })
                  }
                />
              </div>
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
          onClick={() => {
            if (
              confirm(
                `¿Eliminar a ${user?.name ?? "este usuario"} ${user?.surname ?? ""}? Esta acción no se puede deshacer.`,
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

function WalletToggle({
  label,
  description,
  enabled,
  disabled,
  onToggle,
}: {
  label: string;
  description: string;
  enabled: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-panel-200 p-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-gray-500">{description}</div>
      </div>
      <button
        onClick={onToggle}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? "bg-green-500" : "bg-gray-300"
        } disabled:opacity-50`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

function WalletLimitInput({
  label,
  value,
  disabled,
  onSave,
}: {
  label: string;
  value: number;
  disabled: boolean;
  onSave: (cents: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [euroValue, setEuroValue] = useState((value / 100).toFixed(2));

  function handleSave() {
    const cents = Math.round(parseFloat(euroValue) * 100);
    if (isNaN(cents) || cents < 0) return;
    onSave(cents);
    setEditing(false);
  }

  return (
    <div className="rounded-lg border border-panel-200 p-3">
      <div className="text-sm font-medium">{label}</div>
      {editing ? (
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            step="0.01"
            min="0"
            value={euroValue}
            onChange={(e) => setEuroValue(e.target.value)}
            className="w-24 rounded-lg border border-panel-200 px-2 py-1 text-sm"
            autoFocus
          />
          <button
            onClick={handleSave}
            className="rounded-lg bg-panel-800 px-2 py-1 text-xs font-medium text-white hover:bg-panel-900"
          >
            Guardar
          </button>
          <button
            onClick={() => {
              setEuroValue((value / 100).toFixed(2));
              setEditing(false);
            }}
            className="rounded-lg border border-panel-200 px-2 py-1 text-xs text-gray-600 hover:bg-panel-50"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <div className="mt-2 flex items-center justify-between">
          <span className="text-lg font-semibold">
            {(value / 100).toFixed(2)}€
          </span>
          <button
            onClick={() => setEditing(true)}
            disabled={disabled}
            className="text-xs font-medium text-panel-700 hover:underline disabled:opacity-50"
          >
            Editar
          </button>
        </div>
      )}
    </div>
  );
}
