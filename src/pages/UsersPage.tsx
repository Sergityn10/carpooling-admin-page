import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
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
    u.name.toLowerCase().includes(query) ||
    (u.surname ?? "").toLowerCase().includes(query) ||
    (u.email ?? "").toLowerCase().includes(query) ||
    (u.dni ?? "").toLowerCase().includes(query)
  );
}

export default function UsersPage() {
  const [q, setQ] = useState("");

  const usuariosQuery = useQuery({
    queryKey: ["usuarios"],
    queryFn: api.usuarios.list,
  });

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
              Filtra por DNI, nombre, apellidos o email
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
              <Th>Nombre</Th>
              <Th>Email</Th>
              <Th>Rol</Th>
              <Th className="text-right">Creado</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-panel-50">
                <Td className="font-medium">
                  <Link
                    className="text-panel-900 underline-offset-2 hover:underline"
                    to={`/usuarios/${u.id}`}
                  >
                    {u.name} {u.surname ?? ""}
                  </Link>
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
              </tr>
            ))}

            {filtered.length === 0 ? (
              <tr>
                <Td className="py-8 text-center text-gray-600" colSpan={4}>
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
