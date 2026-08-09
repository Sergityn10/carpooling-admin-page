import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { api } from "../api/client";
import Alert from "../components/ui/Alert";
import { Card, CardSubtitle, CardTitle } from "../components/ui/Card";
import Stat from "../components/ui/Stat";
import { Table, Td, Th } from "../components/ui/Table";
import { formatDateTime } from "../lib/format";

export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const userInfoQuery = useQuery({
    queryKey: ["usuario-info", id],
    queryFn: () => api.usuarios.info(id!),
    enabled: Boolean(id),
  });

  const userQuery = useQuery({
    queryKey: ["usuario", id],
    queryFn: () => api.usuarios.byId(id!),
    enabled: Boolean(id),
  });

  const trayectosQuery = useQuery({
    queryKey: ["trayectos-conductor", id],
    queryFn: () => api.viajes.byConductor(id!),
    enabled: Boolean(id),
  });

  const devicesQuery = useQuery({
    queryKey: ["dispositivos-usuario", id],
    queryFn: () => api.dispositivos.byUserId(id!),
    enabled: Boolean(id),
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string | number) => api.usuarios.delete(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      navigate("/usuarios");
    },
    onError: (err: Error) => setDeleteError(err.message),
  });

  if (!id) {
    return (
      <Alert title="Error" variant="error">
        Falta el ID en la URL.
      </Alert>
    );
  }

  const info = userInfoQuery.data?.data;
  const user = userQuery.data;
  const trayectos = trayectosQuery.data ?? [];

  return (
    <div className="space-y-4">
      <div>
        <div className="text-lg font-semibold">
          {user?.name ?? "Usuario"} {user?.surname ?? ""}
        </div>
        <div className="text-sm text-gray-600">{user?.email ?? "-"}</div>
      </div>

      {deleteError ? (
        <Alert title="Error" variant="error">
          {deleteError}
        </Alert>
      ) : null}

      {userInfoQuery.isLoading ? (
        <Alert title="Cargando">Cargando información…</Alert>
      ) : null}
      {userInfoQuery.isError ? (
        <Alert title="Error" variant="error">
          No se pudo cargar la información del usuario.
        </Alert>
      ) : null}

      {info ? (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <Stat label="Viajes" value={info.viajes ?? 0} />
            <Stat
              label="Valoración media"
              value={info.averageRating?.toFixed(1) ?? "-"}
            />
            <Stat label="Opiniones recibidas" value={info.numOpinions ?? 0} />
            <Stat label="Rol" value={info.role ?? user?.role ?? "user"} />
          </div>

          <Card>
            <CardTitle>Información de contacto</CardTitle>
            <CardSubtitle>Datos del usuario</CardSubtitle>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Teléfono:</span>{" "}
                {info.phone ?? "-"}
              </div>
              <div>
                <span className="text-gray-500">DNI:</span> {user?.dni ?? "-"}
              </div>
              <div>
                <span className="text-gray-500">Teléfono:</span>{" "}
                {user?.phone ?? "-"}
              </div>
            </div>
          </Card>
        </>
      ) : null}

      <Card>
        <CardTitle>Trayectos como conductor</CardTitle>
        <CardSubtitle>Viajes publicados por este usuario</CardSubtitle>

        <div className="mt-3">
          {trayectosQuery.isLoading ? <Alert>Cargando trayectos…</Alert> : null}
          {trayectosQuery.isError ? (
            <Alert variant="error">No se pudieron cargar los trayectos.</Alert>
          ) : null}

          {!trayectosQuery.isLoading && !trayectosQuery.isError ? (
            <Table>
              <thead>
                <tr>
                  <Th>Origen</Th>
                  <Th>Destino</Th>
                  <Th>Fecha</Th>
                  <Th className="text-right">Plazas</Th>
                  <Th className="text-right">Precio</Th>
                </tr>
              </thead>
              <tbody>
                {trayectos.slice(0, 20).map((t) => (
                  <tr key={t.id} className="hover:bg-panel-50">
                    <Td className="font-medium">
                      <Link className="hover:underline" to={`/viajes/${t.id}`}>
                        {t.origen}
                      </Link>
                    </Td>
                    <Td>{t.destino}</Td>
                    <Td>{formatDateTime(t.hora)}</Td>
                    <Td className="text-right">
                      {t.disponible}/{t.plazas}
                    </Td>
                    <Td className="text-right">{t.precio}€</Td>
                  </tr>
                ))}

                {trayectos.length === 0 ? (
                  <tr>
                    <Td colSpan={5} className="py-8 text-center text-gray-600">
                      Sin trayectos
                    </Td>
                  </tr>
                ) : null}
              </tbody>
            </Table>
          ) : null}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Dispositivos</CardTitle>
            <CardSubtitle>
              Dispositivos registrados para notificaciones push
            </CardSubtitle>
          </div>
          <Link
            to={`/usuarios/${id}/dispositivos`}
            className="rounded-lg bg-panel-800 px-3 py-2 text-sm font-medium text-white hover:bg-panel-900"
          >
            Ver dispositivos
          </Link>
        </div>
        <div className="mt-3">
          {devicesQuery.isLoading ? (
            <Alert>Cargando dispositivos…</Alert>
          ) : devicesQuery.isError ? (
            <Alert variant="error">
              No se pudieron cargar los dispositivos.
            </Alert>
          ) : (
            <div className="text-sm text-gray-600">
              {devicesQuery.data?.length ?? 0} dispositivo(s) activo(s)
            </div>
          )}
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          <Link className="underline" to="/usuarios">
            Volver a usuarios
          </Link>
        </div>
        <button
          onClick={() => {
            if (
              confirm(
                `¿Eliminar a ${user?.name ?? "este usuario"} ${user?.surname ?? ""}? Esta acción no se puede deshacer.`,
              )
            ) {
              setDeleteError(null);
              deleteMutation.mutate(id!);
            }
          }}
          disabled={deleteMutation.isPending}
          className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          <Trash2 size={16} />
          {deleteMutation.isPending ? "Eliminando…" : "Eliminar usuario"}
        </button>
      </div>
    </div>
  );
}
