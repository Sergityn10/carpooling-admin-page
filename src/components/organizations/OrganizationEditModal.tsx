import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { api } from "../../api/client";
import type { Enterprise, EnterpriseUpdateInput } from "../../api/types";
import Alert from "../ui/Alert";
import ImageInput from "../ui/ImageInput";
import Input from "../ui/Input";

const SECTOR_OPTIONS = [
  "Empresa Privada / Corporación",
  "Universidad / Centro Educativo",
  "Evento / Festival / Congreso",
  "Polígono Industrial / Parque Empresarial",
  "Sanidad / Hospitalario",
  "Entidad Pública / Ayuntamiento",
  "Asociación / ONG",
  "Otro",
];

type Props = {
  enterprise: Enterprise;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

export default function OrganizationEditModal({
  enterprise,
  isOpen,
  onClose,
  onSaved,
}: Props) {
  const queryClient = useQueryClient();

  const [form, setForm] = useState<EnterpriseUpdateInput>({
    name: enterprise.name,
    email: enterprise.email,
    description: enterprise.description ?? "",
    location: enterprise.location ?? "",
    phone: enterprise.phone ?? "",
    cif: enterprise.cif ?? "",
    website: enterprise.website ?? "",
    logo: enterprise.logo ?? "",
    contact_person: enterprise.contact_person ?? "",
    sector: enterprise.sector ?? "Empresa Privada / Corporación",
    employee_count: enterprise.employee_count ?? undefined,
    address_line1: enterprise.address_line1 ?? "",
    address_line2: enterprise.address_line2 ?? "",
    city: enterprise.city ?? "",
    province: enterprise.province ?? "",
    postal_code: enterprise.postal_code ?? "",
    country: enterprise.country ?? "ES",
    verified: enterprise.verified,
    is_active: enterprise.is_active,
  });

  const [error, setError] = useState<string | null>(null);

  const updateMutation = useMutation({
    mutationFn: (data: EnterpriseUpdateInput) =>
      api.organizaciones.update(enterprise.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizaciones"] });
      queryClient.invalidateQueries({ queryKey: ["organizaciones-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["organizacion", enterprise.id] });
      if (onSaved) onSaved();
      onClose();
    },
    onError: (err: any) => {
      const msg = err?.body?.message || err?.message || "Error al actualizar la organización.";
      setError(typeof msg === "object" ? JSON.stringify(msg) : msg);
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    updateMutation.mutate({
      name: form.name?.trim(),
      email: form.email?.trim().toLowerCase(),
      description: form.description?.trim(),
      location: form.location?.trim(),
      phone: form.phone?.trim() || undefined,
      cif: form.cif?.trim().toUpperCase() || undefined,
      website: form.website?.trim() || undefined,
      logo: form.logo ?? undefined,
      contact_person: form.contact_person?.trim() || undefined,
      sector: form.sector || undefined,
      employee_count: form.employee_count ? Number(form.employee_count) : undefined,
      address_line1: form.address_line1?.trim() || undefined,
      address_line2: form.address_line2?.trim() || undefined,
      city: form.city?.trim() || undefined,
      province: form.province?.trim() || undefined,
      postal_code: form.postal_code?.trim() || undefined,
      country: form.country || "ES",
      verified: form.verified,
      is_active: form.is_active,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        >
          <X size={20} />
        </button>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Editar Organización: {enterprise.name}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Modifica la información corporativa, fiscal y los permisos de acceso.
            </p>
          </div>

          {error ? <Alert variant="error">{error}</Alert> : null}

          {/* Bloque 1: Identidad Corporativa */}
          <div className="rounded-xl border border-panel-200 bg-panel-50/60 p-4 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-panel-900">
              1. Identidad Corporativa
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-gray-700">Nombre de la organización</label>
                <Input
                  value={form.name ?? ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Email corporativo de acceso</label>
                <Input
                  type="email"
                  value={form.email ?? ""}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Ubicación / Sede principal</label>
                <Input
                  value={form.location ?? ""}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-gray-700">Descripción / Política</label>
                <textarea
                  rows={2}
                  value={form.description ?? ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-lg border border-panel-200 bg-white px-3 py-2 text-sm focus:border-panel-800 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Bloque 2: Datos Fiscales y Contacto */}
          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              2. Datos Fiscales y de Contacto
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600">CIF / NIF</label>
                <Input
                  value={form.cif ?? ""}
                  onChange={(e) => setForm({ ...form, cif: e.target.value })}
                  placeholder="B12345678"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Persona de contacto</label>
                <Input
                  value={form.contact_person ?? ""}
                  onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                  placeholder="Nombre y cargo"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Teléfono</label>
                <Input
                  value={form.phone ?? ""}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+34 600 000 000"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Sitio Web</label>
                <Input
                  value={form.website ?? ""}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://empresa.com"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Sector de actividad</label>
                <select
                  value={form.sector ?? ""}
                  onChange={(e) => setForm({ ...form, sector: e.target.value })}
                  className="w-full rounded-lg border border-panel-200 bg-white px-3 py-2 text-sm"
                >
                  {SECTOR_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Nº Empleados estimados</label>
                <Input
                  type="number"
                  value={form.employee_count ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      employee_count: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="Ej. 150"
                />
              </div>
            </div>

            {/* Dirección Postal */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-gray-600">Dirección postal</label>
                <Input
                  value={form.address_line1 ?? ""}
                  onChange={(e) => setForm({ ...form, address_line1: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Ciudad</label>
                <Input
                  value={form.city ?? ""}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Provincia / C.P.</label>
                <div className="flex gap-2">
                  <Input
                    value={form.province ?? ""}
                    onChange={(e) => setForm({ ...form, province: e.target.value })}
                  />
                  <Input
                    value={form.postal_code ?? ""}
                    onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                    className="w-20"
                  />
                </div>
              </div>
            </div>

            {/* Logotipo */}
            <div className="pt-2">
              <ImageInput
                label="Logotipo institucional"
                value={form.logo}
                onChange={(val) => setForm({ ...form, logo: val ?? undefined })}
              />
            </div>

            {/* Estados y Verificación */}
            <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-panel-200">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active ?? true}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-panel-800"
                />
                <span>Cuenta activa (Permite inicio de sesión)</span>
              </label>

              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.verified ?? false}
                  onChange={(e) => setForm({ ...form, verified: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                <span>Verificada oficialmente (Badge azul de confianza)</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-panel-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-panel-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-panel-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="rounded-lg bg-panel-800 px-5 py-2 text-sm font-medium text-white hover:bg-panel-900 disabled:opacity-50"
            >
              {updateMutation.isPending ? "Guardando cambios..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
