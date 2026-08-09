import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { Suggestion } from "../api/types";
import Alert from "../components/ui/Alert";
import { Card, CardSubtitle, CardTitle } from "../components/ui/Card";
import Input from "../components/ui/Input";
import { Table, Td, Th } from "../components/ui/Table";
import { formatRelative } from "../lib/format";

function matchesSuggestion(s: Suggestion, q: string) {
  const query = q.trim().toLowerCase();
  if (!query) return true;
  return (
    s.name.toLowerCase().includes(query) ||
    s.email.toLowerCase().includes(query) ||
    (s.website ?? "").toLowerCase().includes(query) ||
    (s.user?.name ?? "").toLowerCase().includes(query)
  );
}

export default function SuggestionsPage() {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const queryClient = useQueryClient();

  const suggestionsQuery = useQuery({
    queryKey: ["sugerencias", statusFilter],
    queryFn: () =>
      api.sugerencias.list({
        limit: 100,
        ...(statusFilter ? { status: statusFilter } : {}),
      }),
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => api.sugerencias.accept(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sugerencias"] });
      queryClient.invalidateQueries({ queryKey: ["empresas"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.sugerencias.remove(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["sugerencias"] }),
  });

  const filtered = useMemo(() => {
    const arr = suggestionsQuery.data?.suggestions ?? [];
    return arr.filter((s) => matchesSuggestion(s, q));
  }, [suggestionsQuery.data, q]);

  return (
    <div className="space-y-4">
      <div>
        <div className="text-lg font-semibold">Sugerencias de empresas</div>
        <div className="text-sm text-gray-600">
          Revisa, acepta o deniega sugerencias de entidades promotoras
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Buscar</CardTitle>
            <CardSubtitle>Filtra por nombre, email, web o usuario</CardSubtitle>
          </div>
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-panel-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              <option value="pending">Pendientes</option>
              <option value="accepted">Aceptadas</option>
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

      {suggestionsQuery.isLoading ? (
        <Alert title="Cargando">Cargando sugerencias…</Alert>
      ) : null}
      {suggestionsQuery.isError ? (
        <Alert title="Error" variant="error">
          No se pudieron cargar las sugerencias.
        </Alert>
      ) : null}

      {!suggestionsQuery.isLoading && !suggestionsQuery.isError ? (
        <Table>
          <thead>
            <tr>
              <Th>Empresa</Th>
              <Th>Email</Th>
              <Th>Web</Th>
              <Th>Sugerida por</Th>
              <Th>Estado</Th>
              <Th className="text-right">Fecha</Th>
              <Th className="text-right">Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-panel-50">
                <Td className="font-medium">{s.name}</Td>
                <Td>{s.email}</Td>
                <Td>
                  {s.website ? (
                    <a
                      href={s.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-panel-800 underline"
                    >
                      {s.website}
                    </a>
                  ) : (
                    "-"
                  )}
                </Td>
                <Td>
                  {s.user ? (
                    <Link
                      className="text-panel-900 underline-offset-2 hover:underline"
                      to={`/usuarios/${s.user.id}`}
                    >
                      {s.user.name}
                    </Link>
                  ) : (
                    s.suggested_by
                  )}
                </Td>
                <Td>
                  <span
                    className={
                      s.status === "accepted"
                        ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
                        : "rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700"
                    }
                  >
                    {s.status === "accepted" ? "Aceptada" : "Pendiente"}
                  </span>
                </Td>
                <Td className="text-right text-gray-600">
                  {formatRelative(s.created_at)}
                </Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-2">
                    {s.status === "pending" ? (
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              `¿Aceptar la sugerencia "${s.name}"? Se creará una empresa con estos datos.`,
                            )
                          )
                            acceptMutation.mutate(s.id);
                        }}
                        disabled={acceptMutation.isPending}
                        className="text-xs font-medium text-green-600 hover:text-green-700 disabled:opacity-50"
                      >
                        Aceptar
                      </button>
                    ) : (
                      <Link
                        className="text-xs font-medium text-panel-800 hover:underline"
                        to="/empresas"
                      >
                        Ver empresa
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            `¿Denegar y eliminar la sugerencia "${s.name}"?`,
                          )
                        )
                          deleteMutation.mutate(s.id);
                      }}
                      className="text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      Denegar
                    </button>
                  </div>
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
