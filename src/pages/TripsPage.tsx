import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import Alert from "../components/ui/Alert";
import { Card, CardSubtitle, CardTitle } from "../components/ui/Card";
import Input from "../components/ui/Input";
import { Table, Td, Th } from "../components/ui/Table";
import { formatDateTime } from "../lib/format";

const PAGE_SIZE = 20;

export default function TripsPage() {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const viajesQuery = useQuery({
    queryKey: ["viajes-admin", statusFilter, q, page],
    queryFn: () =>
      api.viajes.adminList({
        status: statusFilter || undefined,
        search: q.trim() || undefined,
        page,
        limit: PAGE_SIZE,
      }),
  });

  const trips = viajesQuery.data?.data ?? [];
  const total = viajesQuery.data?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div>
        <div className="text-lg font-semibold">Viajes</div>
        <div className="text-sm text-gray-600">
          Listado de trayectos (todos los estados)
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Buscar</CardTitle>
            <CardSubtitle>
              Filtra por ID, origen, destino, conductor o estado
            </CardSubtitle>
          </div>
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-panel-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Todos los estados</option>
              <option value="programado">Programado</option>
              <option value="en_curso">En curso</option>
              <option value="finalizado">Finalizado</option>
            </select>
            <div className="w-80 max-w-full">
              <Input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Buscar origen o destino…"
              />
            </div>
          </div>
        </div>
      </Card>

      {viajesQuery.isLoading ? (
        <Alert title="Cargando">Cargando viajes…</Alert>
      ) : null}

      {viajesQuery.isError ? (
        <Alert title="Error" variant="error">
          No se pudieron cargar los viajes.
        </Alert>
      ) : null}

      {!viajesQuery.isLoading && !viajesQuery.isError ? (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Ruta</Th>
                <Th>Estado</Th>
                <Th>Conductor</Th>
                <Th>Fecha</Th>
                <Th className="text-right">Plazas</Th>
                <Th className="text-right">Precio</Th>
              </tr>
            </thead>
            <tbody>
              {trips.map((t) => (
                <tr key={t.id} className="hover:bg-panel-50">
                  <Td className="font-medium">
                    <Link
                      className="text-panel-900 underline-offset-2 hover:underline"
                      to={`/viajes/${t.id}`}
                    >
                      {t.origen} → {t.destino}
                    </Link>
                    <div className="text-xs text-gray-500">{t.id}</div>
                  </Td>
                  <Td>{t.status ?? "-"}</Td>
                  <Td>
                    {t.conductor ? (
                      <Link
                        className="text-panel-900 underline-offset-2 hover:underline"
                        to={`/usuarios/${t.conductor_id ?? t.conductor}`}
                      >
                        {(t as any).conductor_nombre ?? t.conductor}
                      </Link>
                    ) : (
                      "-"
                    )}
                  </Td>
                  <Td>{formatDateTime(t.hora)}</Td>
                  <Td className="text-right">
                    {t.disponible}/{t.plazas}
                  </Td>
                  <Td className="text-right">{t.precio}€</Td>
                </tr>
              ))}

              {trips.length === 0 ? (
                <tr>
                  <Td className="py-8 text-center text-gray-600" colSpan={6}>
                    Sin resultados
                  </Td>
                </tr>
              ) : null}
            </tbody>
          </Table>
          {totalPages > 1 ? (
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {total} trayecto(s) · Pág. {page} de {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-lg border border-panel-200 px-3 py-1.5 text-sm hover:bg-panel-50 disabled:opacity-50"
                >
                  ← Anterior
                </button>
                <button
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
      ) : null}
    </div>
  );
}
