import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { EventInput, PlatformEvent } from "../api/types";
import Alert from "../components/ui/Alert";
import { Card, CardSubtitle, CardTitle } from "../components/ui/Card";
import Input from "../components/ui/Input";
import { Table, Td, Th } from "../components/ui/Table";
import { formatRelative } from "../lib/format";
import LocationPicker from "../components/LocationPicker";
import ImageInput from "../components/ui/ImageInput";

function matchesEvent(e: PlatformEvent, q: string) {
  const query = q.trim().toLowerCase();
  if (!query) return true;
  return (
    e.name.toLowerCase().includes(query) ||
    (e.unique_code ?? "").toLowerCase().includes(query) ||
    (e.company?.name ?? "").toLowerCase().includes(query) ||
    (e.description ?? "").toLowerCase().includes(query)
  );
}

export default function EventsPage() {
  const [q, setQ] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const eventsQuery = useQuery({
    queryKey: ["eventos"],
    queryFn: () => api.eventos.list({ limit: 100 }),
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
    mutationFn: (id: string) => api.eventos.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["eventos"] }),
  });

  const filtered = useMemo(() => {
    const arr = eventsQuery.data?.events ?? [];
    return arr.filter((e) => matchesEvent(e, q));
  }, [eventsQuery.data, q]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">Eventos</div>
          <div className="text-sm text-gray-600">
            Gestión de eventos de plataforma
          </div>
        </div>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="rounded-lg bg-panel-800 px-3 py-2 text-sm font-medium text-white hover:bg-panel-900"
        >
          {showCreate ? "Cancelar" : "Nuevo evento"}
        </button>
      </div>

      {showCreate ? (
        <EventCreateForm
          companies={companiesQuery.data?.companies ?? []}
          tags={tagsQuery.data?.tags ?? []}
          onCreated={() => {
            setShowCreate(false);
            queryClient.invalidateQueries({ queryKey: ["eventos"] });
          }}
        />
      ) : null}

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Buscar</CardTitle>
            <CardSubtitle>
              Filtra por nombre, código, empresa o descripción
            </CardSubtitle>
          </div>
          <div className="w-80 max-w-full">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar…"
            />
          </div>
        </div>
      </Card>

      {eventsQuery.isLoading ? (
        <Alert title="Cargando">Cargando eventos…</Alert>
      ) : null}
      {eventsQuery.isError ? (
        <Alert title="Error" variant="error">
          No se pudieron cargar los eventos.
        </Alert>
      ) : null}

      {!eventsQuery.isLoading && !eventsQuery.isError ? (
        <Table>
          <thead>
            <tr>
              <Th>Nombre</Th>
              <Th>Empresa</Th>
              <Th>Código</Th>
              <Th>Etiquetas</Th>
              <Th className="text-right">Creado</Th>
              <Th className="text-right">Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id} className="hover:bg-panel-50">
                <Td className="font-medium">
                  <div className="flex items-center gap-2">
                    {e.image ? (
                      <img
                        src={e.image}
                        alt=""
                        className="h-10 w-10 flex-shrink-0 rounded object-cover"
                      />
                    ) : null}
                    <Link
                      className="text-panel-900 underline-offset-2 hover:underline"
                      to={`/eventos/${e.id}`}
                    >
                      {e.name}
                    </Link>
                  </div>
                </Td>
                <Td>{e.company?.name ?? "-"}</Td>
                <Td>
                  <code className="rounded bg-panel-100 px-1.5 py-0.5 text-xs">
                    {e.unique_code}
                  </code>
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {e.tags?.map((t) => (
                      <span
                        key={t.tag.id}
                        className="rounded-full bg-panel-100 px-2 py-0.5 text-xs text-gray-700"
                      >
                        {t.tag.name}
                      </span>
                    ))}
                  </div>
                </Td>
                <Td className="text-right text-gray-600">
                  {formatRelative(e.created_at)}
                </Td>
                <Td className="text-right">
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar el evento "${e.name}"?`))
                        deleteMutation.mutate(e.id);
                    }}
                    className="text-xs font-medium text-red-600 hover:text-red-700"
                  >
                    Eliminar
                  </button>
                </Td>
              </tr>
            ))}

            {filtered.length === 0 ? (
              <tr>
                <Td className="py-8 text-center text-gray-600" colSpan={6}>
                  Sin resultados
                </Td>
              </tr>
            ) : null}
          </tbody>
        </Table>
      ) : null}
    </div>
  );
}

function EventCreateForm({
  companies,
  tags,
  onCreated,
}: {
  companies: { id: string; name: string }[];
  tags: { id: number; name: string }[];
  onCreated: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<EventInput>({
    name: "",
    company_id: "",
    start_date: "",
    end_date: "",
    description: "",
    url: "",
    ticket_url: "",
    tags: [],
  });
  const [image, setImage] = useState<string | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (data: EventInput) => api.eventos.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventos"] });
      onCreated();
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const payload: EventInput = {
      name: form.name,
      company_id: form.company_id,
      description: form.description || undefined,
      url: form.url || undefined,
      ticket_url: form.ticket_url || undefined,
      tags: form.tags?.length ? form.tags : undefined,
      image: image ?? undefined,
      start_date: form.start_date || undefined,
      end_date: form.end_date || undefined,
    };
    if (lat != null) payload.latitude = lat;
    if (lng != null) payload.longitude = lng;
    createMutation.mutate(payload);
  };

  return (
    <Card>
      <CardTitle>Crear evento</CardTitle>
      <CardSubtitle>Rellena los campos requeridos (*)</CardSubtitle>
      <form onSubmit={handleSubmit} className="mt-3 space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-600">Nombre *</label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Empresa *</label>
          <select
            value={form.company_id}
            onChange={(e) => setForm({ ...form, company_id: e.target.value })}
            required
            className="w-full rounded-lg border border-panel-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">Selecciona una empresa…</option>
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
              placeholder="https://evento.com"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">
              URL entradas
            </label>
            <Input
              value={form.ticket_url ?? ""}
              onChange={(e) => setForm({ ...form, ticket_url: e.target.value })}
              placeholder="https://evento.com/entradas"
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
                        ? form.tags?.filter((id) => id !== t.id)
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
            disabled={createMutation.isPending}
            className="rounded-lg bg-panel-800 px-4 py-2 text-sm font-medium text-white hover:bg-panel-900 disabled:opacity-50"
          >
            {createMutation.isPending ? "Creando…" : "Crear evento"}
          </button>
        </div>
      </form>
    </Card>
  );
}
