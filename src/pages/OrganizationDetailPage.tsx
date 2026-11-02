import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Calendar,
  CheckCircle2,
  Edit2,
  ExternalLink,
  Globe,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  Plus,
  Trash2,
  Undo2,
  Users,
} from "lucide-react";
import clsx from "clsx";
import { api } from "../api/client";
import type { Enterprise } from "../api/types";
import Alert from "../components/ui/Alert";
import { Card, CardSubtitle, CardTitle } from "../components/ui/Card";
import Stat from "../components/ui/Stat";
import { Table, Td, Th } from "../components/ui/Table";
import { formatDateTime, formatRelative } from "../lib/format";
import OrganizationEditModal from "../components/organizations/OrganizationEditModal";
import AdminResetPasswordModal from "../components/organizations/AdminResetPasswordModal";

export default function OrganizationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetPwdModal, setShowResetPwdModal] = useState(false);

  const orgQuery = useQuery({
    queryKey: ["organizacion", id],
    queryFn: () => api.organizaciones.byId(id!),
    enabled: Boolean(id),
  });

  const softDeleteMutation = useMutation({
    mutationFn: () => api.organizaciones.softDelete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizacion", id] });
      queryClient.invalidateQueries({ queryKey: ["organizaciones"] });
      queryClient.invalidateQueries({ queryKey: ["organizaciones-metrics"] });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: () => api.organizaciones.restore(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizacion", id] });
      queryClient.invalidateQueries({ queryKey: ["organizaciones"] });
      queryClient.invalidateQueries({ queryKey: ["organizaciones-metrics"] });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (is_active: boolean) =>
      api.organizaciones.update(id!, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizacion", id] });
      queryClient.invalidateQueries({ queryKey: ["organizaciones"] });
    },
  });

  const toggleVerifiedMutation = useMutation({
    mutationFn: (verified: boolean) =>
      api.organizaciones.update(id!, { verified }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizacion", id] });
      queryClient.invalidateQueries({ queryKey: ["organizaciones"] });
    },
  });

  if (!id) {
    return <Alert variant="error">Falta el identificador de la organización en la URL.</Alert>;
  }

  if (orgQuery.isLoading) {
    return <Alert title="Cargando">Consultando ficha de la organización...</Alert>;
  }

  if (orgQuery.isError || !orgQuery.data?.enterprise) {
    return (
      <div className="space-y-4">
        <Alert variant="error" title="No encontrada">
          No se encontró la organización solicitada o hubo un problema al consultarla.
        </Alert>
        <Link to="/organizaciones" className="inline-flex items-center gap-1.5 text-sm text-panel-800 underline">
          <ArrowLeft size={16} />
          <span>Volver al listado de organizaciones</span>
        </Link>
      </div>
    );
  }

  const org = orgQuery.data.enterprise;
  const platformEvents = org.platformEvents ?? [];
  const serviceEvents = org.serviceEvents ?? [];
  const totalEvents = platformEvents.length + serviceEvents.length;

  const handleDelete = () => {
    const msg = `¿Dar de baja a la organización "${org.name}"?\n\n` +
      `Se aplicará un borrado lógico: se deshabilitará su inicio de sesión, pero se preservarán todos sus eventos, métricas de CO2 y certificados CAE.`;
    if (window.confirm(msg)) {
      softDeleteMutation.mutate();
    }
  };

  const handleRestore = () => {
    if (window.confirm(`¿Restaurar la organización "${org.name}" y reactivar su cuenta?`)) {
      restoreMutation.mutate();
    }
  };

  return (
    <div className="space-y-6">
      {/* Botón Volver */}
      <div>
        <Link
          to="/organizaciones"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Volver a Organizaciones</span>
        </Link>
      </div>

      {/* Cabecera Principal de la Entidad */}
      <div className="rounded-2xl border border-panel-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            {org.logo ? (
              <img
                src={org.logo}
                alt={org.name}
                className="h-16 w-16 rounded-2xl border border-panel-200 object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-panel-100 text-xl font-bold text-panel-800 border border-panel-200">
                {org.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{org.name}</h1>
                {org.verified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                    <BadgeCheck size={14} className="text-blue-600" />
                    Verificada
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                    Sin verificar
                  </span>
                )}

                {org.is_deleted ? (
                  <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                    En Papelera (Baja Lógica)
                  </span>
                ) : org.is_active ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    Cuenta Activa
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                    Suspendida
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-500">
                {org.cif ? (
                  <span>
                    CIF: <strong className="font-mono text-gray-800">{org.cif}</strong>
                  </span>
                ) : null}
                {org.sector ? (
                  <span className="rounded bg-panel-100 px-2 py-0.5 font-medium text-gray-700">
                    {org.sector}
                  </span>
                ) : null}
                <span>Alta: {formatRelative(org.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowEditModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-panel-200 px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-panel-50 transition-colors"
            >
              <Edit2 size={14} />
              <span>Editar</span>
            </button>

            <button
              type="button"
              onClick={() => setShowResetPwdModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/50 px-3.5 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <KeyRound size={14} />
              <span>Restablecer Clave</span>
            </button>

            {!org.is_deleted ? (
              <>
                <button
                  type="button"
                  onClick={() => toggleStatusMutation.mutate(!org.is_active)}
                  className={clsx(
                    "inline-flex items-center gap-1 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors",
                    org.is_active
                      ? "border border-amber-200 text-amber-700 hover:bg-amber-50"
                      : "border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
                  )}
                >
                  {org.is_active ? "Suspender acceso" : "Activar acceso"}
                </button>

                <button
                  type="button"
                  onClick={() => toggleVerifiedMutation.mutate(!org.verified)}
                  className="inline-flex items-center gap-1 rounded-lg border border-panel-200 px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-panel-50"
                >
                  {org.verified ? "Quitar verificación" : "Verificar"}
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                  title="Dar de baja con borrado lógico"
                >
                  <Trash2 size={14} />
                  <span>Dar de baja</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleRestore}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                <Undo2 size={14} />
                <span>Restaurar organización</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid de Estadísticas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          label="Eventos Asociados"
          value={totalEvents}
          hint="Eventos de plataforma y servicio"
        />
        <Stat
          label="Empleados / Asistentes"
          value={org.employee_count ? `${org.employee_count.toLocaleString("es-ES")} pers.` : "No especificado"}
          hint="Población corporativa estimada"
        />
        <Stat
          label="Fecha de Alta"
          value={formatDateTime(org.created_at).split(" ")[0]}
          hint={`Actualizado: ${formatRelative(org.updated_at)}`}
        />
        <Stat
          label="Rol del Sistema"
          value={org.role?.name ?? "organization (ID 3)"}
          hint="Espacio B2B dedicado"
        />
      </div>

      {/* Ficha Corporativa y de Contacto */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Datos Institucionales */}
          <Card>
            <CardTitle>Información Corporativa y Fiscal</CardTitle>
            <CardSubtitle>Datos de identidad, sede y política de movilidad</CardSubtitle>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase text-gray-400">Razón Social / Nombre</span>
                <p className="font-medium text-gray-900">{org.name}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase text-gray-400">CIF / Identificador Fiscal</span>
                <p className="font-mono font-medium text-gray-900">{org.cif || "Sin registrar"}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase text-gray-400">Sector de Actividad</span>
                <p className="font-medium text-gray-900">{org.sector || "No clasificado"}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase text-gray-400">Ubicación / Sede Principal</span>
                <p className="font-medium text-gray-900 flex items-center gap-1.5">
                  <MapPin size={15} className="text-gray-400" />
                  <span>{org.location || "No indicada"}</span>
                </p>
              </div>

              <div className="md:col-span-2 space-y-1 border-t border-panel-100 pt-3">
                <span className="text-xs font-semibold uppercase text-gray-400">Dirección Postal Completa</span>
                <p className="text-gray-700">
                  {[org.address_line1, org.address_line2, org.postal_code, org.city, org.province, org.country]
                    .filter(Boolean)
                    .join(", ") || "Dirección postal no desglosada."}
                </p>
              </div>

              <div className="md:col-span-2 space-y-1 border-t border-panel-100 pt-3">
                <span className="text-xs font-semibold uppercase text-gray-400">Descripción / Política Sostenible</span>
                <p className="text-gray-700 whitespace-pre-line text-sm leading-relaxed">
                  {org.description || "Sin descripción proporcionada."}
                </p>
              </div>
            </div>
          </Card>

          {/* Eventos de la Organización */}
          <Card>
            <div className="flex items-center justify-between pb-2 border-b border-panel-100">
              <div>
                <CardTitle>Eventos de la Organización</CardTitle>
                <CardSubtitle>{totalEvents} evento(s) en plataforma</CardSubtitle>
              </div>
              <Link
                to="/eventos"
                className="inline-flex items-center gap-1 text-xs font-semibold text-panel-800 hover:underline"
              >
                <Plus size={14} />
                <span>Crear nuevo evento</span>
              </Link>
            </div>

            <div className="mt-4">
              {platformEvents.length > 0 ? (
                <Table>
                  <thead>
                    <tr>
                      <Th>Nombre del Evento</Th>
                      <Th>Código Único</Th>
                      <Th>Fecha</Th>
                      <Th className="text-right">Acción</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {platformEvents.map((ev) => (
                      <tr key={ev.id} className="hover:bg-panel-50">
                        <Td className="font-medium">
                          <Link
                            to={`/eventos/${ev.id}`}
                            className="text-panel-900 hover:underline"
                          >
                            {ev.name}
                          </Link>
                        </Td>
                        <Td>
                          <code className="rounded bg-panel-100 px-2 py-0.5 text-xs font-mono font-semibold">
                            {ev.unique_code}
                          </code>
                        </Td>
                        <Td className="text-xs text-gray-600">
                          {ev.start_date ? formatDateTime(ev.start_date) : "Sin fecha"}
                        </Td>
                        <Td className="text-right">
                          <Link
                            to={`/eventos/${ev.id}`}
                            className="text-xs font-semibold text-panel-800 hover:underline"
                          >
                            Ver evento →
                          </Link>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="py-8 text-center text-sm text-gray-500">
                  <Calendar size={28} className="mx-auto text-gray-300 mb-1" />
                  Esta organización no tiene eventos de plataforma asociados actualmente.
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar: Canales de Contacto */}
        <div className="space-y-6">
          <Card>
            <CardTitle>Canales de Contacto</CardTitle>
            <CardSubtitle>Vías de comunicación directa</CardSubtitle>

            <div className="mt-4 space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-panel-100 text-panel-800">
                  <Mail size={16} />
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Correo corporativo</span>
                  <a href={`mailto:${org.email}`} className="font-medium text-panel-900 hover:underline">
                    {org.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-panel-100 text-panel-800">
                  <Phone size={16} />
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Teléfono</span>
                  {org.phone ? (
                    <a href={`tel:${org.phone}`} className="font-medium text-gray-900 hover:underline">
                      {org.phone}
                    </a>
                  ) : (
                    <span className="text-gray-400">No especificado</span>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-panel-100 text-panel-800">
                  <Users size={16} />
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Persona de contacto</span>
                  <span className="font-medium text-gray-900">
                    {org.contact_person || "No asignada"}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-panel-100 text-panel-800">
                  <Globe size={16} />
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Sitio Web</span>
                  {org.website ? (
                    <a
                      href={org.website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-panel-800 hover:underline"
                    >
                      <span>Visitar portal</span>
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span className="text-gray-400">No especificado</span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Modales */}
      <OrganizationEditModal
        enterprise={org}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ["organizacion", id] })}
      />

      <AdminResetPasswordModal
        enterprise={org}
        isOpen={showResetPwdModal}
        onClose={() => setShowResetPwdModal(false)}
      />
    </div>
  );
}
