import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import Alert from "../components/ui/Alert";
import { Card, CardSubtitle, CardTitle } from "../components/ui/Card";
import { Table, Td, Th } from "../components/ui/Table";
import { formatDateTime } from "../lib/format";

export default function UserDevicesPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const userQuery = useQuery({
    queryKey: ["usuario", id],
    queryFn: () => api.usuarios.byId(id!),
    enabled: Boolean(id),
  });

  const devicesQuery = useQuery({
    queryKey: ["dispositivos-usuario", id],
    queryFn: () => api.dispositivos.byUserId(id!),
    enabled: Boolean(id),
  });

  const deactivateMutation = useMutation({
    mutationFn: (deviceId: string) => api.dispositivos.remove(deviceId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["dispositivos-usuario", id] }),
  });

  if (!id) {
    return (
      <Alert title="Error" variant="error">
        Falta el ID en la URL.
      </Alert>
    );
  }

  const user = userQuery.data;
  const devices = devicesQuery.data ?? [];

  return (
    <div className="space-y-4">
      <div>
        <div className="text-lg font-semibold">
          Dispositivos de {user?.name ?? "usuario"} {user?.surname ?? ""}
        </div>
        <div className="text-sm text-gray-600">{user?.email ?? "-"}</div>
      </div>

      <Card>
        <CardTitle>Dispositivos registrados</CardTitle>
        <CardSubtitle>
          Dispositivos asociados a este usuario para notificaciones push
        </CardSubtitle>

        <div className="mt-3">
          {devicesQuery.isLoading ? (
            <Alert>Cargando dispositivos…</Alert>
          ) : devicesQuery.isError ? (
            <Alert variant="error">
              No se pudieron cargar los dispositivos.
            </Alert>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Nombre</Th>
                  <Th>Plataforma</Th>
                  <Th>Device ID</Th>
                  <Th>Token</Th>
                  <Th>Estado</Th>
                  <Th>Último uso</Th>
                  <Th>Registrado</Th>
                  <Th className="text-right">Acciones</Th>
                </tr>
              </thead>
              <tbody>
                {devices.map((d) => (
                  <tr key={d.id} className="hover:bg-panel-50">
                    <Td className="font-medium">{d.deviceName ?? "-"}</Td>
                    <Td>{d.platform ?? "-"}</Td>
                    <Td className="text-xs text-gray-500">
                      {d.deviceId ?? "-"}
                    </Td>
                    <Td className="max-w-[160px] truncate text-xs text-gray-500">
                      {d.token}
                    </Td>
                    <Td>
                      <span
                        className={
                          d.active
                            ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
                            : "rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500"
                        }
                      >
                        {d.active ? "Activo" : "Inactivo"}
                      </span>
                    </Td>
                    <Td className="text-gray-600">
                      {formatDateTime(d.lastUsedAt)}
                    </Td>
                    <Td className="text-gray-600">
                      {formatDateTime(d.createdAt)}
                    </Td>
                    <Td className="text-right">
                      {d.active ? (
                        <button
                          onClick={() => {
                            if (
                              d.deviceId &&
                              confirm(
                                `¿Desactivar el dispositivo "${d.deviceName ?? d.deviceId}"?`,
                              )
                            )
                              deactivateMutation.mutate(d.deviceId);
                          }}
                          className="text-xs font-medium text-red-600 hover:text-red-700"
                        >
                          Desactivar
                        </button>
                      ) : (
                        "-"
                      )}
                    </Td>
                  </tr>
                ))}

                {devices.length === 0 ? (
                  <tr>
                    <Td className="py-8 text-center text-gray-600" colSpan={8}>
                      Sin dispositivos registrados
                    </Td>
                  </tr>
                ) : null}
              </tbody>
            </Table>
          )}
        </div>
      </Card>

      <div className="text-sm text-gray-600">
        <Link className="underline" to={`/usuarios/${id}`}>
          Volver al usuario
        </Link>
      </div>
    </div>
  );
}
