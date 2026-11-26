import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { MapPin, RefreshCw, Save } from "lucide-react";
import clsx from "clsx";
import { api } from "../api/client";
import type {
  SpatialConfigItem,
  SpatialConfigKey,
  SpatialConfigValues,
} from "../api/types";
import SpatialStatusBadge from "../components/spatial/SpatialStatusBadge";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import { Card, CardSubtitle, CardTitle } from "../components/ui/Card";
import Input from "../components/ui/Input";
import { Table, Td, Th } from "../components/ui/Table";
import { formatDateTime, formatMeters } from "../lib/format";

const PAGE_SIZE = 20;

const SOURCE_BADGES: Record<
  SpatialConfigItem["source"],
  { label: string; className: string }
> = {
  db: { label: "BD", className: "bg-blue-100 text-blue-700" },
  env: { label: ".env", className: "bg-amber-100 text-amber-800" },
  default: { label: "Default", className: "bg-gray-100 text-gray-700" },
};

type NumericConfigField = {
  key: Exclude<SpatialConfigKey, "spatial_cae_require_match">;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  integer?: boolean;
};

const NUMERIC_FIELDS: NumericConfigField[] = [
  {
    key: "spatial_buffer_meters",
    label: "Radio del pasillo (ST_Buffer)",
    unit: "metros",
    min: 1,
    max: 50000,
    step: 1,
  },
  {
    key: "spatial_min_overlap_percentage",
    label: "Solapamiento mínimo requerido",
    unit: "%",
    min: 0,
    max: 100,
    step: 1,
  },
  {
    key: "spatial_min_points",
    label: "Mínimo de puntos GPS válidos",
    unit: "puntos",
    min: 2,
    max: 1000,
    step: 1,
    integer: true,
  },
  {
    key: "spatial_min_shared_distance_meters",
    label: "Distancia mínima compartida",
    unit: "metros",
    min: 0,
    max: 1000000,
    step: 10,
  },
];

type FormState = {
  spatial_buffer_meters: string;
  spatial_min_overlap_percentage: string;
  spatial_min_points: string;
  spatial_min_shared_distance_meters: string;
  spatial_cae_require_match: boolean;
};

function valuesToFormState(v: SpatialConfigValues): FormState {
  return {
    spatial_buffer_meters: String(v.spatial_buffer_meters),
    spatial_min_overlap_percentage: String(v.spatial_min_overlap_percentage),
    spatial_min_points: String(v.spatial_min_points),
    spatial_min_shared_distance_meters: String(
      v.spatial_min_shared_distance_meters,
    ),
    spatial_cae_require_match: Boolean(v.spatial_cae_require_match),
  };
}

