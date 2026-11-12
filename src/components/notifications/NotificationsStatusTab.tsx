import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import clsx from "clsx";
import { api } from "../../api/client";
import { formatDateTime } from "../../lib/format";
import Alert from "../ui/Alert";
import Button from "../ui/Button";
import { Card, CardSubtitle, CardTitle } from "../ui/Card";
import Stat from "../ui/Stat";

function StatusPill({ ok, label }: { ok: boolean; label?: string }) {
  return (
    <span
      className={clsx(
        "rounded-full px-2.5 py-0.5 text-xs font-medium",
        ok ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700",
      )}
    >
      {label ?? (ok ? "Operativo" : "Error")}
    </span>
  );
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hrs}h ${remMins}m`;
}

export default function NotificationsStatusTab() {
  const statusQuery = useQuery({
    queryKey: ["notificaciones-status"],
    queryFn: () => api.notificaciones.status(true),
  });

  const data = statusQuery.data;

  if (statusQuery.isLoading) {
    return <Alert>Comprobando salud del microservicio de notificaciones…</Alert>;
  }

  if (statusQuery.isError || !data) {
    return (
      <Alert variant="error" title="Microservicio inaccesible">
        {(statusQuery.error as Error)?.message ||
          "No se pudo conectar con la API de notificaciones."}
      </Alert>
    );
  }

  const overallVariant: "info" | "error" =
    data.overallStatus === "unhealthy" ? "error" : "info";

  const circuitBreakers = data.queues?.circuitBreakers ?? {};

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-gray-900">
            {data.service.name} v{data.service.version} ({data.service.environment})
          </div>
          <div className="text-xs text-gray-500">
            Última comprobación: {formatDateTime(data.service.timestamp)}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={() => statusQuery.refetch()}
          disabled={statusQuery.isFetching}
          className="border border-panel-200 bg-white text-xs"
        >
          <RefreshCw
            size={14}
            className={clsx(statusQuery.isFetching && "animate-spin")}
          />
          Volver a comprobar
        </Button>
      </div>

      {data.issues.length > 0 ? (
        <Alert
          variant={overallVariant}
          title={`Estado general: ${data.overallStatus.toUpperCase()}`}
        >
          <ul className="list-disc pl-4 text-xs space-y-0.5">
            {data.issues.map((issue, idx) => (
              <li key={idx}>{issue}</li>
            ))}
          </ul>
        </Alert>
      ) : (
        <Alert variant="info" title="Estado general: HEALTHY">
          Todos los subsistemas de correo, notificaciones push, base de datos y colas están operativos.
        </Alert>
      )}

      {/* Main KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Estado global"
          value={data.overallStatus.toUpperCase()}
          hint={`Uptime ${formatUptime(data.service.uptimeSeconds)}`}
        />
        <Stat
          label="Dispositivos activos"
          value={data.deviceTokens?.active ?? "-"}
          hint={`${data.deviceTokens?.uniqueActiveUsers ?? 0} usuarios únicos`}
        />
        <Stat
          label="Envíos admin recientes"
          value={data.adminActivity?.recentDispatchesCount ?? 0}
          hint={
            data.adminActivity?.lastDispatchAt
              ? `Último: ${formatDateTime(data.adminActivity.lastDispatchAt)}`
              : "Sin envíos recientes"
          }
        />
        <Stat
          label="Memoria proceso"
          value={
            data.service.memory?.rssMb ? `${data.service.memory.rssMb} MB` : "-"
          }
          hint={`Workers: ${data.service.runWorkers ? "Activos" : "Desactivados"}`}
        />
      </div>

      {/* Subsystem Checks Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <CardTitle>SMTP (Correo Electrónico)</CardTitle>
            <StatusPill ok={data.checks.smtp.ok} />
          </div>
          <div className="mt-2 space-y-1 text-xs text-gray-600">
            <div>Host: {data.checks.smtp.host ?? "-"}</div>
            <div>Puerto: {data.checks.smtp.port ?? "-"}</div>
            <div>Remitente: {data.checks.smtp.fromEmail ?? "-"}</div>
            {data.checks.smtp.latencyMs !== undefined && (
              <div>Latencia: {data.checks.smtp.latencyMs} ms</div>
            )}
            {data.checks.smtp.error && (
              <div className="text-red-600">Error: {data.checks.smtp.error}</div>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <CardTitle>Firebase Cloud Messaging (Push)</CardTitle>
            <StatusPill ok={data.checks.firebase.ok} />
          </div>
          <div className="mt-2 space-y-1 text-xs text-gray-600">
            <div>Proyecto: {data.checks.firebase.projectId ?? "-"}</div>
            <div>
              SDK inicializado: {data.checks.firebase.initialized ? "Sí" : "No"}
            </div>
            {data.checks.firebase.error && (
              <div className="text-red-600">
                Error: {data.checks.firebase.error}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <CardTitle>Base de Datos y ms-usuarios</CardTitle>
            <StatusPill ok={data.checks.database.ok} />
          </div>
          <div className="mt-2 space-y-1 text-xs text-gray-600">
            <div>
              Latencia BD:{" "}
              {data.checks.database.latencyMs !== undefined
                ? `${data.checks.database.latencyMs} ms`
                : "-"}
            </div>
            <div>
              ms-usuarios:{" "}
              {data.checks.userService.configured
                ? data.checks.userService.health?.ok
                  ? "Conectado"
                  : data.checks.userService.health?.error || "Sin respuesta"
                : "No configurado (usa fallback de tokens)"}
            </div>
            {data.checks.database.error && (
              <div className="text-red-600">
                Error BD: {data.checks.database.error}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <CardTitle>Colas (RabbitMQ / Memoria)</CardTitle>
            <StatusPill
              ok={
                !data.checks.rabbitmq.configured ||
                data.checks.rabbitmq.deliveryQueueConnected
              }
              label={data.checks.rabbitmq.mode}
            />
          </div>
          <div className="mt-2 space-y-1 text-xs text-gray-600">
            <div>
              RabbitMQ configurado:{" "}
              {data.checks.rabbitmq.configured ? "Sí" : "No"}
            </div>
            <div>
              Cola de entrega conectada:{" "}
              {data.checks.rabbitmq.deliveryQueueConnected ? "Sí" : "No"}
            </div>
            <div>
              Consumidor de eventos:{" "}
              {data.checks.rabbitmq.domainConsumer?.connected
                ? "Conectado"
                : "Desconectado"}
            </div>
          </div>
        </Card>
      </div>

      {/* Tokens breakdown & Circuit Breakers */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardTitle>Distribución de tokens Push</CardTitle>
          <CardSubtitle>Desglose por plataforma y rol</CardSubtitle>
          <div className="mt-3 space-y-2 text-xs">
            <div>
              <span className="font-medium text-gray-700">Plataformas:</span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {data.deviceTokens?.byPlatform &&
                Object.keys(data.deviceTokens.byPlatform).length > 0 ? (
                  Object.entries(data.deviceTokens.byPlatform).map(
                    ([plat, count]) => (
                      <span
                        key={plat}
                        className="rounded-full bg-panel-100 px-2.5 py-0.5 font-medium uppercase text-panel-900"
                      >
                        {plat}: {count}
                      </span>
                    ),
                  )
                ) : (
                  <span className="text-gray-500">Sin datos</span>
                )}
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-700">Roles:</span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {data.deviceTokens?.byRole &&
                Object.keys(data.deviceTokens.byRole).length > 0 ? (
                  Object.entries(data.deviceTokens.byRole).map(([role, count]) => (
                    <span
                      key={role}
                      className="rounded-full bg-panel-100 px-2.5 py-0.5 font-medium text-panel-900"
                    >
                      {role}: {count}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500">Sin datos</span>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle>Circuit Breakers</CardTitle>
          <CardSubtitle>Protección automática frente a fallos externos</CardSubtitle>
          <div className="mt-3 space-y-2 text-xs">
            {Object.keys(circuitBreakers).length === 0 ? (
              <div className="text-gray-500">
                Sin métricas de circuit breakers reportadas.
              </div>
            ) : (
              Object.entries(circuitBreakers).map(([name, state]) => (
                <div
                  key={name}
                  className="flex items-center justify-between rounded-lg border border-panel-200 bg-panel-50 px-3 py-2"
                >
                  <span className="font-medium text-gray-800">{name}</span>
                  <StatusPill
                    ok={!state?.isOpen}
                    label={state?.isOpen ? "OPEN" : "CLOSED"}
                  />
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
