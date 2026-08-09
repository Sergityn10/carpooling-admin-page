import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { RecorridoPunto, ReservaStatus } from "../api/types";
import TripMap from "../components/TripMap";
import TripEventsTimeline from "../components/TripEventsTimeline";
import Alert from "../components/ui/Alert";
import { Card, CardSubtitle, CardTitle } from "../components/ui/Card";
import Stat from "../components/ui/Stat";
import { Table, Td, Th } from "../components/ui/Table";
import { formatDateTime } from "../lib/format";

function toLatLng(p: RecorridoPunto) {
  return { lat: Number(p.lat), lng: Number(p.lng) };
}

const RESERVA_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  canceled: "bg-red-100 text-red-700",
};

export default function TripDetailPage() {
  const { id } = useParams();

  const viajeQuery = useQuery({
    queryKey: ["viaje-admin", id],
    queryFn: () => api.viajes.adminById(id!),
    enabled: Boolean(id),
  });

  const recorridoQuery = useQuery({
    queryKey: ["recorrido", id],
    queryFn: () => api.viajes.recorridoById(id!),
    enabled: Boolean(id),
  });

  const comentariosQuery = useQuery({
    queryKey: ["comentarios", id],
    queryFn: () => api.comentarios.byTravelId(id!),
    enabled: Boolean(id),
  });

  const reservasQuery = useQuery({
    queryKey: ["reservas-trayecto", id],
    queryFn: () => api.reservas.adminList({ id_trayecto: id, limit: 100 }),
    enabled: Boolean(id),
  });

  const queryClient = useQueryClient();

  const updateReservaMutation = useMutation({
    mutationFn: ({
      reservaId,
      data,
    }: {
      reservaId: string;
      data: Partial<{
        status: ReservaStatus;
        trip_outcome: string;
        trip_outcome_reason: string;
      }>;
    }) => api.reservas.adminUpdate(reservaId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservas-trayecto", id] });
    },
  });

  const points = useMemo(() => {
    const arr = recorridoQuery.data?.recorridos ?? [];
    return arr.map(toLatLng);
  }, [recorridoQuery.data]);

  if (!id) {
    return (
      <Alert title="Error" variant="error">
        Falta el id del viaje en la URL.
      </Alert>
    );
  }

  if (viajeQuery.isLoading) {
    return <Alert title="Cargando">Cargando viaje…</Alert>;
  }

  if (viajeQuery.isError || !viajeQuery.data) {
    return (
      <Alert title="Error" variant="error">
        No se pudo cargar el viaje.
      </Alert>
    );
  }

  const viaje = viajeQuery.data.data;
  const comentarios = comentariosQuery.data?.opinionsList ?? [];
  const reservas = reservasQuery.data?.data ?? [];

  // byId obtiene coordenadas desde GET /api/trayecto (lista); fallback a puntos del recorrido
  const recorridos = recorridoQuery.data?.recorridos ?? [];
  const start =
    viaje.origen_lat != null && viaje.origen_lng != null
      ? { lat: Number(viaje.origen_lat), lng: Number(viaje.origen_lng) }
      : recorridos[0]
        ? { lat: Number(recorridos[0].lat), lng: Number(recorridos[0].lng) }
        : null;
  const end =
    viaje.destino_lat != null && viaje.destino_lng != null
      ? { lat: Number(viaje.destino_lat), lng: Number(viaje.destino_lng) }
      : recorridos[recorridos.length - 1]
        ? {
            lat: Number(recorridos[recorridos.length - 1].lat),
            lng: Number(recorridos[recorridos.length - 1].lng),
          }
        : null;

  const recorridoLoading = recorridoQuery.isLoading;
  const mapReady = !recorridoLoading && !recorridoQuery.isError && start && end;

  return (
    <div className="space-y-4">
      <div>
        <div className="text-lg font-semibold">
          {viaje.origen} → {viaje.destino}
        </div>
        <div className="text-sm text-gray-600">
          Estado: <span className="font-medium">{viaje.status ?? "-"}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Stat label="Fecha" value={formatDateTime(viaje.hora)} />
        <Stat label="Plazas" value={`${viaje.disponible}/${viaje.plazas}`} />
        <Stat label="Precio" value={`${viaje.precio}€`} />
        <Stat label="Conductor" value={viaje.conductor ?? "-"} />
      </div>

      <Card>
        <CardTitle>Recorrido GPS</CardTitle>
        <CardSubtitle>
          Puntos GPS registrados durante el trayecto (si hay)
        </CardSubtitle>

        <div className="mt-3">
          {recorridoLoading ? (
            <Alert>Cargando ubicaciones y recorrido…</Alert>
          ) : recorridoQuery.isError ? (
            <Alert variant="error">
              No se pudo cargar el recorrido del viaje.
            </Alert>
          ) : points.length === 0 && !start && !end ? (
            <Alert variant="info">
              No hay coordenadas ni puntos GPS disponibles para este viaje.
            </Alert>
          ) : mapReady ? (
            <>
              <TripMap
                start={start!}
                end={end!}
                points={points.length > 0 ? points : [start!, end!]}
              />
              <div className="mt-3 text-xs text-gray-500">
                Puntos GPS registrados:{" "}
                {recorridoQuery.data?.recorridos.length ?? 0}
              </div>
            </>
          ) : null}
        </div>
      </Card>

      <TripEventsTimeline tripId={id} />

      <Card>
        <CardTitle>Reservas</CardTitle>
        <CardSubtitle>Pasajeros con reserva en este trayecto</CardSubtitle>

        <div className="mt-3">
          {reservasQuery.isLoading ? (
            <Alert>Cargando reservas…</Alert>
          ) : reservasQuery.isError ? (
            <Alert variant="error">No se pudieron cargar las reservas.</Alert>
          ) : reservas.length === 0 ? (
            <div className="text-sm text-gray-500">
              Sin reservas para este trayecto.
            </div>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Pasajero</Th>
                  <Th>Estado reserva</Th>
                  <Th>Resultado viaje</Th>
                  <Th>Pago</Th>
                  <Th>Fecha</Th>
                </tr>
              </thead>
              <tbody>
                {reservas.map((r) => (
                  <tr key={r.id_reserva} className="hover:bg-panel-50">
                    <Td className="font-medium">
                      <Link
                        className="text-panel-900 hover:underline"
                        to={`/usuarios/${r.user_id}`}
                      >
                        {r.User?.name ?? r.user_id.slice(0, 8)}…
                      </Link>
                      {r.User?.email ? (
                        <div className="text-xs text-gray-500">
                          {r.User.email}
                        </div>
                      ) : null}
                    </Td>
                    <Td>
                      <select
                        value={r.status}
                        onChange={(e) => {
                          const newStatus = e.target.value as ReservaStatus;
                          if (newStatus !== r.status) {
                            updateReservaMutation.mutate({
                              reservaId: r.id_reserva,
                              data: { status: newStatus },
                            });
                          }
                        }}
                        disabled={updateReservaMutation.isPending}
                        className={`rounded-full px-2 py-0.5 text-xs font-medium border-0 ${RESERVA_STATUS_COLORS[r.status] ?? "bg-gray-100 text-gray-700"}`}
                      >
                        <option value="pending">Pendiente</option>
                        <option value="completed">Completada</option>
                        <option value="canceled">Cancelada</option>
                      </select>
                    </Td>
                    <Td>
                      <select
                        value={r.trip_outcome ?? ""}
                        onChange={(e) => {
                          const newOutcome = e.target.value;
                          if (newOutcome !== (r.trip_outcome ?? "")) {
                            updateReservaMutation.mutate({
                              reservaId: r.id_reserva,
                              data: { trip_outcome: newOutcome },
                            });
                          }
                        }}
                        disabled={updateReservaMutation.isPending}
                        className="rounded-lg border border-panel-200 bg-white px-2 py-0.5 text-xs"
                      >
                        <option value="">Sin resultado</option>
                        <option value="pending">Pendiente</option>
                        <option value="completed">Completado</option>
                        <option value="no_show">No se presentó</option>
                        <option value="canceled">Cancelado</option>
                      </select>
                    </Td>
                    <Td className="text-xs">
                      {r.stripe_payment_intent_status ?? "-"}
                    </Td>
                    <Td className="text-gray-600 text-sm">
                      {formatDateTime(r.created_at)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>
      </Card>

      <Card>
        <CardTitle>Opiniones</CardTitle>
        <CardSubtitle>Comentarios y valoraciones de este trayecto</CardSubtitle>

        <div className="mt-3">
          {comentariosQuery.isLoading ? (
            <Alert>Cargando opiniones…</Alert>
          ) : null}
          {comentariosQuery.isError ? (
            <Alert variant="error">No se pudieron cargar las opiniones.</Alert>
          ) : null}

          {!comentariosQuery.isLoading && !comentariosQuery.isError ? (
            <div className="space-y-2">
              {comentarios.length === 0 ? (
                <div className="text-sm text-gray-500">
                  Sin opiniones para este trayecto.
                </div>
              ) : null}
              {comentarios.map((c) => (
                <div
                  key={c.id_comment}
                  className="rounded-lg border border-panel-200 p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">
                      Valoración: {c.rating}/10
                    </div>
                  </div>
                  <div className="mt-1 text-sm text-gray-700">{c.opinion}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </Card>

      <div className="text-sm text-gray-600">
        <Link className="underline" to="/viajes">
          Volver a viajes
        </Link>
      </div>
    </div>
  );
}