export default function SpatialValidationPage() {
  const queryClient = useQueryClient();

  // ─── Parámetros espaciales ───
  const configQuery = useQuery({
    queryKey: ["spatial-config"],
    queryFn: () => api.espacial.getConfig(),
  });

  const [form, setForm] = useState<FormState | null>(null);
  const [configFeedback, setConfigFeedback] = useState<{
    variant: "info" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (configQuery.data?.config) {
      setForm(valuesToFormState(configQuery.data.config));
    }
  }, [configQuery.data]);

  const updateConfigMutation = useMutation({
    mutationFn: (payload: SpatialConfigValues) =>
      api.espacial.updateConfig(payload),
    onSuccess: (res) => {
      queryClient.setQueryData(["spatial-config"], res);
      setForm(valuesToFormState(res.config));
      setConfigFeedback({
        variant: "info",
        text: res.message || "Parámetros espaciales guardados correctamente.",
      });
    },
    onError: (err: Error) => {
      setConfigFeedback({
        variant: "error",
        text: err.message || "No se pudieron guardar los parámetros.",
      });
    },
  });

  const handleSaveConfig = (e: FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setConfigFeedback(null);

    const buffer = Number(form.spatial_buffer_meters);
    const minOverlap = Number(form.spatial_min_overlap_percentage);
    const minPoints = Number(form.spatial_min_points);
    const minShared = Number(form.spatial_min_shared_distance_meters);

    if (!Number.isFinite(buffer) || buffer <= 0 || buffer > 50000) {
      setConfigFeedback({
        variant: "error",
        text: "El radio del pasillo debe ser un número entre 1 y 50000 metros.",
      });
      return;
    }
    if (!Number.isFinite(minOverlap) || minOverlap < 0 || minOverlap > 100) {
      setConfigFeedback({
        variant: "error",
        text: "El porcentaje mínimo de solapamiento debe estar entre 0 y 100.",
      });
      return;
    }
    if (
      !Number.isInteger(minPoints) ||
      minPoints < 2 ||
      minPoints > 1000
    ) {
      setConfigFeedback({
        variant: "error",
        text: "El mínimo de puntos GPS debe ser un entero entre 2 y 1000.",
      });
      return;
    }
    if (
      !Number.isFinite(minShared) ||
      minShared < 0 ||
      minShared > 1000000
    ) {
      setConfigFeedback({
        variant: "error",
        text: "La distancia mínima compartida debe estar entre 0 y 1000000 metros.",
      });
      return;
    }

    updateConfigMutation.mutate({
      spatial_buffer_meters: buffer,
      spatial_min_overlap_percentage: minOverlap,
      spatial_min_points: minPoints,
      spatial_min_shared_distance_meters: minShared,
      spatial_cae_require_match: form.spatial_cae_require_match,
    });
  };

  const itemsByKey = new Map<SpatialConfigKey, SpatialConfigItem>(
    (configQuery.data?.items ?? []).map((item) => [item.config_key, item]),
  );

  // ─── Bandeja de fallos espaciales ───
  const [statusFilter, setStatusFilter] = useState("");
  const [tripSearch, setTripSearch] = useState("");
  const [page, setPage] = useState(1);
  const [recalculatingTripId, setRecalculatingTripId] = useState<string | null>(
    null,
  );
  const [failuresFeedback, setFailuresFeedback] = useState<{
    variant: "info" | "error";
    text: string;
  } | null>(null);

  const failuresQuery = useQuery({
    queryKey: ["spatial-failures", statusFilter, tripSearch.trim(), page],
    queryFn: () =>
      api.espacial.listFailures({
        status: statusFilter || undefined,
        id_trayecto: tripSearch.trim() || undefined,
        page,
        limit: PAGE_SIZE,
      }),
  });

  const recalculateMutation = useMutation({
    mutationFn: (tripId: string) => api.espacial.recalculateTrip(tripId, true),
    onMutate: (tripId) => {
      setRecalculatingTripId(tripId);
      setFailuresFeedback(null);
    },
    onSuccess: (res, tripId) => {
      queryClient.invalidateQueries({ queryKey: ["spatial-failures"] });
      queryClient.invalidateQueries({ queryKey: ["spatial-review", tripId] });
      queryClient.invalidateQueries({ queryKey: ["caes"] });
      queryClient.invalidateQueries({ queryKey: ["cae-summary"] });
      setFailuresFeedback({
        variant: "info",
        text: `Trayecto ${tripId.slice(0, 8)}… recalculado. Estado: ${res.validation_status}.`,
      });
    },
    onError: (err: Error) => {
      setFailuresFeedback({
        variant: "error",
        text: err.message || "Error al recalcular el trayecto.",
      });
    },
    onSettled: () => {
      setRecalculatingTripId(null);
    },
  });

  const failures = failuresQuery.data?.data ?? [];
  const totalFailures = failuresQuery.data?.pagination?.total ?? 0;
  const totalPages = Math.max(
    1,
    failuresQuery.data?.pagination?.totalPages ??
      Math.ceil(totalFailures / PAGE_SIZE),
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="text-lg font-semibold">
          Validación espacial (LineString y Pasillo)
        </div>
        <div className="text-sm text-gray-600">
          Ajusta las tolerancias espaciales del algoritmo en caliente y revisa
          los trayectos donde la ruta del pasajero no coincide con el pasillo
          del conductor.
        </div>
      </div>

      {/* ─── Bloque superior: Parámetros del algoritmo ─── */}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle>Parámetros del algoritmo ("Pasillo")</CardTitle>
            <CardSubtitle>
              Los cambios se guardan en BD y aplican inmediatamente a nuevos
              cálculos y recálculos
            </CardSubtitle>
          </div>
          {configQuery.isFetching && !configQuery.isLoading ? (
            <span className="text-xs text-gray-500">Actualizando…</span>
          ) : null}
        </div>

        <div className="mt-4">
          {configQuery.isLoading ? (
            <Alert>Cargando parámetros espaciales…</Alert>
          ) : configQuery.isError ? (
            <Alert variant="error" title="Error">
              No se pudo cargar la configuración espacial.
            </Alert>
          ) : form ? (
            <form onSubmit={handleSaveConfig} className="space-y-4">
              {configFeedback ? (
                <Alert variant={configFeedback.variant}>
                  {configFeedback.text}
                </Alert>
              ) : null}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {NUMERIC_FIELDS.map((field) => {
                  const meta = itemsByKey.get(field.key);
                  const sourceBadge = meta
                    ? SOURCE_BADGES[meta.source]
                    : SOURCE_BADGES.default;

                  return (
                    <div
                      key={field.key}
                      className="rounded-lg border border-panel-200 bg-panel-50/50 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <label
                          htmlFor={field.key}
                          className="text-sm font-medium text-gray-900"
                        >
                          {field.label}
                        </label>
                        <span
                          className={clsx(
                            "rounded-full px-2 py-0.5 text-[11px] font-medium",
                            sourceBadge.className,
                          )}
                        >
                          {sourceBadge.label}
                        </span>
                      </div>
                      {meta?.description ? (
                        <p className="mt-1 text-xs text-gray-500">
                          {meta.description}
                        </p>
                      ) : null}
                      <div className="mt-2 flex items-center gap-2">
                        <Input
                          id={field.key}
                          type="number"
                          min={field.min}
                          max={field.max}
                          step={field.step}
                          value={form[field.key]}
                          onChange={(e) =>
                            setForm((prev) =>
                              prev
                                ? { ...prev, [field.key]: e.target.value }
                                : prev,
                            )
                          }
                        />
                        <span className="whitespace-nowrap text-xs text-gray-500">
                          {field.unit}
                        </span>
                      </div>
                      {meta?.updated_at ? (
                        <div className="mt-1.5 text-[11px] text-gray-400">
                          Actualizado: {formatDateTime(meta.updated_at)}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {(() => {
                const boolMeta = itemsByKey.get("spatial_cae_require_match");
                const sourceBadge = boolMeta
                  ? SOURCE_BADGES[boolMeta.source]
                  : SOURCE_BADGES.default;

                return (
                  <div className="rounded-lg border border-panel-200 bg-panel-50/50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="flex cursor-pointer items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={form.spatial_cae_require_match}
                          onChange={(e) =>
                            setForm((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    spatial_cae_require_match: e.target.checked,
                                  }
                                : prev,
                            )
                          }
                          className="mt-0.5 rounded border-panel-200 text-panel-800 focus:ring-panel-800"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Exigir coincidencia espacial para sumar km_with_company
                            al CAE
                          </div>
                          <div className="text-xs text-gray-500">
                            {boolMeta?.description ??
                              "Si está activo, solo los pasajeros con coincidencia MATCHED computan en km_with_company del CAE."}
                          </div>
                        </div>
                      </label>
                      <span
                        className={clsx(
                          "rounded-full px-2 py-0.5 text-[11px] font-medium",
                          sourceBadge.className,
                        )}
                      >
                        {sourceBadge.label}
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={updateConfigMutation.isPending}
                >
                  <Save size={15} />
                  {updateConfigMutation.isPending
                    ? "Guardando…"
                    : "Guardar parámetros"}
                </Button>
              </div>
            </form>
          ) : null}
        </div>
      </Card>

      {/* ─── Bloque inferior: Bandeja de fallos espaciales ─── */}
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Bandeja de fallos espaciales</CardTitle>
            <CardSubtitle>
              Comparaciones pasajero–pasillo con incidencia (is_match = false)
            </CardSubtitle>
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-panel-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Todos los fallos</option>
              <option value="NOT_MATCHED">NOT_MATCHED (No coincide)</option>
              <option value="INSUFFICIENT_DATA">
                INSUFFICIENT_DATA (Datos insuficientes)
              </option>
              <option value="ERROR">ERROR</option>
            </select>
            <div className="w-72 max-w-full">
              <Input
                value={tripSearch}
                onChange={(e) => {
                  setTripSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Filtrar por ID de trayecto…"
              />
            </div>
          </div>
        </div>

        {failuresFeedback ? (
          <Alert variant={failuresFeedback.variant}>
            {failuresFeedback.text}
          </Alert>
        ) : null}

        {failuresQuery.isLoading ? (
          <Alert>Cargando incidencias espaciales…</Alert>
        ) : failuresQuery.isError ? (
          <Alert variant="error" title="Error">
            No se pudieron cargar los fallos espaciales.
          </Alert>
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Trayecto</Th>
                  <Th>Pasajero</Th>
                  <Th>Estado</Th>
                  <Th className="text-right">Solapamiento</Th>
                  <Th>Motivo del fallo</Th>
                  <Th>CAE</Th>
                  <Th>Actualizado</Th>
                  <Th className="text-right">Acciones</Th>
                </tr>
              </thead>
              <tbody>
                {failures.map((item, idx) => {
                  const tripId = item.id_trayecto ?? item.trayecto?.id ?? "";
                  const isRecalculating =
                    Boolean(tripId) && recalculatingTripId === tripId;

                  return (
                    <tr
                      key={item.id ?? `${tripId}-${item.pasajero_id}-${idx}`}
                      className="hover:bg-panel-50"
                    >
                      <Td>
                        {tripId ? (
                          <>
                            <Link
                              to={`/viajes/${tripId}#spatial-review`}
                              className="font-medium text-panel-900 hover:underline"
                            >
                              {item.trayecto
                                ? `${item.trayecto.origen} → ${item.trayecto.destino}`
                                : `${tripId.slice(0, 8)}…`}
                            </Link>
                            <div className="text-xs text-gray-500">
                              {tripId}
                            </div>
                          </>
                        ) : (
                          "-"
                        )}
                      </Td>
                      <Td>
                        <Link
                          to={`/usuarios/${item.pasajero_id}`}
                          className="text-panel-900 hover:underline"
                        >
                          {item.pasajero_id.slice(0, 8)}…
                        </Link>
                      </Td>
                      <Td>
                        <SpatialStatusBadge type="match" status={item.status} />
                      </Td>
                      <Td className="text-right">
                        {item.overlap_percentage != null ? (
                          <div>
                            <span className="font-medium">
                              {Math.round(item.overlap_percentage * 10) / 10}%
                            </span>
                            {item.min_overlap_pct_used != null ? (
                              <span className="text-xs text-gray-500">
                                {" "}
                                / {item.min_overlap_pct_used}%
                              </span>
                            ) : null}
                            <div className="text-xs text-gray-500">
                              {formatMeters(item.metros_coincidentes)} /{" "}
                              {formatMeters(item.metros_ruta_pasajero)}
                            </div>
                          </div>
                        ) : (
                          "-"
                        )}
                      </Td>
                      <Td className="max-w-xs text-xs text-gray-700">
                        {item.failure_reason ?? "-"}
                      </Td>
                      <Td>
                        {item.cae ? (
                          <SpatialStatusBadge
                            type="cae"
                            status={item.cae.spatial_validation_status}
                            title={
                              item.cae.spatial_validation_notes ?? undefined
                            }
                          />
                        ) : (
                          <span className="text-xs text-gray-400">Sin CAE</span>
                        )}
                      </Td>
                      <Td className="text-xs text-gray-600">
                        {formatDateTime(item.updated_at ?? item.created_at)}
                      </Td>
                      <Td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {tripId ? (
                            <>
                              <Link
                                to={`/viajes/${tripId}#spatial-review`}
                                className="inline-flex items-center gap-1 rounded-lg border border-panel-200 bg-white px-2.5 py-1 text-xs font-medium text-panel-900 hover:bg-panel-50"
                              >
                                <MapPin size={13} />
                                Ver mapa
                              </Link>
                              <button
                                type="button"
                                onClick={() =>
                                  recalculateMutation.mutate(tripId)
                                }
                                disabled={isRecalculating}
                                className="inline-flex items-center gap-1 rounded-lg bg-panel-800 px-2.5 py-1 text-xs font-medium text-white hover:bg-panel-900 disabled:opacity-50"
                              >
                                <RefreshCw
                                  size={13}
                                  className={
                                    isRecalculating ? "animate-spin" : ""
                                  }
                                />
                                {isRecalculating
                                  ? "Recalculando…"
                                  : "Recalcular"}
                              </button>
                            </>
                          ) : null}
                        </div>
                      </Td>
                    </tr>
                  );
                })}

                {failures.length === 0 ? (
                  <tr>
                    <Td
                      className="py-8 text-center text-gray-600"
                      colSpan={8}
                    >
                      No hay fallos espaciales con los filtros seleccionados
                    </Td>
                  </tr>
                ) : null}
              </tbody>
            </Table>

            {totalPages > 1 ? (
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {totalFailures} incidencia(s) · Pág. {page} de {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="rounded-lg border border-panel-200 px-3 py-1.5 text-sm hover:bg-panel-50 disabled:opacity-50"
                  >
                    ← Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="rounded-lg border border-panel-200 px-3 py-1.5 text-sm hover:bg-panel-50 disabled:opacity-50"
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </Card>
    </div>
  );
}
