import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, ExternalLink, KeyRound, X } from "lucide-react";
import { api } from "../../api/client";
import type { Enterprise, EnterpriseCreateInput } from "../../api/types";
import Alert from "../ui/Alert";
import ImageInput from "../ui/ImageInput";
import Input from "../ui/Input";

function generateSecurePassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%&*_-";

  let pass = "";
  // Ensure at least one of each category
  pass += upper.charAt(Math.floor(Math.random() * upper.length));
  pass += lower.charAt(Math.floor(Math.random() * lower.length));
  pass += digits.charAt(Math.floor(Math.random() * digits.length));
  pass += symbols.charAt(Math.floor(Math.random() * symbols.length));

  const allChars = upper + lower + digits + symbols;
  for (let i = 4; i < 12; i++) {
    pass += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  // Shuffle characters
  return pass
    .split("")
    .sort(() => 0.5 - Math.random())
    .join("");
}

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
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (created: Enterprise) => void;
};

export default function OrganizationCreateModal({ isOpen, onClose, onSuccess }: Props) {
  const queryClient = useQueryClient();

  const [form, setForm] = useState<EnterpriseCreateInput>({
    name: "",
    email: "",
    password: "",
    description: "",
    location: "",
    phone: "",
    cif: "",
    website: "",
    logo: "",
    contact_person: "",
    sector: "Empresa Privada / Corporación",
    employee_count: undefined,
    address_line1: "",
    address_line2: "",
    city: "",
    province: "",
    postal_code: "",
    country: "ES",
    verified: false,
    is_active: true,
  });

  const [error, setError] = useState<string | null>(null);
  const [createdResult, setCreatedResult] = useState<{
    enterprise: Enterprise;
    rawPassword: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const createMutation = useMutation({
    mutationFn: (data: EnterpriseCreateInput) => api.organizaciones.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["organizaciones"] });
      queryClient.invalidateQueries({ queryKey: ["organizaciones-metrics"] });
      setCreatedResult({
        enterprise: res.enterprise,
        rawPassword: form.password,
      });
      if (onSuccess) onSuccess(res.enterprise);
    },
    onError: (err: any) => {
      const msg = err?.body?.message || err?.message || "No se pudo crear la organización.";
      setError(typeof msg === "object" ? JSON.stringify(msg) : msg);
    },
  });

  if (!isOpen) return null;

  const handleGeneratePassword = () => {
    const pwd = generateSecurePassword();
    setForm((prev) => ({ ...prev, password: pwd }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("El nombre de la organización es obligatorio.");
      return;
    }
    if (!form.email.trim()) {
      setError("El correo electrónico corporativo es obligatorio.");
      return;
    }
    if (!form.password || form.password.length < 8) {
      setError("La contraseña es obligatoria y debe tener un mínimo de 8 caracteres.");
      return;
    }
    if (!form.description.trim()) {
      setError("La descripción o actividad principal es obligatoria.");
      return;
    }
    if (!form.location.trim()) {
      setError("La ubicación o sede principal es obligatoria.");
      return;
    }

    createMutation.mutate({
      ...form,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      description: form.description.trim(),
      location: form.location.trim(),
      phone: form.phone?.trim() || undefined,
      cif: form.cif?.trim().toUpperCase() || undefined,
      website: form.website?.trim() || undefined,
      contact_person: form.contact_person?.trim() || undefined,
      sector: form.sector || undefined,
      employee_count: form.employee_count ? Number(form.employee_count) : undefined,
      address_line1: form.address_line1?.trim() || undefined,
      address_line2: form.address_line2?.trim() || undefined,
      city: form.city?.trim() || undefined,
      province: form.province?.trim() || undefined,
      postal_code: form.postal_code?.trim() || undefined,
      country: form.country || "ES",
    });
  };

  const handleCopyCredentials = () => {
    if (!createdResult) return;
    const { enterprise, rawPassword } = createdResult;
    const text = [
      `Bienvenido a YouConnext (Portal de Organizaciones)`,
      `──────────────────────────────────────────────────`,
      `Entidad: ${enterprise.name}`,
      `Email de acceso: ${enterprise.email}`,
      `Contraseña provisional: ${rawPassword}`,
      `Acceso al portal: ${window.location.origin}`,
      `──────────────────────────────────────────────────`,
      `Por favor, cambie su contraseña tras el primer inicio de sesión.`,
    ].join("\n");

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleResetForm = () => {
    setCreatedResult(null);
    setForm({
      name: "",
      email: "",
      password: "",
      description: "",
      location: "",
      phone: "",
      cif: "",
      website: "",
      logo: "",
      contact_person: "",
      sector: "Empresa Privada / Corporación",
      employee_count: undefined,
      address_line1: "",
      address_line2: "",
      city: "",
      province: "",
      postal_code: "",
      country: "ES",
      verified: false,
      is_active: true,
    });
    setError(null);
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

        {createdResult ? (
          <div className="space-y-5 py-2">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <Check size={28} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  ¡Organización creada con éxito!
                </h3>
                <p className="text-sm text-gray-600">
                  La entidad ha sido dada de alta en el sistema con rol de Organización.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-panel-200 bg-panel-50 p-4 space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Credenciales de acceso iniciales
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Organización:</span>{" "}
                  <strong className="text-gray-900">{createdResult.enterprise.name}</strong>
                </div>
                <div>
                  <span className="text-gray-500">Email:</span>{" "}
                  <strong className="text-gray-900">{createdResult.enterprise.email}</strong>
                </div>
                <div className="md:col-span-2">
                  <span className="text-gray-500">Contraseña temporal:</span>{" "}
                  <span className="font-mono font-bold text-panel-900 bg-white px-2 py-0.5 rounded border border-panel-200">
                    {createdResult.rawPassword}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="inline-flex items-center gap-2 rounded-lg bg-panel-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-panel-900 transition-colors"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                <span>{copied ? "¡Credenciales copiadas!" : "Copiar credenciales de acceso"}</span>
              </button>

              <a
                href={`/organizaciones/${createdResult.enterprise.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-panel-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-panel-50 transition-colors"
              >
                <span>Ver ficha 360°</span>
                <ExternalLink size={16} />
              </a>

              <button
                type="button"
                onClick={handleResetForm}
                className="rounded-lg px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Crear otra organización
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Alta Asistida de Organización
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Registra una empresa o entidad colaboradora con acceso al portal corporativo. Los campos con (*) son obligatorios.
              </p>
            </div>

            {error ? <Alert variant="error">{error}</Alert> : null}

            {/* Bloque 1: Identidad Corporativa Obligatoria */}
            <div className="rounded-xl border border-panel-200 bg-panel-50/60 p-4 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-panel-900">
                1. Identidad Corporativa (*)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-gray-700">
                    Nombre oficial de la organización *
                  </label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ej. Iberdrola, Universidad de Extremadura, etc."
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">
                    Email de acceso corporativo *
                  </label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="contacto@organizacion.com"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">
                    Ubicación / Sede principal *
                  </label>
                  <Input
                    value={form.location ?? ""}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Ej. Madrid, Campus Cáceres..."
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-gray-700">
                    Descripción / Política de movilidad *
                  </label>
                  <textarea
                    rows={2}
                    value={form.description ?? ""}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Breve descripción de la organización, actividades o compromiso ambiental..."
                    className="w-full rounded-lg border border-panel-200 bg-white px-3 py-2 text-sm focus:border-panel-800 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Bloque 2: Credenciales de Acceso */}
            <div className="rounded-xl border border-panel-200 bg-panel-50/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-wider text-panel-900">
                  2. Credenciales Iniciales (*)
                </div>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 px-2.5 py-1 rounded-md transition-colors"
                >
                  <KeyRound size={13} />
                  <span>Generar contraseña segura</span>
                </button>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">
                  Contraseña provisional (mín. 8 car.) *
                </label>
                <Input
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Introduce o genera una clave robusta..."
                  required
                />
              </div>
            </div>

            {/* Bloque 3: Datos Fiscales y B2B Opcionales */}
            <div className="space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                3. Datos Fiscales, Contacto y B2B (Opcionales)
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
                    placeholder="Nombre y cargo (ej. Laura Ruiz - RRHH)"
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
                  <label className="text-xs font-medium text-gray-600">Empleados / Asistentes aprox.</label>
                  <Input
                    type="number"
                    value={form.employee_count ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        employee_count: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    placeholder="Ej. 250"
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
                    placeholder="Calle, número, oficina..."
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Ciudad</label>
                  <Input
                    value={form.city ?? ""}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Ciudad"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Provincia / C.P.</label>
                  <div className="flex gap-2">
                    <Input
                      value={form.province ?? ""}
                      onChange={(e) => setForm({ ...form, province: e.target.value })}
                      placeholder="Provincia"
                    />
                    <Input
                      value={form.postal_code ?? ""}
                      onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                      placeholder="C.P."
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

              {/* Estados Iniciales */}
              <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-panel-200">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-panel-800"
                  />
                  <span>Activa para inicio de sesión</span>
                </label>

                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.verified}
                    onChange={(e) => setForm({ ...form, verified: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                  <span>Verificada oficialmente (Badge azul)</span>
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
                disabled={createMutation.isPending}
                className="rounded-lg bg-panel-800 px-5 py-2 text-sm font-medium text-white hover:bg-panel-900 disabled:opacity-50"
              >
                {createMutation.isPending ? "Dando de alta..." : "Dar de alta organización"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
