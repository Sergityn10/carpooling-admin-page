import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import type { EventoTrayecto } from "../api/types";
import { Card, CardSubtitle, CardTitle } from "./ui/Card";
import Alert from "./ui/Alert";
import { formatDateTime } from "../lib/format";

const EVENTO_LABELS: Record<string, string> = {
  solicitud: "Solicitud",
  comienzo: "Inicio del trayecto",
  finalizacion: "Finalización",
  recogida: "Recogida de pasajero",
  reserva_creada: "Reserva creada",
  reserva_cancelada: "Reserva cancelada",
  llegada_destino: "Llegada a destino",
};

const EVENTO_COLORS: Record<string, string> = {
  solicitud: "bg-blue-500",
  comienzo: "bg-green-500",
  finalizacion: "bg-gray-500",
  recogida: "bg-amber-500",
  reserva_creada: "bg-teal-500",
  reserva_cancelada: "bg-red-500",
  llegada_destino: "bg-purple-500",
};

function getLabel(nombre: string) {
  return EVENTO_LABELS[nombre] ?? nombre;
}

function getColor(nombre: string) {
  return EVENTO_COLORS[nombre] ?? "bg-panel-400";
}

export default function TripEventsTimeline({ tripId }: { tripId: string }) {
  const [expanded, setExpanded] = useState(false);

  const eventosQuery = useQuery({
    queryKey: ["eventos-trayecto", tripId],
    queryFn: () => api.viajes.eventosById(tripId),
  });

  const eventos = eventosQuery.data?.eventos ?? [];
  const visibleEventos = expanded ? eventos : eventos.slice(0, 3);

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <CardTitle>Eventos del trayecto</CardTitle>
          <CardSubtitle>
            Seguimiento cronológico de los pasos del viaje
          </CardSubtitle>
        </div>
        {eventos.length > 3 ? (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs font-medium text-panel-800 hover:underline"
          >
            {expanded ? "Ver menos" : `Ver los ${eventos.length} eventos`}
          </button>
        ) : null}
      </div>

      <div className="mt-3">
        {eventosQuery.isLoading ? <Alert>Cargando eventos…</Alert> : null}
        {eventosQuery.isError ? (
          <Alert variant="error">No se pudieron cargar los eventos.</Alert>
        ) : null}

        {!eventosQuery.isLoading && !eventosQuery.isError ? (
          <>
            {eventos.length === 0 ? (
              <div className="py-4 text-center text-sm text-gray-500">
                No hay eventos registrados para este trayecto.
              </div>
            ) : (
              <ol className="relative space-y-3">
                {visibleEventos.map((ev, i) => (
                  <TimelineItem
                    key={ev.id}
                    evento={ev}
                    isLast={i === visibleEventos.length - 1}
                  />
                ))}
              </ol>
            )}
          </>
        ) : null}
      </div>
    </Card>
  );
}

function TimelineItem({
  evento,
  isLast,
}: {
  evento: EventoTrayecto;
  isLast: boolean;
}) {
  const nombre = evento.tipo_evento?.nombre ?? "desconocido";
  const color = getColor(nombre);
  const label = getLabel(nombre);

  return (
    <li className="relative flex gap-3 pl-1">
      {!isLast ? (
        <span
          className="absolute left-[7px] top-5 h-full w-px bg-panel-200"
          aria-hidden
        />
      ) : null}
      <span
        className={`mt-1 h-3.5 w-3.5 flex-shrink-0 rounded-full ${color}`}
        aria-hidden
      />
      <div className="min-w-0 flex-1 pb-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-gray-900">{label}</span>
          <span className="whitespace-nowrap text-xs text-gray-500">
            {formatDateTime(evento.created_at)}
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
          <span>
            Usuario:{" "}
            <code className="rounded bg-panel-100 px-1 py-0.5 text-[10px]">
              {evento.user_id.slice(0, 8)}…
            </code>
          </span>
          {evento.id_reserva ? (
            <span>
              Reserva:{" "}
              <code className="rounded bg-panel-100 px-1 py-0.5 text-[10px]">
                {evento.id_reserva.slice(0, 8)}…
              </code>
            </span>
          ) : null}
          {evento.lat != null && evento.lng != null ? (
            <span>
              {evento.lat.toFixed(4)}, {evento.lng.toFixed(4)}
            </span>
          ) : null}
        </div>
      </div>
    </li>
  );
}
