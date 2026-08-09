import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Download, FilePlus, Trash2 } from "lucide-react";
import { api } from "../api/client";
import type { CaeReportStatus, CaeStatus, InfoCAE } from "../api/types";
import Alert from "../components/ui/Alert";
import { Card, CardSubtitle, CardTitle } from "../components/ui/Card";
import Input from "../components/ui/Input";
import { Table, Td, Th } from "../components/ui/Table";
import { formatDateTime, formatKm } from "../lib/format";

const STATUS_LABELS: Record<CaeStatus, string> = {
  pending: "Pendiente",
  in_review: "En revisión",
  canceled: "Cancelado",
  completed: "Completado",
};

const STATUS_COLORS: Record<CaeStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  in_review: "bg-blue-100 text-blue-700",
  canceled: "bg-red-100 text-red-700",
  completed: "bg-green-100 text-green-700",
};

const REPORT_STATUS_LABELS: Record<CaeReportStatus, string> = {
  draft: "Borrador",
  sent: "Enviado",
  reviewed: "Revisado",
};

const REPORT_STATUS_COLORS: Record<CaeReportStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  reviewed: "bg-green-100 text-green-700",
};

function matchesCae(cae: InfoCAE, q: string) {
  const query = q.trim().toLowerCase();
  if (!query) return true;
  return (
    cae.id.toLowerCase().includes(query) ||
    cae.id_trayecto.toLowerCase().includes(query) ||
    (cae.conductor ?? "").toLowerCase().includes(query) ||
    (cae.origen ?? "").toLowerCase().includes(query) ||
    (cae.destino ?? "").toLowerCase().includes(query)
  );
}

const CAES_PAGE_SIZE = 20;
const REPORTS_PAGE_SIZE = 10;

