import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CheckSquare,
  Eye,
  Filter,
  Search,
  Smartphone,
  Square,
  User,
  Users,
  X,
} from "lucide-react";
import clsx from "clsx";
import { api } from "../../api/client";
import type {
  AdminNotificationTarget,
  AdminPreviewResponse,
  AdminRecipientItem,
  NotificationPlatform,
  NotificationTargetType,
  Usuario,
} from "../../api/types";
import Alert from "../ui/Alert";
import Button from "../ui/Button";
import { Card, CardSubtitle, CardTitle } from "../ui/Card";
import Input from "../ui/Input";

export type SelectedRecipientEntry = {
  key: string;
  userId?: string;
  email?: string;
  name?: string;
  platform?: string | null;
  source: "user" | "device" | "manual";
};

type PickerSourceTab = "users" | "devices";

type TargetAudienceSelectorProps = {
  target: AdminNotificationTarget;
  selectedEntries: SelectedRecipientEntry[];
  onChangeTarget: (next: AdminNotificationTarget) => void;
  onChangeSelectedEntries: (next: SelectedRecipientEntry[]) => void;
  previewData?: AdminPreviewResponse | null;
  previewLoading: boolean;
  previewError?: string | null;
  onRequestPreview: () => void;
};

const TARGET_MODES: Array<{
  type: NotificationTargetType;
  label: string;
  description: string;
  icon: typeof Users;
}> = [
  {
    type: "single",
    label: "Usuario único",
    description: "Destinatario o token concreto",
    icon: User,
  },
  {
    type: "users",
    label: "Selección múltiple",
    description: "Varios usuarios o emails",
    icon: Users,
  },
  {
    type: "filter",
    label: "Por filtro",
    description: "Rol y/o plataforma móvil",
    icon: Filter,
  },
  {
    type: "all",
    label: "Todos",
    description: "Difusión global (broadcast)",
    icon: Users,
  },
];

function buildTargetFromEntries(
  type: "single" | "users",
  entries: SelectedRecipientEntry[],
  prev: AdminNotificationTarget,
): AdminNotificationTarget {
  if (type === "single") {
    const first = entries[0];
    if (!first) {
      return {
        type: "single",
        userId: prev.userId,
        email: prev.email,
        name: prev.name,
        token: prev.token,
      };
    }
    return {
      type: "single",
      userId: first.userId || undefined,
      email: first.email || undefined,
      name: first.name || undefined,
    };
  }

  const userIds = Array.from(
    new Set(entries.map((e) => e.userId).filter((v): v is string => Boolean(v))),
  );
  const emails = Array.from(
    new Set(
      entries
        .filter((e) => !e.userId && Boolean(e.email))
        .map((e) => e.email as string),
    ),
  );
  return {
    type: "users",
    userIds,
    emails,
    tokens: prev.tokens ?? [],
  };
}

function userToEntry(u: Usuario): SelectedRecipientEntry {
  const fullName = [u.name, u.surname].filter(Boolean).join(" ").trim();
  return {
    key: `user:${u.id}`,
    userId: String(u.id),
    email: u.email,
    name: fullName || undefined,
    source: "user",
  };
}

function deviceToEntry(d: AdminRecipientItem): SelectedRecipientEntry {
  return {
    key: `user:${d.userId}`,
    userId: d.userId,
    email: d.email || undefined,
    platform: d.platform,
    source: "device",
  };
}

