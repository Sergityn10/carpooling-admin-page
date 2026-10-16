import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import clsx from "clsx";
import { api } from "../api/client";
import type { Usuario } from "../api/types";
import Alert from "../components/ui/Alert";
import { Card, CardSubtitle, CardTitle } from "../components/ui/Card";
import Input from "../components/ui/Input";
import { Table, Td, Th } from "../components/ui/Table";
import { formatRelative } from "../lib/format";

function matchesUser(u: Usuario, q: string) {
  const query = q.trim().toLowerCase();
  if (!query) return true;
  return (
    (u.name ?? "").toLowerCase().includes(query) ||
    (u.surname ?? "").toLowerCase().includes(query) ||
    (u.email ?? "").toLowerCase().includes(query) ||
    (u.dni ?? "").toLowerCase().includes(query) ||
    String(u.id).includes(query)
  );
}

export default function UsersPage() {
  const [q, setQ] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const usuariosQuery = useQuery({
    queryKey: ["usuarios"],
    queryFn: api.usuarios.list,
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string | number) => api.usuarios.delete(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    },
    onError: (err: Error) => {
      setDeleteError(err.message || "No se pudo eliminar el usuario.");
    },
  });

  const handleDeleteUser = (e: React.MouseEvent, u: Usuario) => {
    e.stopPropagation();
    const displayName =
      [u.name, u.surname].filter(Boolean).join(" ").trim() ||
      u.email ||
      `Usuario #${u.id}`;
    if (
      confirm(
        `¿Eliminar a "${displayName}"? Esta acción no se puede deshacer.`,
      )
    ) {
      setDeleteError(null);
      deleteMutation.mutate(u.id);
    }
  };

  const filtered = useMemo(() => {
    const arr = (usuariosQuery.data ?? []) as Usuario[];
    return arr.filter((u) => matchesUser(u, q));
  }, [usuariosQuery.data, q]);

  return (
    <div className="space-y-4">
      <div>
        <div className="text-lg font-semibold">Usuarios</div>
        <div className="text-sm text-gray-600">
          Listado de usuarios registrados
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Buscar</CardTitle>
            <CardSubtitle>
              Filtra por DNI, nombre, apellidos, email o ID
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

      {deleteError ? (
        <Alert title="Error al eliminar" variant="error">
          {deleteError}
        </Alert>
      ) : null}

      {usuariosQuery.isLoading ? (
        <Alert title="Cargando">Cargando usuarios…</Alert>
      ) : null}

      {usuariosQuery.isError ? (
        <Alert title="Error" variant="error">
          No se pudieron cargar los usuarios.
        </Alert>
      ) : null}

      {!usuariosQuery.isLoading && !usuariosQuery.isError ? (
        <Table>
          <thead>
            <tr>
              <Th>Usuario</Th>
              <Th>Email</Th>
              <Th>Rol</Th>
              <Th className="text-right">Creado</Th>
              <Th className="text-right">Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const fullName = [u.name, u.surname].filter(Boolean).join(" ").trim();
              const initial = ((fullName || u.email || "U")[0] || "U").toUpperCase();

              return (
                <tr
                  key={u.id}
                  onClick={() => navigate(`/usuarios/${u.id}`)}
                  className="cursor-pointer hover:bg-panel-50 transition-colors"
                >
                  <Td className="font-medium">
                    <div className="flex items-center gap-3">
                      {u.img_perfil ? (
                        <img
                          src={u.img_perfil}
                          alt=""
                          className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-panel-200 text-xs font-semibold text-panel-800">
                          {initial}
                        </div>
                      )}
                      <div className="min-w-0">
                        <Link
                          to={`/usuarios/${u.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-panel-900 underline-offset-2 hover:underline"
                        >
                          {fullName ? (
                            <span>{fullName}</span>
                          ) : (
                            <span className="italic text-gray-500">
                              Sin nombre {u.email ? `(${u.email})` : `(#${u.id})`}
                            </span>
                          )}
                        </Link>
                        {u.dni ? (
                          <div className="text-xs font-normal text-gray-500">
                            DNI: {u.dni}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </Td>
                  <Td>{u.email ?? "-"}</Td>
                  <Td>
                    <span
                      className={clsx(
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                        u.role === "admin"
                          ? "bg-red-100 text-red-700"
                          : u.role === "enterprise"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700",
                      )}
                    >
                      {u.role ?? "user"}
                    </span>
                  </Td>
                  <Td className="text-right text-gray-600">
                    {formatRelative(u.created_at)}
                  </Td>
                  <Td className="text-right">
                    <button
                      type="button"
                      onClick={(e) => handleDeleteUser(e, u)}
                      disabled={
                        deleteMutation.isPending &&
                        deleteMutation.variables === u.id
                      }
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 transition-colors"
                      title="Eliminar usuario"
                    >
                      <Trash2 size={14} />
                      <span>
                        {deleteMutation.isPending &&
                        deleteMutation.variables === u.id
                          ? "Eliminando…"
                          : "Eliminar"}
                      </span>
                    </button>
                  </Td>
                </tr>
              );
            })}

            {filtered.length === 0 ? (
              <tr>
                <Td className="py-8 text-center text-gray-600" colSpan={5}>
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