export default function CaesPage() {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [caePage, setCaePage] = useState(1);
  const [reportStatusFilter, setReportStatusFilter] = useState<string>("");
  const [reportPage, setReportPage] = useState(1);
  const [reportName, setReportName] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const caesQuery = useQuery({
    queryKey: ["caes", statusFilter, caePage],
    queryFn: () =>
      api.caes.list({
        status: (statusFilter || undefined) as CaeStatus | undefined,
        page: caePage,
        limit: CAES_PAGE_SIZE,
      }),
  });

  const summaryQuery = useQuery({
    queryKey: ["cae-summary"],
    queryFn: () => api.caes.reportSummary(),
  });

  const reportsQuery = useQuery({
    queryKey: ["cae-reports", reportStatusFilter, reportPage],
    queryFn: () =>
      api.caes.reportList({
        status: (reportStatusFilter || undefined) as
          | CaeReportStatus
          | undefined,
        page: reportPage,
        limit: REPORTS_PAGE_SIZE,
      }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.caes.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caes"] });
      queryClient.invalidateQueries({ queryKey: ["cae-summary"] });
    },
  });

  const createReportMutation = useMutation({
    mutationFn: (name?: string) => api.caes.reportCreate(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cae-reports"] });
      queryClient.invalidateQueries({ queryKey: ["cae-summary"] });
      setReportName("");
    },
    onError: (err: Error) => setActionError(err.message),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: CaeReportStatus }) =>
      api.caes.reportUpdateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cae-reports"] });
    },
    onError: (err: Error) => setActionError(err.message),
  });

  const deleteReportMutation = useMutation({
    mutationFn: (id: string) => api.caes.reportDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cae-reports"] });
      queryClient.invalidateQueries({ queryKey: ["cae-summary"] });
    },
    onError: (err: Error) => setActionError(err.message),
  });

  const [exportingId, setExportingId] = useState<string | null>(null);

  async function handleExport(reportId: string, reportName: string) {
    setExportingId(reportId);
    setActionError(null);
    try {
      const blob = await api.caes.exportExcel(reportId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = reportName.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);
      a.download = `${safeName || "cae_report"}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Error al exportar Excel",
      );
    } finally {
      setExportingId(null);
    }
  }

  const filtered = useMemo(() => {
    const arr = caesQuery.data?.items ?? [];
    return arr.filter((c) => matchesCae(c, q));
  }, [caesQuery.data, q]);

  const caeTotal = caesQuery.data?.total ?? 0;
  const caeTotalPages = Math.max(1, Math.ceil(caeTotal / CAES_PAGE_SIZE));

  const summary = summaryQuery.data;
  const reviewCount = summary?.caes.enviados_sin_aprobar ?? 0;

  const reports = reportsQuery.data?.items ?? [];
  const reportTotal = reportsQuery.data?.total ?? 0;
  const reportTotalPages = Math.max(
    1,
    Math.ceil(reportTotal / REPORTS_PAGE_SIZE),
  );

  return (
    <div className="space-y-4">
      <div>
        <div className="text-lg font-semibold">
          Informes CAE (Certificados de Ahorro de Energía)
        </div>
        <div className="text-sm text-gray-600">
          Revisa los informes de energía generada por carpooling.{" "}
          {reviewCount > 0 && (
            <span className="font-medium text-blue-700">
              {reviewCount} en revisión
            </span>
          )}
        </div>
      </div>

      {actionError ? (
        <Alert title="Error" variant="error">
          {actionError}
        </Alert>
      ) : null}

      {/* ─── Resumen ─── */}
      {summary ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card>
            <CardSubtitle>Pendientes envío</CardSubtitle>
            <div className="text-2xl font-bold text-yellow-700">
              {summary.caes.pendientes_envio}
            </div>
          </Card>
          <Card>
            <CardSubtitle>Enviados sin aprobar</CardSubtitle>
            <div className="text-2xl font-bold text-blue-700">
              {summary.caes.enviados_sin_aprobar}
            </div>
          </Card>
          <Card>
            <CardSubtitle>Completados</CardSubtitle>
            <div className="text-2xl font-bold text-green-700">
              {summary.caes.completados}
            </div>
          </Card>
          <Card>
            <CardSubtitle>kWh acumulado pendiente</CardSubtitle>
            <div className="text-2xl font-bold text-panel-900">
              {Math.round(summary.kwh_acumulado_pendiente * 100) / 100}
            </div>
            <div className="text-xs text-gray-500">
              Umbral: {summary.kwh_umbral_envio} kWh
            </div>
          </Card>
        </div>
      ) : null}

      {/* ─── Reportes CAE ─── */}
      <Card>
        <CardTitle>Reportes CAE</CardTitle>
        <CardSubtitle>
          Agrupa los CAEs en revisión en un reporte para exportar a Excel
        </CardSubtitle>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-[200px]">
            <Input
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="Nombre del reporte (opcional)…"
            />
          </div>
          <select
            value={reportStatusFilter}
            onChange={(e) => {
              setReportStatusFilter(e.target.value);
              setReportPage(1);
            }}
            className="rounded-lg border border-panel-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">Todos los estados</option>
            <option value="draft">Borrador</option>
            <option value="sent">Enviado</option>
            <option value="reviewed">Revisado</option>
          </select>
          <button
            onClick={() => createReportMutation.mutate(reportName || undefined)}
            disabled={createReportMutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-panel-800 px-3 py-2 text-sm font-medium text-white hover:bg-panel-900 disabled:opacity-50"
          >
            <FilePlus size={16} />
            {createReportMutation.isPending ? "Creando…" : "Crear reporte"}
          </button>
        </div>

        <div className="mt-3">
          {reportsQuery.isLoading ? (
            <Alert>Cargando reportes…</Alert>
          ) : reportsQuery.isError ? (
            <Alert variant="error">No se pudieron cargar los reportes.</Alert>
          ) : (
            <>
              <Table>
                <thead>
                  <tr>
                    <Th>Nombre</Th>
                    <Th>Estado</Th>
                    <Th className="text-right">CAEs</Th>
                    <Th className="text-right">kWh</Th>
                    <Th className="text-right">EUR</Th>
                    <Th>Creado</Th>
                    <Th className="text-right">Acciones</Th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id} className="hover:bg-panel-50">
                      <Td className="font-medium">{r.name}</Td>
                      <Td>
                        <select
                          value={r.status}
                          onChange={(e) => {
                            const newStatus = e.target.value as CaeReportStatus;
                            if (newStatus !== r.status) {
                              updateStatusMutation.mutate({
                                id: r.id,
                                status: newStatus,
                              });
                            }
                          }}
                          disabled={updateStatusMutation.isPending}
                          className={`rounded-full px-2 py-0.5 text-xs font-medium border-0 ${REPORT_STATUS_COLORS[r.status]}`}
                        >
                          <option value="draft">
                            {REPORT_STATUS_LABELS.draft}
                          </option>
                          <option value="sent">
                            {REPORT_STATUS_LABELS.sent}
                          </option>
                          <option value="reviewed">
                            {REPORT_STATUS_LABELS.reviewed}
                          </option>
                        </select>
                      </Td>
                      <Td className="text-right">{r.total_caes}</Td>
                      <Td className="text-right">
                        {Math.round(r.total_kwh * 100) / 100}
                      </Td>
                      <Td className="text-right">
                        {Math.round(r.total_eur * 100) / 100}€
                      </Td>
                      <Td className="text-gray-600">
                        {formatDateTime(r.created_at)}
                      </Td>
                      <Td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleExport(r.id, r.name)}
                            disabled={exportingId === r.id}
                            className="inline-flex items-center gap-1 text-xs font-medium text-panel-900 hover:underline disabled:opacity-50"
                          >
                            <Download size={14} />
                            {exportingId === r.id ? "Exportando…" : "Excel"}
                          </button>
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  `¿Eliminar el reporte "${r.name}"? Los CAEs asociados volverán a estar disponibles para un nuevo reporte.`,
                                )
                              )
                                deleteReportMutation.mutate(r.id);
                            }}
                            disabled={deleteReportMutation.isPending}
                            className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </Td>
                    </tr>
                  ))}
                  {reports.length === 0 ? (
                    <tr>
                      <Td
                        className="py-8 text-center text-gray-600"
                        colSpan={7}
                      >
                        Sin reportes creados
                      </Td>
                    </tr>
                  ) : null}
                </tbody>
              </Table>
              {reportTotalPages > 1 ? (
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {reportTotal} reporte(s) · Pág. {reportPage} de{" "}
                    {reportTotalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setReportPage((p) => Math.max(1, p - 1))}
                      disabled={reportPage <= 1}
                      className="rounded-lg border border-panel-200 px-3 py-1.5 text-sm hover:bg-panel-50 disabled:opacity-50"
                    >
                      ← Anterior
                    </button>
                    <button
                      onClick={() =>
                        setReportPage((p) => Math.min(reportTotalPages, p + 1))
                      }
                      disabled={reportPage >= reportTotalPages}
                      className="rounded-lg border border-panel-200 px-3 py-1.5 text-sm hover:bg-panel-50 disabled:opacity-50"
                    >
                      Siguiente →
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </Card>

      {/* ─── Tabla de CAEs individuales ─── */}
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Buscar</CardTitle>
            <CardSubtitle>
              Filtra por trayecto, conductor, origen o destino
            </CardSubtitle>
          </div>
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCaePage(1);
              }}
              className="rounded-lg border border-panel-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              <option value="pending">Pendientes</option>
              <option value="in_review">En revisión</option>
              <option value="completed">Completados</option>
              <option value="canceled">Cancelados</option>
            </select>
            <div className="w-64 max-w-full">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar…"
              />
            </div>
          </div>
        </div>
      </Card>

      {caesQuery.isLoading ? (
        <Alert title="Cargando">Cargando informes CAE…</Alert>
      ) : null}
      {caesQuery.isError ? (
        <Alert title="Error" variant="error">
          No se pudieron cargar los informes CAE.
        </Alert>
      ) : null}

      {!caesQuery.isLoading && !caesQuery.isError ? (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Trayecto</Th>
                <Th>Conductor</Th>
                <Th>Ruta</Th>
                <Th className="text-right">Km</Th>
                <Th className="text-right">Km acompañado</Th>
                <Th className="text-right">kWh</Th>
                <Th className="text-right">EUR</Th>
                <Th>Estado</Th>
                <Th>Fecha</Th>
                <Th className="text-right">Acciones</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((cae) => (
                <tr key={cae.id} className="hover:bg-panel-50">
                  <Td className="font-medium">
                    <Link
                      className="text-panel-900 hover:underline"
                      to={`/viajes/${cae.id_trayecto}`}
                    >
                      {cae.id_trayecto.slice(0, 8)}…
                    </Link>
                  </Td>
                  <Td>
                    {cae.conductor ? (
                      <Link
                        className="text-panel-900 hover:underline"
                        to={`/usuarios/${cae.conductor}`}
                      >
                        {cae.conductor.slice(0, 8)}…
                      </Link>
                    ) : (
                      "-"
                    )}
                  </Td>
                  <Td className="text-sm">
                    {cae.origen ?? "-"} → {cae.destino ?? "-"}
                  </Td>
                  <Td className="text-right">{formatKm(cae.km_recorridos)}</Td>
                  <Td className="text-right">
                    {formatKm(cae.km_with_company)}
                  </Td>
                  <Td className="text-right">
                    {cae.kwh_generated != null
                      ? `${Math.round(cae.kwh_generated * 100) / 100}`
                      : "-"}
                  </Td>
                  <Td className="text-right">
                    {cae.eur_generated != null
                      ? `${Math.round(cae.eur_generated * 100) / 100}€`
                      : "-"}
                  </Td>
                  <Td>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[cae.status]}`}
                    >
                      {STATUS_LABELS[cae.status]}
                    </span>
                  </Td>
                  <Td className="text-gray-600">
                    {formatDateTime(cae.created_at)}
                  </Td>
                  <Td className="text-right">
                    {cae.status === "in_review" ? (
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              "¿Aprobar este informe CAE? Pasará a completado y el dinero será disponible para el conductor.",
                            )
                          )
                            approveMutation.mutate(cae.id);
                        }}
                        disabled={approveMutation.isPending}
                        className="text-xs font-medium text-green-600 hover:text-green-700 disabled:opacity-50"
                      >
                        Aprobar
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </Td>
                </tr>
              ))}

              {filtered.length === 0 ? (
                <tr>
                  <Td className="py-8 text-center text-gray-600" colSpan={10}>
                    Sin resultados
                  </Td>
                </tr>
              ) : null}
            </tbody>
          </Table>
          {caeTotalPages > 1 ? (
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {caeTotal} CAE(s) · Pág. {caePage} de {caeTotalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCaePage((p) => Math.max(1, p - 1))}
                  disabled={caePage <= 1}
                  className="rounded-lg border border-panel-200 px-3 py-1.5 text-sm hover:bg-panel-50 disabled:opacity-50"
                >
                  ← Anterior
                </button>
                <button
                  onClick={() =>
                    setCaePage((p) => Math.min(caeTotalPages, p + 1))
                  }
                  disabled={caePage >= caeTotalPages}
                  className="rounded-lg border border-panel-200 px-3 py-1.5 text-sm hover:bg-panel-50 disabled:opacity-50"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
