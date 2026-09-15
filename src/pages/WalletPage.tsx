import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ExternalLink, RefreshCw, RotateCcw } from "lucide-react";
import { api } from "../api/client";
import type { Account, AccountUpdateInput, WalletConfig } from "../api/types";
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

  const userInfoQuery = useQuery({
    queryKey: ["usuario-info", id],
    queryFn: () => api.usuarios.info(id!),
    enabled: Boolean(id),
  });

  const accountsQuery = useQuery({
    queryKey: ["accounts", "user", id],
    queryFn: () => api.accounts.list({ user_id: id! }),
    enabled: Boolean(id),
    retry: false,
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

  const [stripeLink, setStripeLink] = useState<string | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);

  const syncAccountMutation = useMutation({
    mutationFn: () => api.accounts.sync(id!),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["accounts", "user", id] });
      setSyncSuccess(data.message);
      setStripeError(null);
      setTimeout(() => setSyncSuccess(null), 5000);
    },
    onError: (err: Error) => {
      setStripeError(err.message);
      setSyncSuccess(null);
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: ({
      stripeAccountId,
      data,
    }: {
      stripeAccountId: string;
      data: AccountUpdateInput;
    }) => api.accounts.update(stripeAccountId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts", "user", id] });
      setStripeError(null);
    },
    onError: (err: Error) => setStripeError(err.message),
  });

  const createOnboardingMutation = useMutation({
    mutationFn: () =>
      api.stripeConnect.createOnboarding(id!, {
        return_url: window.location.href,
        refresh_url: window.location.href,
      }),
    onSuccess: (data) => {
      setStripeLink(data.accountLink.url);
      setStripeError(null);
      queryClient.invalidateQueries({ queryKey: ["accounts", "user", id] });
    },
    onError: (err: Error) => setStripeError(err.message),
  });

  const regenerateLinkMutation = useMutation({
    mutationFn: () =>
      api.stripeConnect.regenerateLink(id!, {
        return_url: window.location.href,
        refresh_url: window.location.href,
      }),
    onSuccess: (data) => {
      setStripeLink(data.accountLink.url);
      setStripeError(null);
    },
    onError: (err: Error) => setStripeError(err.message),
  });

  const loginLinkMutation = useMutation({
    mutationFn: () => api.stripeConnect.loginLink(id!),
    onSuccess: (data) => {
      setStripeLink(data.loginLink.url);
      setStripeError(null);
    },
    onError: (err: Error) => setStripeError(err.message),
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
  const monedero = userInfoQuery.data?.data?.monedero;
  const account = accountsQuery.data?.accounts?.[0] ?? null;
  const saving =
    updateWalletMutation.isPending || toggleWalletMutation.isPending;
  const stripeLoading =
    createOnboardingMutation.isPending ||
    regenerateLinkMutation.isPending ||
    loginLinkMutation.isPending ||
    syncAccountMutation.isPending ||
    updateAccountMutation.isPending;

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
                wallet.updated_at ? formatDateTime(wallet.updated_at) : "-"
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

          {/* ─── Cuenta Stripe (modelo Account) ─── */}
          <Card>
            <CardTitle>Cuenta Stripe Connect</CardTitle>
            <CardSubtitle>
              Gestión de la cuenta Stripe del usuario (modelo Account)
            </CardSubtitle>

            <div className="mt-3 space-y-4">
              {stripeError ? (
                <Alert title="Error Stripe" variant="error">
                  {stripeError}
                </Alert>
              ) : null}

              {syncSuccess ? (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                  {syncSuccess}
                </div>
              ) : null}

              {stripeLink ? (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <div className="text-sm font-medium text-blue-900">
                    Link generado
                  </div>
                  <div className="mt-1 break-all text-xs text-blue-700">
                    {stripeLink}
                  </div>
                  <a
                    href={stripeLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    <ExternalLink size={14} />
                    Abrir link
                  </a>
                </div>
              ) : null}

              {accountsQuery.isLoading ? (
                <Alert>Cargando cuenta Stripe…</Alert>
              ) : accountsQuery.isError || !account ? (
                <div className="space-y-3">
                  <div className="rounded-lg border border-panel-200 p-3">
                    <div className="text-sm text-gray-600">
                      El usuario no tiene cuenta Stripe Connect registrada en la
                      base de datos.
                    </div>
                  </div>
                  <button
                    onClick={() => createOnboardingMutation.mutate()}
                    disabled={stripeLoading}
                    className="flex items-center gap-2 rounded-lg bg-panel-800 px-4 py-2 text-sm font-medium text-white hover:bg-panel-900 disabled:opacity-50"
                  >
                    <ExternalLink size={16} />
                    {createOnboardingMutation.isPending
                      ? "Creando cuenta…"
                      : "Crear cuenta + onboarding"}
                  </button>

                  <button
                    onClick={() => syncAccountMutation.mutate()}
                    disabled={stripeLoading}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <RefreshCw
                      size={16}
                      className={
                        syncAccountMutation.isPending ? "animate-spin" : ""
                      }
                    />
                    {syncAccountMutation.isPending
                      ? "Sincronizando…"
                      : "Sincronizar desde Stripe"}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <InfoRow
                      label="Stripe Account ID"
                      value={account.stripe_account_id}
                    />
                    <InfoRow label="User ID" value={account.user_id} />
                    <InfoRow
                      label="Onboarding"
                      value={
                        account.details_submitted ? "Completado" : "Incompleto"
                      }
                    />
                    <InfoRow
                      label="Cuenta por defecto"
                      value={account.default_account ? "Sí" : "No"}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <StripeBadge
                      label="Charges"
                      enabled={account.charges_enabled}
                    />
                    <StripeBadge
                      label="Transfers"
                      enabled={account.transfers_enabled}
                    />
                    <StripeBadge
                      label="Details submitted"
                      enabled={account.details_submitted}
                    />
                  </div>

                  {/* ─── Edición manual de flags ─── */}
                  <div className="rounded-lg border border-panel-200 p-3">
                    <div className="text-sm font-medium">
                      Editar flags de la cuenta
                    </div>
                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <FlagToggle
                        label="charges_enabled"
                        enabled={account.charges_enabled}
                        disabled={updateAccountMutation.isPending}
                        onToggle={() =>
                          updateAccountMutation.mutate({
                            stripeAccountId: account.stripe_account_id,
                            data: {
                              charges_enabled: !account.charges_enabled,
                            },
                          })
                        }
                      />
                      <FlagToggle
                        label="transfers_enabled"
                        enabled={account.transfers_enabled}
                        disabled={updateAccountMutation.isPending}
                        onToggle={() =>
                          updateAccountMutation.mutate({
                            stripeAccountId: account.stripe_account_id,
                            data: {
                              transfers_enabled: !account.transfers_enabled,
                            },
                          })
                        }
                      />
                      <FlagToggle
                        label="details_submitted"
                        enabled={account.details_submitted}
                        disabled={updateAccountMutation.isPending}
                        onToggle={() =>
                          updateAccountMutation.mutate({
                            stripeAccountId: account.stripe_account_id,
                            data: {
                              details_submitted: !account.details_submitted,
                            },
                          })
                        }
                      />
                      <FlagToggle
                        label="default_account"
                        enabled={account.default_account}
                        disabled={updateAccountMutation.isPending}
                        onToggle={() =>
                          updateAccountMutation.mutate({
                            stripeAccountId: account.stripe_account_id,
                            data: {
                              default_account: !account.default_account,
                            },
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* ─── Botones de acción ─── */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => syncAccountMutation.mutate()}
                      disabled={stripeLoading}
                      className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      <RefreshCw
                        size={16}
                        className={
                          syncAccountMutation.isPending ? "animate-spin" : ""
                        }
                      />
                      {syncAccountMutation.isPending
                        ? "Sincronizando…"
                        : "Sincronizar desde Stripe"}
                    </button>

                    {!account.details_submitted ? (
                      <button
                        onClick={() => regenerateLinkMutation.mutate()}
                        disabled={stripeLoading}
                        className="flex items-center gap-2 rounded-lg bg-panel-800 px-4 py-2 text-sm font-medium text-white hover:bg-panel-900 disabled:opacity-50"
                      >
                        <ExternalLink size={16} />
                        {regenerateLinkMutation.isPending
                          ? "Generando…"
                          : "Regenerar link onboarding"}
                      </button>
                    ) : (
                      <button
                        onClick={() => loginLinkMutation.mutate()}
                        disabled={stripeLoading}
                        className="flex items-center gap-2 rounded-lg bg-panel-800 px-4 py-2 text-sm font-medium text-white hover:bg-panel-900 disabled:opacity-50"
                      >
                        <ExternalLink size={16} />
                        {loginLinkMutation.isPending
                          ? "Generando…"
                          : "Acceso al dashboard"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* ─── Info del monedero (desde getUserInfo) ─── */}
          {monedero ? (
            <Card>
              <CardTitle>Estado del monedero</CardTitle>
              <CardSubtitle>
                Información en tiempo real desde el backend
              </CardSubtitle>
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InfoRow
                    label="Disponible"
                    value={monedero.disponible ? "Sí" : "No"}
                  />
                  <InfoRow
                    label="Wallet activa"
                    value={monedero.wallet_activa ? "Sí" : "No"}
                  />
                  <InfoRow
                    label="Stripe Account"
                    value={monedero.stripe_account_id ?? "-"}
                  />
                  <InfoRow
                    label="Stripe Customer"
                    value={monedero.stripe_customer_account ?? "-"}
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <StripeBadge
                    label="Charges"
                    enabled={monedero.charges_enabled}
                  />
                  <StripeBadge
                    label="Transfers"
                    enabled={monedero.transfers_enabled}
                  />
                  <StripeBadge
                    label="Onboarding"
                    enabled={monedero.onboarding_completado}
                  />
                </div>
                {monedero.mensaje ? (
                  <div className="rounded-lg border border-panel-200 bg-panel-50 p-3 text-sm text-gray-700">
                    {monedero.mensaje}
                  </div>
                ) : null}
              </div>
            </Card>
          ) : null}

          {/* ─── Metadatos ─── */}
          <Card>
            <CardTitle>Metadatos</CardTitle>
            <CardSubtitle>Información de auditoría</CardSubtitle>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoRow label="Config ID" value={wallet.id ?? "-"} />
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
      <ToggleSwitch enabled={enabled} disabled={disabled} onToggle={onToggle} />
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

function StripeBadge({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg border p-3 ${
        enabled ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
      }`}
    >
      <span className="text-sm font-medium">{label}</span>
      <span
        className={`text-xs font-semibold ${
          enabled ? "text-green-700" : "text-red-700"
        }`}
      >
        {enabled ? "✓" : "✗"}
      </span>
    </div>
  );
}

function FlagToggle({
  label,
  enabled,
  disabled,
  onToggle,
}: {
  label: string;
  enabled: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-panel-200 p-2">
      <span className="text-xs font-mono text-gray-600">{label}</span>
      <button
        onClick={onToggle}
        disabled={disabled}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          enabled ? "bg-green-500" : "bg-gray-300"
        } disabled:opacity-50`}
      >
        <span
          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
            enabled ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