export default function TargetAudienceSelector({
  target,
  selectedEntries,
  onChangeTarget,
  onChangeSelectedEntries,
  previewData,
  previewLoading,
  previewError,
  onRequestPreview,
}: TargetAudienceSelectorProps) {
  const [sourceTab, setSourceTab] = useState<PickerSourceTab>("users");
  const [searchTerm, setSearchTerm] = useState("");
  const [devicePlatformFilter, setDevicePlatformFilter] = useState("all");
  const [devicePage, setDevicePage] = useState(1);
  const [manualEmailInput, setManualEmailInput] = useState("");
  const [manualEmailsBatch, setManualEmailsBatch] = useState("");

  const shouldLoadPicker = target.type === "single" || target.type === "users";

  const usersQuery = useQuery({
    queryKey: ["notificaciones-picker-usuarios"],
    queryFn: () => api.usuarios.list(),
    enabled: shouldLoadPicker && sourceTab === "users",
    staleTime: 60_000,
  });

  const devicesQuery = useQuery({
    queryKey: [
      "notificaciones-picker-dispositivos",
      devicePage,
      devicePlatformFilter,
      searchTerm,
    ],
    queryFn: () =>
      api.notificaciones.recipients({
        page: devicePage,
        limit: 12,
        active: true,
        platform: devicePlatformFilter,
        search: searchTerm,
      }),
    enabled: shouldLoadPicker && sourceTab === "devices",
  });

  const filteredUsers = useMemo(() => {
    const list = usersQuery.data ?? [];
    const q = searchTerm.trim().toLowerCase();
    if (!q) return list.slice(0, 20);
    return list
      .filter((u) => {
        const full = `${u.name ?? ""} ${u.surname ?? ""}`.toLowerCase();
        return (
          full.includes(q) ||
          (u.email ?? "").toLowerCase().includes(q) ||
          String(u.id).toLowerCase().includes(q)
        );
      })
      .slice(0, 30);
  }, [usersQuery.data, searchTerm]);

  const selectedKeys = useMemo(
    () => new Set(selectedEntries.map((e) => e.key)),
    [selectedEntries],
  );

  const handleModeSwitch = (nextType: NotificationTargetType) => {
    if (nextType === "all") {
      onChangeTarget({
        type: "all",
        fallbackToDeviceTokens: target.fallbackToDeviceTokens ?? true,
      });
      return;
    }
    if (nextType === "filter") {
      onChangeTarget({
        type: "filter",
        role: target.role || "all",
        platform: (target.platform as NotificationPlatform) || "all",
      });
      return;
    }
    if (nextType === "single") {
      const first = selectedEntries.slice(0, 1);
      onChangeSelectedEntries(first);
      onChangeTarget(buildTargetFromEntries("single", first, target));
      return;
    }
    onChangeTarget(buildTargetFromEntries("users", selectedEntries, target));
  };

  const toggleEntry = (entry: SelectedRecipientEntry) => {
    if (target.type === "single") {
      const next = [entry];
      onChangeSelectedEntries(next);
      onChangeTarget(buildTargetFromEntries("single", next, target));
      return;
    }

    const exists = selectedKeys.has(entry.key);
    const next = exists
      ? selectedEntries.filter((e) => e.key !== entry.key)
      : [...selectedEntries, entry];
    onChangeSelectedEntries(next);
    onChangeTarget(buildTargetFromEntries("users", next, target));
  };

  const removeEntry = (key: string) => {
    const next = selectedEntries.filter((e) => e.key !== key);
    onChangeSelectedEntries(next);
    if (target.type === "single" || target.type === "users") {
      onChangeTarget(buildTargetFromEntries(target.type, next, target));
    }
  };

  const handleAddManualEmails = () => {
    const parts = manualEmailsBatch
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter((s) => s.includes("@"));
    if (parts.length === 0) return;

    const existing = new Set(selectedEntries.map((e) => e.key));
    const added: SelectedRecipientEntry[] = [];
    for (const email of parts) {
      const key = `email:${email.toLowerCase()}`;
      if (!existing.has(key)) {
        existing.add(key);
        added.push({ key, email, source: "manual" });
      }
    }
    const next = [...selectedEntries, ...added];
    onChangeSelectedEntries(next);
    onChangeTarget(buildTargetFromEntries("users", next, target));
    setManualEmailsBatch("");
  };

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <CardTitle>Destinatarios y segmentación</CardTitle>
          <CardSubtitle>
            Elige quién recibirá la comunicación y verifica el alcance antes de enviar
          </CardSubtitle>
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={onRequestPreview}
          disabled={previewLoading}
          className="border border-panel-200 bg-white"
        >
          <Eye size={15} />
          {previewLoading ? "Calculando…" : "Previsualizar alcance"}
        </Button>
      </div>

      {/* Mode cards */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TARGET_MODES.map((m) => {
          const Icon = m.icon;
          const active = target.type === m.type;
          return (
            <button
              key={m.type}
              type="button"
              onClick={() => handleModeSwitch(m.type)}
              className={clsx(
                "flex flex-col items-start rounded-lg border p-3 text-left transition-colors",
                active
                  ? "border-panel-700 bg-panel-50 text-panel-950"
                  : "border-panel-200 bg-white text-gray-700 hover:bg-panel-50",
              )}
            >
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <Icon size={15} className={active ? "text-panel-700" : "text-gray-500"} />
                {m.label}
              </div>
              <span className="mt-0.5 text-xs text-gray-500">{m.description}</span>
            </button>
          );
        })}
      </div>

      {/* Single / Users Selector */}
      {(target.type === "single" || target.type === "users") && (
        <div className="mt-4 space-y-3 rounded-lg border border-panel-200 bg-panel-50/50 p-3">
          {/* Selected summary */}
          {selectedEntries.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedEntries.map((entry) => (
                <span
                  key={entry.key}
                  className="inline-flex items-center gap-1.5 rounded-full bg-panel-100 px-2.5 py-1 text-xs font-medium text-panel-900"
                >
                  <span>
                    {entry.name
                      ? `${entry.name} (${entry.email || entry.userId})`
                      : entry.email || entry.userId}
                  </span>
                  {entry.platform && (
                    <span className="rounded bg-white px-1 text-[10px] uppercase text-panel-700">
                      {entry.platform}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeEntry(entry.key)}
                    className="rounded-full p-0.5 hover:bg-panel-200"
                    aria-label="Quitar destinatario"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Two separate tabs: Todos los usuarios vs Dispositivos registrados */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-panel-200 pb-2">
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setSourceTab("users");
                  setDevicePage(1);
                }}
                className={clsx(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  sourceTab === "users"
                    ? "bg-panel-800 text-white"
                    : "bg-white text-gray-700 border border-panel-200 hover:bg-panel-100",
                )}
              >
                <Users size={13} />
                Todos los usuarios
              </button>
              <button
                type="button"
                onClick={() => {
                  setSourceTab("devices");
                  setDevicePage(1);
                }}
                className={clsx(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  sourceTab === "devices"
                    ? "bg-panel-800 text-white"
                    : "bg-white text-gray-700 border border-panel-200 hover:bg-panel-100",
                )}
              >
                <Smartphone size={13} />
                Dispositivos registrados (Push)
              </button>
            </div>

            {sourceTab === "devices" && (
              <select
                value={devicePlatformFilter}
                onChange={(e) => {
                  setDevicePlatformFilter(e.target.value);
                  setDevicePage(1);
                }}
                className="rounded-md border border-panel-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-panel-500"
              >
                <option value="all">Todas las plataformas</option>
                <option value="android">Android</option>
                <option value="ios">iOS</option>
                <option value="web">Web</option>
              </select>
            )}
          </div>

          {/* Search box */}
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setDevicePage(1);
              }}
              placeholder={
                sourceTab === "users"
                  ? "Buscar por nombre, email o ID de usuario…"
                  : "Buscar dispositivo por email, userId o nombre de dispositivo…"
              }
              className="bg-white pl-8"
            />
          </div>

          {/* List for selected source tab */}
          <div className="max-h-56 overflow-y-auto rounded-lg border border-panel-200 bg-white divide-y divide-panel-100">
            {sourceTab === "users" ? (
              usersQuery.isLoading ? (
                <div className="p-3 text-xs text-gray-500">Cargando usuarios…</div>
              ) : usersQuery.isError ? (
                <div className="p-3 text-xs text-red-600">
                  No se pudieron cargar los usuarios de la plataforma.
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-3 text-xs text-gray-500">
                  Sin usuarios coincidentes.
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const entry = userToEntry(u);
                  const checked = selectedKeys.has(entry.key);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleEntry(entry)}
                      className={clsx(
                        "flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-panel-50",
                        checked && "bg-panel-50",
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {checked ? (
                          <CheckSquare size={15} className="shrink-0 text-panel-700" />
                        ) : (
                          <Square size={15} className="shrink-0 text-gray-400" />
                        )}
                        <div className="truncate">
                          <span className="font-medium text-gray-900">
                            {entry.name || u.email}
                          </span>
                          <span className="ml-2 text-gray-500">{u.email}</span>
                        </div>
                      </div>
                      <span className="ml-2 shrink-0 rounded bg-panel-100 px-1.5 py-0.5 text-[10px] text-panel-800">
                        {u.role || "user"}
                      </span>
                    </button>
                  );
                })
              )
            ) : devicesQuery.isLoading ? (
              <div className="p-3 text-xs text-gray-500">
                Cargando dispositivos registrados…
              </div>
            ) : devicesQuery.isError ? (
              <div className="p-3 text-xs text-red-600">
                No se pudo cargar el listado de dispositivos.
              </div>
            ) : (devicesQuery.data?.items?.length ?? 0) === 0 ? (
              <div className="p-3 text-xs text-gray-500">
                Sin dispositivos registrados con ese filtro.
              </div>
            ) : (
              devicesQuery.data!.items.map((d) => {
                const entry = deviceToEntry(d);
                const checked = selectedKeys.has(entry.key);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleEntry(entry)}
                    className={clsx(
                      "flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-panel-50",
                      checked && "bg-panel-50",
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {checked ? (
                        <CheckSquare size={15} className="shrink-0 text-panel-700" />
                      ) : (
                        <Square size={15} className="shrink-0 text-gray-400" />
                      )}
                      <div className="truncate">
                        <span className="font-medium text-gray-900">
                          {d.email || d.userId}
                        </span>
                        {d.deviceName && (
                          <span className="ml-2 text-gray-500">
                            {d.deviceName}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="ml-2 shrink-0 rounded bg-panel-100 px-1.5 py-0.5 text-[10px] uppercase text-panel-800">
                      {d.platform || "unknown"}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {sourceTab === "devices" &&
            (devicesQuery.data?.pagination?.totalPages ?? 1) > 1 && (
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>
                  Página {devicesQuery.data?.pagination.page} de{" "}
                  {devicesQuery.data?.pagination.totalPages} (
                  {devicesQuery.data?.pagination.total} dispositivos)
                </span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    disabled={devicePage <= 1}
                    onClick={() => setDevicePage((p) => Math.max(1, p - 1))}
                    className="rounded border border-panel-200 bg-white px-2 py-1 disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    disabled={
                      devicePage >= (devicesQuery.data?.pagination?.totalPages ?? 1)
                    }
                    onClick={() => setDevicePage((p) => p + 1)}
                    className="rounded border border-panel-200 bg-white px-2 py-1 disabled:opacity-40"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}

          {/* Manual entry */}
          {target.type === "single" ? (
            <div className="grid gap-2 pt-1 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Email manual
                </label>
                <Input
                  type="email"
                  value={target.email ?? manualEmailInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setManualEmailInput(val);
                    onChangeSelectedEntries([]);
                    onChangeTarget({
                      ...target,
                      type: "single",
                      email: val.trim() || undefined,
                    });
                  }}
                  placeholder="correo@ejemplo.com"
                  className="bg-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  User ID manual
                </label>
                <Input
                  value={target.userId ?? ""}
                  onChange={(e) => {
                    onChangeSelectedEntries([]);
                    onChangeTarget({
                      ...target,
                      type: "single",
                      userId: e.target.value.trim() || undefined,
                    });
                  }}
                  placeholder="UUID / ID del usuario"
                  className="bg-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Nombre (saludo opcional)
                </label>
                <Input
                  value={target.name ?? ""}
                  onChange={(e) =>
                    onChangeTarget({
                      ...target,
                      type: "single",
                      name: e.target.value || undefined,
                    })
                  }
                  placeholder="Ej. Ana"
                  className="bg-white"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 pt-1 sm:flex-row">
              <Input
                value={manualEmailsBatch}
                onChange={(e) => setManualEmailsBatch(e.target.value)}
                placeholder="Añadir emails manuales separados por coma o espacio…"
                className="bg-white"
              />
              <Button
                type="button"
                variant="ghost"
                onClick={handleAddManualEmails}
                className="shrink-0 border border-panel-200 bg-white"
              >
                Añadir emails
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Filter Mode */}
      {target.type === "filter" && (
        <div className="mt-4 grid gap-3 rounded-lg border border-panel-200 bg-panel-50/50 p-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Rol del usuario
            </label>
            <select
              value={target.role || "all"}
              onChange={(e) =>
                onChangeTarget({
                  ...target,
                  type: "filter",
                  role: e.target.value === "all" ? undefined : e.target.value,
                })
              }
              className="w-full rounded-lg border border-panel-200 bg-white px-3 py-2 text-sm outline-none focus:border-panel-500"
            >
              <option value="all">Todos los roles</option>
              <option value="user">Usuarios (user)</option>
              <option value="enterprise">Organizaciones (enterprise)</option>
              <option value="admin">Administradores (admin)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Plataforma móvil
            </label>
            <select
              value={target.platform || "all"}
              onChange={(e) =>
                onChangeTarget({
                  ...target,
                  type: "filter",
                  platform: e.target.value as NotificationPlatform,
                })
              }
              className="w-full rounded-lg border border-panel-200 bg-white px-3 py-2 text-sm outline-none focus:border-panel-500"
            >
              <option value="all">Todas (iOS, Android, Web)</option>
              <option value="android">Solo Android</option>
              <option value="ios">Solo iOS</option>
              <option value="web">Solo Web</option>
            </select>
          </div>
        </div>
      )}

      {/* All / Broadcast Mode */}
      {target.type === "all" && (
        <div className="mt-4 space-y-2">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <div className="font-semibold">Difusión global activada</div>
            <div className="mt-0.5">
              Este envío llegará a toda la base activa de YouConnext en los canales seleccionados.
              Se calculará el alcance exacto y se pedirá confirmación antes de ejecutarlo.
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-700">
            <input
              type="checkbox"
              checked={target.fallbackToDeviceTokens !== false}
              onChange={(e) =>
                onChangeTarget({
                  ...target,
                  type: "all",
                  fallbackToDeviceTokens: e.target.checked,
                })
              }
              className="h-4 w-4 rounded border-panel-300 text-panel-700"
            />
            Usar fallback de emails conocidos desde tokens de dispositivo si `ms-usuarios` no está disponible
          </label>
        </div>
      )}

      {/* Scope Preview Result */}
      {previewError && (
        <div className="mt-3">
          <Alert variant="error" title="No se pudo calcular el alcance">
            {previewError}
          </Alert>
        </div>
      )}

      {previewData && (
        <div className="mt-4 rounded-lg border border-panel-200 bg-panel-50 p-3 text-xs">
          <div className="font-semibold text-panel-900">
            Alcance estimado en backend
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {previewData.preview.email && (
              <div className="rounded-md border border-panel-200 bg-white p-2.5">
                <div className="font-medium text-gray-800">Canal Email</div>
                {previewData.preview.email.error ? (
                  <div className="mt-1 text-red-600">
                    {previewData.preview.email.error}
                  </div>
                ) : (
                  <>
                    <div className="mt-1 text-base font-semibold text-panel-900">
                      {previewData.preview.email.totalRecipients} destinatario(s)
                    </div>
                    <div className="text-gray-500">
                      Fuente: {previewData.preview.email.recipientSource ?? "-"}
                    </div>
                    {(previewData.preview.email.sampleRecipients?.length ?? 0) >
                      0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {previewData.preview.email.sampleRecipients!.map((s, i) => (
                          <span
                            key={`${s.email}-${i}`}
                            className="rounded bg-panel-100 px-1.5 py-0.5 text-[11px] text-panel-900"
                          >
                            {s.email}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {previewData.preview.push && (
              <div className="rounded-md border border-panel-200 bg-white p-2.5">
                <div className="font-medium text-gray-800">Canal Push (FCM)</div>
                {previewData.preview.push.error ? (
                  <div className="mt-1 text-red-600">
                    {previewData.preview.push.error}
                  </div>
                ) : (
                  <>
                    <div className="mt-1 text-base font-semibold text-panel-900">
                      {previewData.preview.push.totalDevices} dispositivo(s)
                    </div>
                    <div className="text-gray-500">
                      Usuarios únicos: {previewData.preview.push.uniqueUsers ?? 0}
                    </div>
                    {previewData.preview.push.byPlatform &&
                      Object.keys(previewData.preview.push.byPlatform).length >
                        0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {Object.entries(previewData.preview.push.byPlatform).map(
                            ([plat, count]) => (
                              <span
                                key={plat}
                                className="rounded bg-panel-100 px-1.5 py-0.5 text-[11px] uppercase text-panel-900"
                              >
                                {plat}: {count}
                              </span>
                            ),
                          )}
                        </div>
                      )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
