import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  BadgeCheck,
  Building2,
  Calendar,
  CheckCircle2,
  Edit2,
  KeyRound,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Undo2,
} from "lucide-react";
import clsx from "clsx";
import { api } from "../api/client";
import type { Enterprise } from "../api/types";
import Alert from "../components/ui/Alert";
import { Card, CardSubtitle, CardTitle } from "../components/ui/Card";
import Input from "../components/ui/Input";
import Stat from "../components/ui/Stat";
import { Table, Td, Th } from "../components/ui/Table";
import { formatRelative } from "../lib/format";
import OrganizationCreateModal from "../components/organizations/OrganizationCreateModal";
import OrganizationEditModal from "../components/organizations/OrganizationEditModal";
import AdminResetPasswordModal from "../components/organizations/AdminResetPasswordModal";

const PAGE_SIZE = 15;

export default function OrganizationsPage() {
  const queryClient = useQueryClient();

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEnterprise, setEditingEnterprise] = useState<Enterprise | null>(null);
  const [resetPwdEnterprise, setResetPwdEnterprise] = useState<Enterprise | null>(null);

  // Queries
  const metricsQuery = useQuery({
    queryKey: ["organizaciones-metrics"],
    queryFn: () => api.organizaciones.metrics(),
  });

  const organizationsQuery = useQuery({
    queryKey: ["organizaciones", statusFilter, q, page],
    queryFn: () =>
      api.organizaciones.list({
        search: q.trim() || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        includeDeleted: statusFilter === "deleted" || statusFilter === "all",
        page,
        limit: PAGE_SIZE,
      }),
  });

  // Mutations
  const softDeleteMutation = useMutation({
    mutationFn: (id: string) => api.organizaciones.softDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizaciones"] });
      queryClient.invalidateQueries({ queryKey: ["organizaciones-metrics"] });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => api.organizaciones.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizaciones"] });
      queryClient.invalidateQueries({ queryKey: ["organizaciones-metrics"] });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      api.organizaciones.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizaciones"] });
      queryClient.invalidateQueries({ queryKey: ["organizaciones-metrics"] });
    },
  });

  const toggleVerifiedMutation = useMutation({
    mutationFn: ({ id, verified }: { id: string; verified: boolean }) =>
      api.organizaciones.update(id, { verified }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizaciones"] });
      queryClient.invalidateQueries({ queryKey: ["organizaciones-metrics"] });
    },
  });

  const enterprises = organizationsQuery.data?.enterprises ?? [];
  const pagination = organizationsQuery.data?.pagination;
  const total = pagination?.total ?? 0;
  const totalPages = pagination?.totalPages ?? Math.max(1, Math.ceil(total / PAGE_SIZE));
  const metrics = metricsQuery.data?.metrics;

  const handleDelete = (enterprise: Enterprise) => {
    const msg = `¿Dar de baja a la organización "${enterprise.name}"?\n\n` +
      `Se aplicará un borrado lógico: se deshabilitará su inicio de sesión, pero se preservarán todos sus eventos, métricas de CO2 y certificados CAE.`;
    if (window.confirm(msg)) {
      softDeleteMutation.mutate(enterprise.id);
    }
  };

  const handleRestore = (enterprise: Enterprise) => {
    if (window.confirm(`¿Restaurar la organización "${enterprise.name}" y reactivar su cuenta?`)) {
      restoreMutation.mutate(enterprise.id);
    }
  };

  return (
    <div className="space-y-5">
      {/* Cabecera Principal */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">Organizaciones</h1>
            <span className="rounded-full bg-panel-100 px-2.5 py-0.5 text-xs font-semibold text-panel-800">
              B2B Corporativo
            </span>
          </div>
          <p className="text-sm text-gray-600">
            Administración de entidades colaboradoras, empresas, universidades y organizadores de eventos
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-panel-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-panel-900 transition-colors"
        >
          <Plus size={18} />
          <span>Nueva Organización</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat
          label="Total Organizaciones"
          value={metrics?.totalEnterprises ?? "—"}
          hint="Entidades en la plataforma"
        />
        <Stat
          label="Activas"
          value={
            metrics ? (
              <span className="text-emerald-600">{metrics.activeEnterprises}</span>
            ) : (
              "—"
            )
          }
          hint="Con acceso habilitado"
        />
        <Stat
          label="Verificadas"
          value={
            metrics ? (
              <span className="text-blue-600">{metrics.verifiedEnterprises}</span>
            ) : (
              "—"
            )
          }
          hint="Distintivo oficial activo"
        />
        <Stat
          label="En Papelera"
          value={
            metrics ? (
              <span className="text-red-500">{metrics.deletedEnterprises}</span>
            ) : (
              "—"
            )
          }
          hint="Bajas lógicas protegidas"
        />
        <Stat
          label="Eventos Creados"
          value={
            metrics ? (
              <span className="text-panel-900">{metrics.totalEventsByEnterprises}</span>
            ) : (
              "—"
            )
          }
          hint="Eventos B2B asociados"
        />
      </div>

      {/* Filtros y Buscador */}
      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Search size={18} className="text-gray-400" />
            <div className="w-80 max-w-full">
              <Input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Buscar por nombre, CIF, email, ciudad..."
              />
            </div>
          </div>

          {/* Filtro de Estado */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "all", label: "Todas" },
              { id: "active", label: "Activas" },
              { id: "inactive", label: "Inactivas" },
              { id: "verified", label: "Verificadas" },
              { id: "deleted", label: "Papelera" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(1);
                }}
                className={clsx(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  statusFilter === tab.id
                    ? "bg-panel-800 text-white shadow-sm"
                    : "bg-panel-50 text-gray-700 hover:bg-panel-100",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Alertas de Carga y Error */}
      {organizationsQuery.isLoading ? (
        <Alert title="Cargando">Consultando organizaciones en la base de datos...</Alert>
      ) : null}
      {organizationsQuery.isError ? (
        <Alert title="Error" variant="error">
          No se pudieron cargar las organizaciones. Verifica la conexión con el servicio de usuarios.
        </Alert>
      ) : null}

      {/* Tabla de Resultados */}
      {!organizationsQuery.isLoading && !organizationsQuery.isError ? (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Organización</Th>
                <Th>CIF / NIF</Th>
                <Th>Contacto</Th>
                <Th>Sede</Th>
                <Th className="text-center">Eventos</Th>
                <Th className="text-center">Verificación</Th>
                <Th className="text-center">Estado</Th>
                <Th className="text-right">Acciones</Th>
              </tr>
            </thead>
            <tbody>
              {enterprises.map((e) => {
                const totalEvents =
                  e.platformEventsCount ?? e._count?.platformEvents ?? 0;
                return (
                  <tr
                    key={e.id}
                    className={clsx(
                      "hover:bg-panel-50/80 transition-colors",
                      e.is_deleted && "bg-red-50/30 opacity-80",
                    )}
                  >
                    {/* Logo & Nombre */}
                    <Td>
                      <div className="flex items-center gap-3">
                        {e.logo ? (
                          <img
                            src={e.logo}
                            alt=""
                            className="h-10 w-10 rounded-xl border border-panel-200 object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-panel-100 text-sm font-bold text-panel-800 border border-panel-200">
                            {e.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <Link
                            to={`/organizaciones/${e.id}`}
                            className="font-semibold text-gray-900 hover:text-panel-900 hover:underline"
                          >
                            {e.name}
                          </Link>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {e.sector ? (
                              <span className="rounded bg-panel-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-700">
                                {e.sector}
                              </span>
                            ) : null}
                            {e.website ? (
                              <a
                                href={e.website}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-panel-700 underline"
                              >
                                Web
                              </a>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </Td>

                    {/* CIF */}
                    <Td>
                      {e.cif ? (
                        <code className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono font-semibold text-gray-800">
                          {e.cif}
                        </code>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </Td>

                    {/* Contacto */}
                    <Td>
                      <div className="text-xs space-y-0.5">
                        <div className="font-medium text-gray-900">{e.email}</div>
                        {e.phone ? (
                          <div className="text-gray-500">{e.phone}</div>
                        ) : null}
                        {e.contact_person ? (
                          <div className="text-gray-400 italic">{e.contact_person}</div>
                        ) : null}
                      </div>
                    </Td>

                    {/* Sede */}
                    <Td>
                      <div className="text-xs text-gray-700">
                        {e.city ? `${e.city}${e.province ? ` (${e.province})` : ""}` : e.location ?? "—"}
                      </div>
                    </Td>

                    {/* Eventos */}
                    <Td className="text-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-100">
                        <Calendar size={12} />
                        {totalEvents}
                      </span>
                    </Td>

                    {/* Verificación */}
                    <Td className="text-center">
                      <button
                        type="button"
                        onClick={() =>
                          toggleVerifiedMutation.mutate({
                            id: e.id,
                            verified: !e.verified,
                          })
                        }
                        title={e.verified ? "Quitar verificación" : "Marcar como verificada"}
                        className="inline-flex items-center transition-transform hover:scale-105"
                      >
                        {e.verified ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                            <BadgeCheck size={13} className="text-blue-600" />
                            Verificada
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500 hover:bg-gray-200">
                            Sin verificar
                          </span>
                        )}
                      </button>
                    </Td>

                    {/* Estado */}
                    <Td className="text-center">
                      {e.is_deleted ? (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                          En Papelera
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            toggleStatusMutation.mutate({
                              id: e.id,
                              is_active: !e.is_active,
                            })
                          }
                          title={e.is_active ? "Suspender acceso" : "Activar acceso"}
                          className="inline-flex items-center transition-transform hover:scale-105"
                        >
                          {e.is_active ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                              <CheckCircle2 size={12} className="text-emerald-600" />
                              Activa
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                              Suspendida
                            </span>
                          )}
                        </button>
                      )}
                    </Td>

                    {/* Acciones */}
                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/organizaciones/${e.id}`}
                          className="rounded-lg p-1.5 text-gray-600 hover:bg-panel-100 hover:text-panel-900"
                          title="Ver ficha 360°"
                        >
                          <Building2 size={15} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setEditingEnterprise(e)}
                          className="rounded-lg p-1.5 text-gray-600 hover:bg-panel-100 hover:text-panel-900"
                          title="Editar organización"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setResetPwdEnterprise(e)}
                          className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50"
                          title="Restablecer contraseña"
                        >
                          <KeyRound size={15} />
                        </button>

                        {e.is_deleted ? (
                          <button
                            type="button"
                            onClick={() => handleRestore(e)}
                            className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50"
                            title="Restaurar de la papelera"
                          >
                            <Undo2 size={15} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDelete(e)}
                            className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                            title="Dar de baja (borrado lógico)"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </Td>
                  </tr>
                );
              })}

              {enterprises.length === 0 ? (
                <tr>
                  <Td className="py-12 text-center text-gray-500" colSpan={8}>
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Building2 size={32} className="text-gray-300" />
                      <p className="text-sm font-medium">No se encontraron organizaciones</p>
                      <p className="text-xs text-gray-400">
                        {q || statusFilter !== "all"
                          ? "Prueba a modificar los filtros o el término de búsqueda"
                          : "Comienza dando de alta la primera organización colaboradora"}
                      </p>
                    </div>
                  </Td>
                </tr>
              ) : null}
            </tbody>
          </Table>

          {/* Barra de Paginación */}
          {totalPages > 1 ? (
            <div className="flex items-center justify-between text-sm pt-2">
              <span className="text-gray-600">
                {total} organizaciones encontradas · Página {page} de {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-lg border border-panel-200 px-3 py-1.5 text-sm hover:bg-panel-50 disabled:opacity-40"
                >
                  ← Anterior
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded-lg border border-panel-200 px-3 py-1.5 text-sm hover:bg-panel-50 disabled:opacity-40"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {/* Modales */}
      <OrganizationCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {editingEnterprise ? (
        <OrganizationEditModal
          enterprise={editingEnterprise}
          isOpen={Boolean(editingEnterprise)}
          onClose={() => setEditingEnterprise(null)}
        />
      ) : null}

      {resetPwdEnterprise ? (
        <AdminResetPasswordModal
          enterprise={resetPwdEnterprise}
          isOpen={Boolean(resetPwdEnterprise)}
          onClose={() => setResetPwdEnterprise(null)}
        />
      ) : null}
    </div>
  );
}
