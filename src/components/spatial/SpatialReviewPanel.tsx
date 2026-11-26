import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import clsx from "clsx";
import { api } from "../../api/client";
import type { TrayectoCoincidenciaItem } from "../../api/types";
import { formatKm, formatMeters } from "../../lib/format";
import Alert from "../ui/Alert";
import Button from "../ui/Button";
import { Card, CardSubtitle, CardTitle } from "../ui/Card";
import { Table, Td, Th } from "../ui/Table";
import SpatialComparisonMap from "./SpatialComparisonMap";
import SpatialStatusBadge from "./SpatialStatusBadge";

function getPassengerKey(p: TrayectoCoincidenciaItem, index: number): string {
  return p.id ?? `${p.pasajero_id}-${index}`;
}

/**
 * Panel de inspección y recálculo espacial (LineString y Pasillo) para la ficha de un viaje.
 */
export default function SpatialReviewPanel({ tripId }: { tripId: string }) {
  const queryClient = useQueryClient();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [recalculateCae, setRecalculateCae] = useState(true);
  const [recalcFeedback, setRecalcFeedback] = useState<{
    variant: "info" | "error";
    text: string;
  } | null>(null);

  const reviewQuery = useQuery({
    queryKey: ["spatial-review", tripId],
    queryFn: () => api.espacial.getTripReview(tripId),
    enabled: Boolean(tripId),
  });

  const recalculateMutation = useMutation({
    mutationFn: () => api.espacial.recalculateTrip(tripId, recalculateCae),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["spatial-review", tripId] });
      queryClient.invalidateQueries({ queryKey: ["spatial-failures"] });
      queryClient.invalidateQueries({ queryKey: ["caes"] });
      queryClient.invalidateQueries({ queryKey: ["cae-summary"] });

      const caeNote = res.cae_recalculation
        ? res.cae_recalculation.updated
          ? ` CAE actualizado (${res.cae_recalculation.spatial_validation_status ?? "-"}).`
          : res.cae_recalculation.reason
            ? ` CAE: ${res.cae_recalculation.reason}.`
            : ""
        : "";
      setRecalcFeedback({
        variant: "info",
        text: `${res.message}. Estado resultante: ${res.validation_status}.${caeNote}`,
      });
    },
    onError: (err: Error) => {
      setRecalcFeedback({
        variant: "error",
        text: err.message || "Error al recalcular la validación espacial.",
      });
    },
  });

  const passengers = reviewQuery.data?.passengers ?? [];

  useEffect(() => {
    if (passengers.length === 0) {
      setSelectedKey(null);
      return;
    }
    const stillExists =
      selectedKey !== null &&
      passengers.some((p, idx) => getPassengerKey(p, idx) === selectedKey);
    if (!stillExists) {
      const firstFailureIdx = passengers.findIndex((p) => !p.is_match);
      const targetIdx = firstFailureIdx >= 0 ? firstFailureIdx : 0;
      setSelectedKey(getPassengerKey(passengers[targetIdx], targetIdx));
    }
  }, [passengers, selectedKey]);

  const selectedPassenger = useMemo(() => {
    if (passengers.length === 0) return null;
    const foundIdx = passengers.findIndex(
      (p, idx) => getPassengerKey(p, idx) === selectedKey,
    );
    return foundIdx >= 0 ? passengers[foundIdx] : passengers[0];
  }, [passengers, selectedKey]);

  const review = reviewQuery.data;

  return (
    <Card className="space-y-4">
      <div id="spatial-review" className="scroll-mt-20">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>Validación espacial (LineString y Pasillo)</CardTitle>
              {review ? (
                <span
                  className={clsx(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                    review.has_failures
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700",
                  )}
                >
                  {review.has_failures
                    ? `${review.failures_count} incidencia(s)`
                    : "Sin incidencias"}
                </span>
              ) : null}
              {review?.cae ? (
                <SpatialStatusBadge
                  type="cae"
                  status={review.cae.spatial_validation_status}
                  title={review.cae.spatial_validation_notes ?? undefined}
                />
              ) : null}
            </div>
            <CardSubtitle>
              Comparación del recorrido GPS del conductor y su pasillo ST_Buffer
              frente a cada pasajero
            </CardSubtitle>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-gray-700">
              <input
                type="checkbox"
                checked={recalculateCae}
                onChange={(e) => setRecalculateCae(e.target.checked)}
                className="rounded border-panel-200 text-panel-800 focus:ring-panel-800"
              />
              Recalcular también métricas CAE si está en revisión
            </label>
            <Button
              type="button"
              onClick={() => {
                setRecalcFeedback(null);
                recalculateMutation.mutate();
              }}
              disabled={recalculateMutation.isPending}
            >
              <RefreshCw
                size={15}
                className={recalculateMutation.isPending ? "animate-spin" : ""}
              />
              {recalculateMutation.isPending
                ? "Recalculando…"
                : "Recalcular validación espacial"}
            </Button>
          </div>
        </div>
      </div>

      {recalcFeedback ? (
        <Alert variant={recalcFeedback.variant}>{recalcFeedback.text}</Alert>
      ) : null}

      {reviewQuery.isLoading ? (
        <Alert>Cargando revisión espacial del trayecto…</Alert>
      ) : reviewQuery.isError ? (
        <Alert variant="error" title="Error">
          No se pudo cargar la revisión espacial del viaje.
        </Alert>
      ) : review ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-panel-200 bg-panel-50 p-3">
              <div className="text-xs text-gray-500">LineString conductor</div>
              <div className="mt-1 text-sm font-semibold text-gray-900">
                {review.driver.linestring
                  ? `${review.driver.linestring.points_count} pts · ${formatKm(review.driver.linestring.distance_km)}`
                  : "Sin LineString"}
              </div>
            </div>

            <div className="rounded-lg border border-panel-200 bg-panel-50 p-3">
              <div className="text-xs text-gray-500">Parámetros vigentes</div>
              <div className="mt-1 text-sm font-semibold text-gray-900">
                Pasillo {review.current_config.spatial_buffer_meters} m · Mín.{" "}
                {review.current_config.spatial_min_overlap_percentage}%
              </div>
              <div className="text-xs text-gray-500">
                Mín. {review.current_config.spatial_min_points} pts ·{" "}
                {review.current_config.spatial_min_shared_distance_meters} m
                compartidos
              </div>
            </div>

            <div className="rounded-lg border border-panel-200 bg-panel-50 p-3">
              <div className="text-xs text-gray-500">Pasajeros comparados</div>
              <div className="mt-1 text-sm font-semibold text-gray-900">
                {passengers.length} pasajero(s)
              </div>
              <div className="text-xs text-gray-500">
                {passengers.filter((p) => p.is_match).length} coinciden ·{" "}
                {review.failures_count} fallos
              </div>
            </div>

            <div className="rounded-lg border border-panel-200 bg-panel-50 p-3">
              <div className="text-xs text-gray-500">Informe CAE asociado</div>
              {review.cae ? (
                <>
                  <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <span>{review.cae.status ?? "-"}</span>
                    <SpatialStatusBadge
                      type="cae"
                      status={review.cae.spatial_validation_status}
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    Km acompañado: {formatKm(review.cae.km_with_company)} /{" "}
                    {formatKm(review.cae.km_recorridos)}
                  </div>
                </>
              ) : (
                <div className="mt-1 text-sm text-gray-500">
                  Sin CAE generado todavía
                </div>
              )}
            </div>
          </div>

          {review.cae?.spatial_validation_notes ? (
            <Alert variant={review.has_failures ? "error" : "info"}>
              <span className="font-medium">Notas CAE: </span>
              {review.cae.spatial_validation_notes}
            </Alert>
          ) : null}

          <SpatialComparisonMap
            driverGeojson={review.driver.linestring?.geojson}
            pasilloGeojson={selectedPassenger?.pasillo_geojson}
            passengerGeojson={
              selectedPassenger?.passenger_linestring?.geojson ?? null
            }
            tramoCoincidenteGeojson={
              selectedPassenger?.tramo_coincidente_geojson
            }
            isMatch={Boolean(selectedPassenger?.is_match)}
          />

          <div>
            <div className="mb-2 text-xs font-medium text-gray-600">
              Selecciona un pasajero para inspeccionar su LineString, pasillo y
              tramo coincidente sobre el mapa:
            </div>

            {passengers.length === 0 ? (
              <div className="rounded-lg border border-panel-200 p-4 text-center text-sm text-gray-500">
                No hay pasajeros comparados ni LineStrings de pasajeros para
                este trayecto.
              </div>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Pasajero</Th>
                    <Th>Estado</Th>
                    <Th className="text-right">Solapamiento</Th>
                    <Th className="text-right">Coincidente / Ruta</Th>
                    <Th className="text-right">Pasillo usado</Th>
                    <Th>Motivo / Observación</Th>
                  </tr>
                </thead>
                <tbody>
                  {passengers.map((p, idx) => {
                    const rowKey = getPassengerKey(p, idx);
                    const isSelected =
                      selectedPassenger !== null &&
                      getPassengerKey(
                        selectedPassenger,
                        passengers.indexOf(selectedPassenger),
                      ) === rowKey;

                    return (
                      <tr
                        key={rowKey}
                        onClick={() => setSelectedKey(rowKey)}
                        className={clsx(
                          "cursor-pointer transition-colors",
                          isSelected
                            ? "bg-panel-100/80"
                            : "hover:bg-panel-50",
                        )}
                      >
                        <Td className="font-medium">
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`spatial-passenger-${tripId}`}
                              checked={isSelected}
                              onChange={() => setSelectedKey(rowKey)}
                              aria-label={`Seleccionar pasajero ${p.pasajero_id}`}
                            />
                            <Link
                              to={`/usuarios/${p.pasajero_id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-panel-900 hover:underline"
                            >
                              {p.pasajero_id.slice(0, 8)}…
                            </Link>
                          </div>
                          {p.passenger_linestring ? (
                            <div className="ml-6 text-xs text-gray-500">
                              {p.passenger_linestring.points_count} pts ·{" "}
                              {formatKm(p.passenger_linestring.distance_km)}
                            </div>
                          ) : null}
                        </Td>
                        <Td>
                          <SpatialStatusBadge type="match" status={p.status} />
                        </Td>
                        <Td className="text-right">
                          {p.overlap_percentage != null ? (
                            <div>
                              <span className="font-medium">
                                {Math.round(p.overlap_percentage * 10) / 10}%
                              </span>
                              {p.min_overlap_pct_used != null ? (
                                <span className="text-xs text-gray-500">
                                  {" "}
                                  / {p.min_overlap_pct_used}%
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            "-"
                          )}
                        </Td>
                        <Td className="text-right">
                          {p.metros_coincidentes != null ||
                          p.metros_ruta_pasajero != null ? (
                            <span>
                              {formatMeters(p.metros_coincidentes)} /{" "}
                              {formatMeters(p.metros_ruta_pasajero)}
                            </span>
                          ) : (
                            "-"
                          )}
                        </Td>
                        <Td className="text-right">
                          {p.buffer_meters_used != null
                            ? `${p.buffer_meters_used} m`
                            : "-"}
                        </Td>
                        <Td className="max-w-xs text-xs text-gray-700">
                          {p.failure_reason ?? (
                            <span className="text-gray-400">
                              Validación correcta
                            </span>
                          )}
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </div>
        </>
      ) : null}
    </Card>
  );
}
