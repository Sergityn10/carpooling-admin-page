import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { RotateCcw } from "lucide-react";
import { api } from "../api/client";
import type { WalletConfig } from "../api/types";
import Alert from "../components/ui/Alert";
import { Card, CardSubtitle, CardTitle } from "../components/ui/Card";
import Stat from "../components/ui/Stat";
import { formatDateTime } from "../lib/format";

function centsToEuro(cents?: number | null): string {
  if (cents == null) return "-";
  return `${(cents / 100).toFixed(2)}€`;
}

export default function WalletPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [walletError, setWalletError] = useState<string | null>(null);

  const userQuery = useQuery({
    queryKey: ["usuario", id],
    queryFn: () => api.usuarios.byId(id!),
    enabled: Boolean(id),
  });

  const walletQuery = useQuery({
    queryKey: ["wallet-config", id],
    queryFn: () => api.walletConfig.byUserId(id!),
    enabled: Boolean(id),
  });

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

  if (!id) {
    return (
      <Alert title="Error" variant="error">
        Falta el ID en la URL.
      </Alert>
    );
  }

  const user = userQuery.data;
  const wallet = walletQuery.data?.config;
  const saving = updateWalletMutation.isPending || toggleWalletMutation.isPending;

  return (
    <div className="space-y-4">
      <div>
        <div className="text-lg font-semibold">
          Monedero de {user?.name ?? "usuario"} {user?.surname ?? ""}
        </div>
        <div className="text-sm text-gray-600">{user?.email ?? "-"}</div>
      </div>

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
        <>
          {/* ─── Resumen ─── */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <Stat
              label="Monedero"
              value={wallet.wallet_enabled ? "Activo" : "Desactivado"}
            />
            <Stat
              label="Saldo"
              value={centsToEuro(wallet.wallet_balance_cents)}
            />
            <Stat
              label="Pendiente"
              value={centsToEuro(wallet.pending_balance_cents)}
            />
            <Stat
              label="Últ. actualización"
              value={
                wallet.updated_at
                  ? formatDateTime(wallet.updated_at)
                  : "-"
              }
            />
          </div>

          {/* ─── Switch maestro ─── */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Monedero activo</CardTitle>
                <CardSubtitle>
                  Switch maestro para activar/desactivar el monedero
                </CardSubtitle>
              </div>
              <ToggleSwitch
                enabled={wallet.wallet_enabled}
                disabled={toggleWalletMutation.isPending}
                onToggle={() =>
                  toggleWalletMutation.mutate(!wallet.wallet_enabled)
                }
              />
            </div>
          </Card>

          {/* ─── Permisos ─── */}
          <Card>
            <CardTitle>Permisos de transacciones</CardTitle>
            <CardSubtitle>
              Activa o desactiva las operaciones del monedero
            </CardSubtitle>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <PermissionToggle
                label="Recargas"
                description="Permite recargas al monedero"
                enabled={wallet.recharges_enabled}
                disabled={!wallet.wallet_enabled || saving}
                onToggle={() =>
                  updateWalletMutation.mutate({
                    recharges_enabled: !wallet.recharges_enabled,
                  })
                }
              />
              <PermissionToggle
                label="Retiros"
                description="Permite retiros desde el monedero"
                enabled={wallet.payouts_enabled}
                disabled={!wallet.wallet_enabled || saving}
                onToggle={() =>
                  updateWalletMutation.mutate({
                    payouts_enabled: !wallet.payouts_enabled,
                  })
                }
              />
              <PermissionToggle
                label="Pagos"
                description="Permite pagos de trayectos"
                enabled={wallet.payments_enabled}
                disabled={!wallet.wallet_enabled || saving}
                onToggle={() =>
                  updateWalletMutation.mutate({
                    payments_enabled: !wallet.payments_enabled,
                  })
                }
              />
            </div>
          </Card>

          {/* ─── Límites ─── */}
          <Card>
            <CardTitle>Límites</CardTitle>
            <CardSubtitle>
              Límites personalizados para este usuario (en €)
            </CardSubtitle>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <LimitInput
                label="Recarga mínima"
                value={wallet.min_recharge_cents}
                disabled={!wallet.wallet_enabled || saving}
                onSave={(cents) =>
                  updateWalletMutation.mutate({ min_recharge_cents: cents })
                }
              />
              <LimitInput
                label="Recarga máxima"
                value={wallet.max_recharge_cents}
                disabled={!wallet.wallet_enabled || saving}
                onSave={(cents) =>
                  updateWalletMutation.mutate({ max_recharge_cents: cents })
                }
              />
              <LimitInput
                label="Retiro diario máximo"
                value={wallet.max_daily_payout_cents}
                disabled={!wallet.wallet_enabled || saving}
                onSave={(cents) =>
                  updateWalletMutation.mutate({
                    max_daily_payout_cents: cents,
                  })
                }
              />
            </div>
          </Card>

          {/* ─── Stripe ─── */}
          <Card>
            <CardTitle>Cuenta Stripe</CardTitle>
            <CardSubtitle>
              Información de la cuenta de Stripe del usuario
            </CardSubtitle>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoRow
                label="Stripe Account ID"
                value={wallet.stripe_account_id ?? "-"}
              />
              <InfoRow
                label="Stripe Customer ID"
                value={wallet.stripe_customer_id ?? "-"}
              />
              <InfoRow
                label="Estado cuenta"
                value={wallet.stripe_account_status ?? "-"}
              />
              <InfoRow
                label="Tipo de cuenta"
                value={wallet.stripe_account_type ?? "-"}
              />
            </div>
          </Card>

          {/* ─── Metadatos ─── */}
          <Card>
            <CardTitle>Metadatos</CardTitle>
            <CardSubtitle>Información de auditoría</CardSubtitle>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoRow
                label="Config ID"
                value={wallet.id ?? "-"}
              />
              <InfoRow
                label="Actualizado por"
                value={wallet.updated_by ?? "-"}
              />
              <InfoRow
                label="Creado"
                value={
                  wallet.created_at ? formatDateTime(wallet.created_at) : "-"
                }
              />
              <InfoRow
                label="Últ. actualización"
                value={
                  wallet.updated_at ? formatDateTime(wallet.updated_at) : "-"
                }
              />
            </div>
          </Card>

          {/* ─── Acciones ─── */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <Link className="underline" to={`/usuarios/${id}`}>
                Volver al usuario
              </Link>
            </div>
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
              <RotateCcw size={16} />
              {resetWalletMutation.isPending
                ? "Restaurando…"
                : "Restaurar defaults"}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

function ToggleSwitch({
  enabled,
  disabled,
  onToggle,
}: {
  enabled: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
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
  );
}

function PermissionToggle({
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
      <ToggleSwitch
        enabled={enabled}
        disabled={disabled}
        onToggle={onToggle}
      />
    </div>
  );
}

function LimitInput({
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

  useEffect(() => {
    if (!editing) {
      setEuroValue((value / 100).toFixed(2));
    }
  }, [value, editing]);

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
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") {
                setEuroValue((value / 100).toFixed(2));
                setEditing(false);
              }
            }}
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-panel-200 p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 break-all text-sm font-medium">{value}</div>
    </div>
  );
}
