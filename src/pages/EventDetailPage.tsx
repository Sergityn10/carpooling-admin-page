import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { EventInput, Trayecto } from "../api/types";
import Alert from "../components/ui/Alert";
import { Card, CardSubtitle, CardTitle } from "../components/ui/Card";
import Input from "../components/ui/Input";
import Stat from "../components/ui/Stat";
import { Table, Td, Th } from "../components/ui/Table";
import { formatDateTime } from "../lib/format";
import LocationPicker from "../components/LocationPicker";
import ImageInput from "../components/ui/ImageInput";

export default function EventDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const eventQuery = useQuery({
    queryKey: ["evento", id],
    queryFn: () => api.eventos.byId(id!),
    enabled: Boolean(id),
  });

  const companiesQuery = useQuery({
    queryKey: ["empresas"],
    queryFn: () => api.empresas.list({ limit: 100 }),
  });

  const tagsQuery = useQuery({
    queryKey: ["tags"],
    queryFn: api.tags.list,
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.eventos.remove(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventos"] });
      window.location.href = "/eventos";
    },
  });

  if (!id) {
    return (
      <Alert title="Error" variant="error">
        Falta el ID en la URL.
      </Alert>
    );
  }

  if (eventQuery.isLoading)
    return <Alert title="Cargando">Cargando evento…</Alert>;
  if (eventQuery.isError || !eventQuery.data) {
    return (
      <Alert title="Error" variant="error">
        No se pudo cargar el evento.
      </Alert>
    );
  }

  const event = eventQuery.data.event;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">{event.name}</div>
          <div className="text-sm text-gray-600">
            Código:{" "}
            <code className="rounded bg-panel-100 px-1.5 py-0.5 text-xs">
              {event.unique_code}
            </code>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing((v) => !v)}
            className="rounded-lg border border-panel-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-panel-50"
          >
            {editing ? "Cancelar" : "Editar"}
          </button>
          <button
            onClick={() => {
              if (confirm(`¿Eliminar el evento "${event.name}"?`))
                deleteMutation.mutate();
            }}
            className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Eliminar
          </button>
        </div>
      </div>

      {editing ? (
        <EventEditForm
          event={event}
          companies={companiesQuery.data?.companies ?? []}
          tags={tagsQuery.data?.tags ?? []}
          onSaved={() => {
            setEditing(false);
            queryClient.invalidateQueries({ queryKey: ["evento", id] });
          }}
        />
      ) : (
        <>
          {event.image ? (
            <img
              src={event.image}
              alt={event.name}
              className="h-48 w-full rounded-xl object-cover"
            />
          ) : null}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <Stat label="Empresa" value={event.company?.name ?? "-"} />
            <Stat
              label="Ubicación"
              value={
                event.latitude != null && event.longitude != null
                  ? `${Number(event.latitude).toFixed(4)}, ${Number(event.longitude).toFixed(4)}`
                  : "-"
              }
            />
            <Stat label="URL" value={event.url ? "Sí" : "-"} />
            <Stat label="Entradas" value={event.ticket_url ? "Sí" : "-"} />
            <Stat
              label="Inicio"
              value={event.start_date ? formatDateTime(event.start_date) : "-"}
            />
            <Stat
              label="Fin"
              value={event.end_date ? formatDateTime(event.end_date) : "-"}
            />
          </div>

          <Card>
            <CardTitle>Detalles</CardTitle>
            <CardSubtitle>Información del evento</CardSubtitle>
            <div className="mt-2 space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Descripción:</span>{" "}
                {event.description ?? "-"}
              </div>
              {event.url ? (
                <div>
                  <span className="text-gray-500">URL:</span>{" "}
                  <a
                    href={event.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-panel-800 underline"
                  >
                    {event.url}
                  </a>
                </div>
              ) : null}
              {event.ticket_url ? (
                <div>
                  <span className="text-gray-500">Entradas:</span>{" "}
                  <a
                    href={event.ticket_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-panel-800 underline"
                  >
                    {event.ticket_url}
                  </a>
                </div>
              ) : null}
              <div>
                <span className="text-gray-500">Creado:</span>{" "}
                {formatDateTime(event.created_at)}
              </div>
              <div>
                <span className="text-gray-500">Actualizado:</span>{" "}
                {formatDateTime(event.updated_at)}
              </div>
            </div>
          </Card>

          <Card>
            <CardTitle>Etiquetas</CardTitle>
            <CardSubtitle>Tags asociados al evento</CardSubtitle>
            <div className="mt-2 flex flex-wrap gap-2">
              {event.tags?.length ? (
                event.tags.map((t) => (
                  <span
                    key={t.tag.id}
                    className="rounded-full bg-panel-100 px-3 py-1 text-xs text-gray-700"
                  >
                    {t.tag.name}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-500">Sin etiquetas</span>
              )}
            </div>
          </Card>

          {event.company ? (
            <Card>
              <CardTitle>Empresa</CardTitle>
              <CardSubtitle>Organizadora del evento</CardSubtitle>
              <div className="mt-2 text-sm">
                <Link
                  to={`/empresas/${event.company.id}`}
                  className="text-panel-800 underline"
                >
                  {event.company.name}
                </Link>
                {event.company.website ? (
                  <div className="mt-1 text-gray-600">
                    <a
                      href={event.company.website}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      {event.company.website}
                    </a>
                  </div>
                ) : null}
              </div>
            </Card>
          ) : null}

          <EventTripsSection eventoId={event.id} />
        </>
      )}

      <div className="text-sm text-gray-600">
        <Link className="underline" to="/eventos">
          Volver a eventos
        </Link>
      </div>
    </div>
  );
}

function EventEditForm({
  event,
  companies,
  tags,
  onSaved,
}: {
  event: import("../api/types").PlatformEvent;
  companies: { id: string; name: string }[];
  tags: { id: number; name: string }[];
  onSaved: () => void;
}) {
  const [form, setForm] = useState<EventInput>({
    name: event.name,
    company_id: event.company_id,
    start_date: event.start_date ?? "",
    end_date: event.end_date ?? "",
    description: event.description ?? "",
    url: event.url ?? "",
    ticket_url: event.ticket_url ?? "",
    tags: event.tags?.map((t) => t.tag.id) ?? [],
  });
  const [image, setImage] = useState<string | null>(event.image ?? null);
  const [lat, setLat] = useState<number | null>(
    event.latitude != null ? Number(event.latitude) : null,
  );
  const [lng, setLng] = useState<number | null>(
    event.longitude != null ? Number(event.longitude) : null,
  );
  const [error, setError] = useState<string | null>(null);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<EventInput>) =>
      api.eventos.update(event.id, data),
    onSuccess: onSaved,
    onError: (err: Error) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const payload: Partial<EventInput> = {
      name: form.name,
      company_id: form.company_id,
      description: form.description || undefined,
      url: form.url || undefined,
      ticket_url: form.ticket_url || undefined,
      tags: form.tags ?? [],
      image: image ?? undefined,
      start_date: form.start_date || undefined,
      end_date: form.end_date || undefined,
    };
    if (lat != null) payload.latitude = lat;
    if (lng != null) payload.longitude = lng;
    updateMutation.mutate(payload);
  };

  return (
    <Card>
      <CardTitle>Editar evento</CardTitle>
      <form onSubmit={handleSubmit} className="mt-3 space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-600">Nombre</label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Empresa</label>
          <select
            value={form.company_id}
            onChange={(e) => setForm({ ...form, company_id: e.target.value })}
            className="w-full rounded-lg border border-panel-200 bg-white px-3 py-2 text-sm"
          >
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <ImageInput
            value={image}
            onChange={setImage}
            label="Imagen del evento"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600">Inicio</label>
            <Input
              type="datetime-local"
              value={form.start_date ?? ""}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Fin</label>
            <Input
              type="datetime-local"
              value={form.end_date ?? ""}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Ubicación</label>
          <div className="mt-1">
            <LocationPicker
              latitude={lat}
              longitude={lng}
              onChange={(la, ln) => {
                setLat(la);
                setLng(ln);
              }}
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">
            Descripción
          </label>
          <textarea
            value={form.description ?? ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className="w-full rounded-lg border border-panel-200 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600">URL</label>
            <Input
              value={form.url ?? ""}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">
              URL entradas
            </label>
            <Input
              value={form.ticket_url ?? ""}
              onChange={(e) => setForm({ ...form, ticket_url: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Etiquetas</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {tags.map((t) => {
              const selected = form.tags?.includes(t.id) ?? false;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      tags: selected
                        ? form.tags?.filter((tid) => tid !== t.id)
                        : [...(form.tags ?? []), t.id],
                    })
                  }
                  className={
                    selected
                      ? "rounded-full bg-panel-800 px-3 py-1 text-xs font-medium text-white"
                      : "rounded-full bg-panel-100 px-3 py-1 text-xs text-gray-700"
                  }
                >
                  {t.name}
                </button>
              );
            })}
          </div>
        </div>
        {error ? <Alert variant="error">{error}</Alert> : null}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="rounded-lg bg-panel-800 px-4 py-2 text-sm font-medium text-white hover:bg-panel-900 disabled:opacity-50"
          >
            {updateMutation.isPending ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </form>
    </Card>
  );
}

function EventTripsSection({ eventoId }: { eventoId: string }) {
  const tripsQuery = useQuery({
    queryKey: ["trayectos-evento", eventoId],
    queryFn: () => api.viajes.byEventoId(eventoId),
  });

  const trayectos = tripsQuery.data?.trayectos ?? [];

  return (
    <Card>
      <CardTitle>Trayectos asociados</CardTitle>
      <CardSubtitle>Viajes creados hacia o desde este evento</CardSubtitle>

      <div className="mt-3">
        {tripsQuery.isLoading ? (
          <Alert>Cargando trayectos…</Alert>
        ) : tripsQuery.isError ? (
          <Alert variant="error">
            No se pudieron cargar los trayectos del evento.
          </Alert>
        ) : trayectos.length === 0 ? (
          <div className="py-4 text-center text-sm text-gray-500">
            No hay trayectos asociados a este evento.
          </div>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Origen</Th>
                <Th>Destino</Th>
                <Th>Fecha</Th>
                <Th>Conductor</Th>
                <Th className="text-right">Plazas</Th>
                <Th className="text-right">Precio</Th>
              </tr>
            </thead>
            <tbody>
              {trayectos.map((t: Trayecto) => (
                <tr key={t.id} className="hover:bg-panel-50">
                  <Td className="font-medium">
                    <Link
                      className="text-panel-900 underline-offset-2 hover:underline"
                      to={`/viajes/${t.id}`}
                    >
                      {t.origen}
                    </Link>
                  </Td>
                  <Td>{t.destino}</Td>
                  <Td>{formatDateTime(t.hora)}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      {t.img_perfil ? (
                        <img
                          src={t.img_perfil}
                          alt=""
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      ) : null}
                      <span>{t.conductor}</span>
                    </div>
                  </Td>
                  <Td className="text-right">
                    {t.disponible}/{t.plazas}
                  </Td>
                  <Td className="text-right">{t.precio}€</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </Card>
  );
}
