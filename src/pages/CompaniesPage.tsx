import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { Company, CompanyInput } from "../api/types";
import Alert from "../components/ui/Alert";
import { Card, CardSubtitle, CardTitle } from "../components/ui/Card";
import Input from "../components/ui/Input";
import { Table, Td, Th } from "../components/ui/Table";
import { formatRelative } from "../lib/format";

function matchesCompany(c: Company, q: string) {
  const query = q.trim().toLowerCase();
  if (!query) return true;
  return (
    c.name.toLowerCase().includes(query) ||
    (c.email ?? "").toLowerCase().includes(query) ||
    (c.website ?? "").toLowerCase().includes(query) ||
    (c.description ?? "").toLowerCase().includes(query)
  );
}

export default function CompaniesPage() {
  const [q, setQ] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const companiesQuery = useQuery({
    queryKey: ["empresas"],
    queryFn: () => api.empresas.list({ limit: 100 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.empresas.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["empresas"] }),
  });

  const filtered = useMemo(() => {
    const arr = companiesQuery.data?.companies ?? [];
    return arr.filter((c) => matchesCompany(c, q));
  }, [companiesQuery.data, q]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">Empresas</div>
          <div className="text-sm text-gray-600">
            Gestión de empresas organizadoras de eventos
          </div>
        </div>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="rounded-lg bg-panel-800 px-3 py-2 text-sm font-medium text-white hover:bg-panel-900"
        >
          {showCreate ? "Cancelar" : "Nueva empresa"}
        </button>
      </div>

      {showCreate ? (
        <CompanyCreateForm
          onCreated={() => {
            setShowCreate(false);
            queryClient.invalidateQueries({ queryKey: ["empresas"] });
          }}
        />
      ) : null}

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Buscar</CardTitle>
            <CardSubtitle>Filtra por nombre, email, web o descripción</CardSubtitle>
          </div>
          <div className="w-80 max-w-full">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…" />
          </div>
        </div>
      </Card>

      {companiesQuery.isLoading ? <Alert title="Cargando">Cargando empresas…</Alert> : null}
      {companiesQuery.isError ? (
        <Alert title="Error" variant="error">
          No se pudieron cargar las empresas.
        </Alert>
      ) : null}

      {!companiesQuery.isLoading && !companiesQuery.isError ? (
        <Table>
          <thead>
            <tr>
              <Th>Nombre</Th>
              <Th>Email</Th>
              <Th>Teléfono</Th>
              <Th>Web</Th>
              <Th className="text-right">Eventos</Th>
              <Th className="text-right">Creado</Th>
              <Th className="text-right">Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-panel-50">
                <Td className="font-medium">
                  <Link
                    className="text-panel-900 underline-offset-2 hover:underline"
                    to={`/empresas/${c.id}`}
                  >
                    {c.name}
                  </Link>
                </Td>
                <Td>{c.email ?? "-"}</Td>
                <Td>{c.phone ?? "-"}</Td>
                <Td>
                  {c.website ? (
                    <a
                      href={c.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-panel-800 underline"
                    >
                      {c.website}
                    </a>
                  ) : (
                    "-"
                  )}
                </Td>
                <Td className="text-right">{c._count?.events ?? "-"}</Td>
                <Td className="text-right text-gray-600">
                  {formatRelative(c.created_at)}
                </Td>
                <Td className="text-right">
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar la empresa "${c.name}"? Se eliminarán también sus eventos.`))
                        deleteMutation.mutate(c.id);
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
                <Td className="py-8 text-center text-gray-600" colSpan={7}>
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

function CompanyCreateForm({ onCreated }: { onCreated: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CompanyInput>({
    name: "",
    email: "",
    phone: "",
    website: "",
    description: "",
  });
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (data: CompanyInput) => api.empresas.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresas"] });
      onCreated();
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    createMutation.mutate({
      ...form,
      phone: form.phone || undefined,
      website: form.website || undefined,
      description: form.description || undefined,
    });
  };

  return (
    <Card>
      <CardTitle>Crear empresa</CardTitle>
      <CardSubtitle>Campos requeridos (*)</CardSubtitle>
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
          <label className="text-xs font-medium text-gray-600">Email *</label>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600">Teléfono</label>
            <Input
              value={form.phone ?? ""}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Sitio web</label>
            <Input
              value={form.website ?? ""}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://…"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Descripción</label>
          <textarea
            value={form.description ?? ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className="w-full rounded-lg border border-panel-200 bg-white px-3 py-2 text-sm"
          />
        </div>
        {error ? <Alert variant="error">{error}</Alert> : null}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded-lg bg-panel-800 px-4 py-2 text-sm font-medium text-white hover:bg-panel-900 disabled:opacity-50"
          >
            {createMutation.isPending ? "Creando…" : "Crear empresa"}
          </button>
        </div>
      </form>
    </Card>
  );
}
