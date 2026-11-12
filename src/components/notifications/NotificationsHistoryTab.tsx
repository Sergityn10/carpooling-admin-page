import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, RefreshCw, X } from "lucide-react";
import clsx from "clsx";
import { api } from "../../api/client";
import type { AdminHistoryItem } from "../../api/types";
import { formatDateTime } from "../../lib/format";
import Alert from "../ui/Alert";
import Button from "../ui/Button";
import { Card, CardSubtitle, CardTitle } from "../ui/Card";
import { Table, Td, Th } from "../ui/Table";
import { formatTargetSummary } from "./templateCatalogMeta";

const STATUS_BADGES: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  queued: "bg-blue-100 text-blue-700",
  partial: "bg-amber-100 text-amber-800",
  failed: "bg-red-100 text-red-700",
  dry_run: "bg-gray-100 text-gray-700",
};

const KIND_BADGES: Record<string, string> = {
  email: "bg-indigo-100 text-indigo-800",
  push: "bg-emerald-100 text-emerald-800",
  multi: "bg-purple-100 text-purple-800",
};

type NotificationsHistoryTabProps = {
  selectedBatchId: string | null;
  onSelectBatchId: (batchId: string | null) => void;
};

export default function NotificationsHistoryTab({
  selectedBatchId,
  onSelectBatchId,
}: NotificationsHistoryTabProps) {
  const [kindFilter, setKindFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const historyQuery = useQuery({
    queryKey: ["notificaciones-history", kindFilter],
    queryFn: () =>
      api.notificaciones.history({
        limit: 50,
        kind: kindFilter === "all" ? undefined : kindFilter,
      }),
  });

  const jobQuery = useQuery({
    queryKey: ["notificaciones-job", selectedBatchId],
    queryFn: () => api.notificaciones.jobStatus(selectedBatchId!),
    enabled: Boolean(selectedBatchId),
    refetchInterval: (query) => {
      const status = query.state.data?.job?.status;
      return status === "queued" ? 4000 : false;
    },
  });

  const rawItems = historyQuery.data?.items ?? [];
  const items = rawItems.filter((item) =>
    statusFilter === "all" ? true : item.status === statusFilter,
  );

  return (
    <div className="space-y-4">
      <Alert variant="info" title="Historial reciente en memoria">
        El microservicio conserva los últimos envíos administrativos en memoria mientras el proceso permanezca activo.
      </Alert>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Historial de envíos</CardTitle>
            <CardSubtitle>
              Consulta las comunicaciones enviadas y el estado de cada lote (`batchId`)
            </CardSubtitle>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={kindFilter}
              onChange={(e) => setKindFilter(e.target.value)}
              className="rounded-lg border border-panel-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-panel-500"
            >
              <option value="all">Todos los canales</option>
              <option value="email">Solo Email</option>
              <option value="push">Solo Push</option>
              <option value="multi">Multi-canal</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-panel-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-panel-500"
            >
              <option value="all">Todos los estados</option>
              <option value="queued">En cola (queued)</option>
              <option value="completed">Completados</option>
              <option value="partial">Parciales</option>
              <option value="failed">Fallidos</option>
            </select>

            <Button
              type="button"
              variant="ghost"
              onClick={() => historyQuery.refetch()}
              disabled={historyQuery.isFetching}
              className="border border-panel-200 bg-white text-xs"
            >
              <RefreshCw
                size={14}
                className={clsx(historyQuery.isFetching && "animate-spin")}
              />
              Actualizar
            </Button>
          </div>
        </div>

        <div className="mt-4">
          {historyQuery.isLoading ? (
            <Alert>Cargando historial…</Alert>
          ) : historyQuery.isError ? (
            <Alert variant="error" title="Error">
              {(historyQuery.error as Error).message ||
                "No se pudo cargar el historial."}
            </Alert>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Fecha</Th>
                  <Th>Canal</Th>
                  <Th>Asunto / Título</Th>
                  <Th>Audiencia</Th>
                  <Th>Modo</Th>
                  <Th>Alcance</Th>
                  <Th>Estado</Th>
                  <Th className="text-right">Lote</Th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: AdminHistoryItem) => (
                  <tr
                    key={item.batchId}
                    className={clsx(
                      "hover:bg-panel-50",
                      selectedBatchId === item.batchId && "bg-panel-50",
                    )}
                  >
                    <Td className="whitespace-nowrap text-xs text-gray-600">
                      {formatDateTime(item.createdAt)}
                    </Td>
                    <Td>
                      <span
                        className={clsx(
                          "rounded-full px-2 py-0.5 text-[11px] font-medium uppercase",
                          KIND_BADGES[item.kind] ?? "bg-gray-100 text-gray-700",
                        )}
                      >
                        {item.kind}
                      </span>
                    </Td>
                    <Td className="max-w-[220px] truncate font-medium text-gray-900">
                      {item.subjectOrTitle || "-"}
                    </Td>
                    <Td className="text-xs text-gray-600">
                      {formatTargetSummary(item.target)}
                    </Td>
                    <Td className="text-xs uppercase text-gray-600">
                      {item.mode}
                    </Td>
                    <Td className="text-xs text-gray-700">
                      {item.succeeded !== null
                        ? `${item.succeeded} OK / ${item.failed ?? 0} err`
                        : item.totalDevices !== null
                          ? `${item.totalDevices} disp.`
                          : `${item.recipientsCount} dest.`}
                    </Td>
                    <Td>
                      <span
                        className={clsx(
                          "rounded-full px-2 py-0.5 text-[11px] font-medium uppercase",
                          STATUS_BADGES[item.status] ??
                            "bg-gray-100 text-gray-700",
                        )}
                      >
                        {item.status}
                      </span>
                    </Td>
                    <Td className="text-right">
                      <button
                        type="button"
                        onClick={() => onSelectBatchId(item.batchId)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-panel-800 hover:underline"
                      >
                        <Eye size={13} />
                        Ver detalle
                      </button>
                    </Td>
                  </tr>
                ))}

                {items.length === 0 && (
                  <tr>
                    <Td colSpan={8} className="py-8 text-center text-gray-500">
                      No hay envíos registrados en el historial reciente.
                    </Td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </div>
      </Card>

      {/* Selected Batch Detail Panel */}
      {selectedBatchId && (
        <Card className="border-panel-300">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle>Detalle del lote</CardTitle>
              <CardSubtitle>
                Batch ID:{" "}
                <span className="font-mono text-gray-700">
                  {selectedBatchId}
                </span>
              </CardSubtitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => jobQuery.refetch()}
                disabled={jobQuery.isFetching}
                className="border border-panel-200 bg-white text-xs"
              >
                <RefreshCw
                  size={13}
                  className={clsx(jobQuery.isFetching && "animate-spin")}
                />
                Refrescar lote
              </Button>
              <button
                type="button"
                onClick={() => onSelectBatchId(null)}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-panel-100"
                aria-label="Cerrar detalle"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="mt-3">
            {jobQuery.isLoading ? (
              <Alert>Consultando estado del lote…</Alert>
            ) : jobQuery.isError ? (
              <Alert variant="error" title="No disponible">
                {(jobQuery.error as Error).message}
              </Alert>
            ) : jobQuery.data?.job ? (
              <div className="space-y-3 text-xs">
                <div className="grid gap-2 sm:grid-cols-4">
                  <div className="rounded-lg border border-panel-200 bg-panel-50 p-2.5">
                    <div className="text-gray-500">Estado</div>
                    <div className="font-semibold uppercase text-gray-900">
                      {jobQuery.data.job.status}
                    </div>
                  </div>
                  <div className="rounded-lg border border-panel-200 bg-panel-50 p-2.5">
                    <div className="text-gray-500">Canal / Modo</div>
                    <div className="font-semibold uppercase text-gray-900">
                      {jobQuery.data.job.kind} · {jobQuery.data.job.mode}
                    </div>
                  </div>
                  <div className="rounded-lg border border-panel-200 bg-panel-50 p-2.5">
                    <div className="text-gray-500">Encolados / Dest.</div>
                    <div className="font-semibold text-gray-900">
                      {jobQuery.data.job.jobsQueued} jobs /{" "}
                      {jobQuery.data.job.recipientsCount} dest.
                    </div>
                  </div>
                  <div className="rounded-lg border border-panel-200 bg-panel-50 p-2.5">
                    <div className="text-gray-500">Solicitado por</div>
                    <div className="truncate font-semibold text-gray-900">
                      {jobQuery.data.job.requestedBy?.email ??
                        jobQuery.data.job.requestedBy?.userId ??
                        "-"}
                    </div>
                  </div>
                </div>

                {jobQuery.data.job.channels && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {Object.entries(jobQuery.data.job.channels).map(
                      ([ch, chInfo]) => (
                        <div
                          key={ch}
                          className="rounded-lg border border-panel-200 bg-white p-3"
                        >
                          <div className="font-semibold uppercase text-panel-800">
                            Canal {ch}
                          </div>
                          <div className="mt-1 space-y-0.5 text-gray-700">
                            <div>Estado: {chInfo?.status ?? "-"}</div>
                            {chInfo?.recipientsCount !== undefined && (
                              <div>Destinatarios: {chInfo.recipientsCount}</div>
                            )}
                            {chInfo?.totalDevices !== undefined && (
                              <div>Dispositivos: {chInfo.totalDevices}</div>
                            )}
                            {chInfo?.jobsQueued !== undefined && (
                              <div>Jobs encolados: {chInfo.jobsQueued}</div>
                            )}
                            {chInfo?.error && (
                              <div className="text-red-600">
                                Error: {chInfo.error}
                              </div>
                            )}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </Card>
      )}
    </div>
  );
}
