import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { CompanyInput } from "../api/types";
import Alert from "../components/ui/Alert";
import { Card, CardSubtitle, CardTitle } from "../components/ui/Card";
import Input from "../components/ui/Input";
import Stat from "../components/ui/Stat";
import { Table, Td, Th } from "../components/ui/Table";
import { formatDateTime } from "../lib/format";

export default function CompanyDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const companyQuery = useQuery({
    queryKey: ["empresa", id],
    queryFn: () => api.empresas.byId(id!),
    enabled: Boolean(id),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.empresas.remove(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresas"] });
      window.location.href = "/empresas";
    },
  });

  if (!id) {
    return <Alert title="Error" variant="error">Falta el ID en la URL.</Alert>;
  }

  if (companyQuery.isLoading) return <Alert title="Cargando">Cargando empresa…</Alert>;
  if (companyQuery.isError || !companyQuery.data) {
    return <Alert title="Error" variant="error">No se pudo cargar la empresa.</Alert>;
  }

  const company = companyQuery.data.company;
  const events = company.events ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">{company.name}</div>
          <div className="text-sm text-gray-600">{company.email}</div>
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
              if (confirm(`¿Eliminar la empresa "${company.name}"? Se eliminarán también sus eventos.`))
                deleteMutation.mutate();
            }}
            className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Eliminar
          </button>
        </div>
      </div>

      {editing ? (
        <CompanyEditForm
          company={company}
          onSaved={() => {
            setEditing(false);
            queryClient.invalidateQueries({ queryKey: ["empresa", id] });
          }}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <Stat label="Teléfono" value={company.phone ?? "-"} />
            <Stat label="Web" value={company.website ? "Sí" : "-"} />
            <Stat label="Eventos" value={events.length} />
            <Stat label="Descripción" value={company.description ? "Sí" : "-"} />
          </div>

          <Card>
            <CardTitle>Información de contacto</CardTitle>
            <CardSubtitle>Datos de la empresa</CardSubtitle>
            <div className="mt-2 space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Email:</span> {company.email}
              </div>
              <div>
                <span className="text-gray-500">Teléfono:</span> {company.phone ?? "-"}
              </div>
              {company.website ? (
                <div>
                  <span className="text-gray-500">Web:</span>{" "}
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-panel-800 underline"
                  >
                    {company.website}
                  </a>
                </div>
              ) : null}
              <div>
                <span className="text-gray-500">Descripción:</span>{" "}
                {company.description ?? "-"}
              </div>
              <div>
                <span className="text-gray-500">Creado:</span>{" "}
                {formatDateTime(company.created_at)}
              </div>
              <div>
                <span className="text-gray-500">Actualizado:</span>{" "}
                {formatDateTime(company.updated_at)}
              </div>
            </div>
          </Card>

          <Card>
            <CardTitle>Eventos de la empresa</CardTitle>
            <CardSubtitle>{events.length} evento(s)</CardSubtitle>
            <div className="mt-3">
              {events.length > 0 ? (
                <Table>
                  <thead>
                    <tr>
                      <Th>Nombre</Th>
                      <Th>Código</Th>
                      <Th>Etiquetas</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((e) => (
                      <tr key={e.id} className="hover:bg-panel-50">
                        <Td className="font-medium">
                          <Link
                            className="text-panel-900 underline-offset-2 hover:underline"
                            to={`/eventos/${e.id}`}
                          >
                            {e.name}
                          </Link>
                        </Td>
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
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="py-6 text-center text-sm text-gray-500">
                  Esta empresa no tiene eventos
                </div>
              )}
            </div>
          </Card>
        </>
      )}

      <div className="text-sm text-gray-600">
        <Link className="underline" to="/empresas">
          Volver a empresas
        </Link>
      </div>
    </div>
  );
}

function CompanyEditForm({
  company,
  onSaved,
}: {
  company: import("../api/types").Company;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<CompanyInput>({
    name: company.name,
    email: company.email,
    phone: company.phone ?? "",
    website: company.website ?? "",
    description: company.description ?? "",
  });
  const [error, setError] = useState<string | null>(null);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CompanyInput>) =>
      api.empresas.update(company.id, data),
    onSuccess: onSaved,
    onError: (err: Error) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    updateMutation.mutate({
      ...form,
      phone: form.phone || undefined,
      website: form.website || undefined,
      description: form.description || undefined,
    });
  };

  return (
    <Card>
      <CardTitle>Editar empresa</CardTitle>
      <form onSubmit={handleSubmit} className="mt-3 space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-600">Nombre</label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Email</label>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
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
