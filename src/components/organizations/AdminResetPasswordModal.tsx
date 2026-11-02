import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Check, Copy, KeyRound, ShieldAlert, X } from "lucide-react";
import { api } from "../../api/client";
import type { Enterprise } from "../../api/types";
import Alert from "../ui/Alert";
import Input from "../ui/Input";

function generateSecurePassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%&*_-";

  let pass = "";
  pass += upper.charAt(Math.floor(Math.random() * upper.length));
  pass += lower.charAt(Math.floor(Math.random() * lower.length));
  pass += digits.charAt(Math.floor(Math.random() * digits.length));
  pass += symbols.charAt(Math.floor(Math.random() * symbols.length));

  const allChars = upper + lower + digits + symbols;
  for (let i = 4; i < 12; i++) {
    pass += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  return pass
    .split("")
    .sort(() => 0.5 - Math.random())
    .join("");
}

type Props = {
  enterprise: Enterprise;
  isOpen: boolean;
  onClose: () => void;
};

export default function AdminResetPasswordModal({
  enterprise,
  isOpen,
  onClose,
}: Props) {
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const resetMutation = useMutation({
    mutationFn: (pwd: string) =>
      api.organizaciones.resetPassword(enterprise.id, pwd),
    onSuccess: () => {
      setSuccessResult(newPassword);
    },
    onError: (err: any) => {
      const msg = err?.body?.message || err?.message || "Error al restablecer la contraseña.";
      setError(typeof msg === "object" ? JSON.stringify(msg) : msg);
    },
  });

  if (!isOpen) return null;

  const handleGenerate = () => {
    setNewPassword(generateSecurePassword());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword || newPassword.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }

    resetMutation.mutate(newPassword);
  };

  const handleCopy = () => {
    if (!successResult) return;
    const text = [
      `Actualización de Credenciales - YouConnext`,
      `Entidad: ${enterprise.name}`,
      `Email: ${enterprise.email}`,
      `Nueva contraseña: ${successResult}`,
      `Acceso: ${window.location.origin}`,
    ].join("\n");

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        >
          <X size={20} />
        </button>

        {successResult ? (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                <Check size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  ¡Contraseña restablecida con éxito!
                </h3>
                <p className="text-xs text-gray-600">
                  La organización ya puede iniciar sesión con esta nueva clave.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-panel-200 bg-panel-50 p-3 space-y-1 text-sm">
              <div className="text-xs text-gray-500 font-medium">Nueva contraseña asignada:</div>
              <div className="font-mono text-base font-bold text-panel-900 bg-white p-2 rounded border border-panel-200">
                {successResult}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-2 rounded-lg bg-panel-800 px-4 py-2 text-sm font-medium text-white hover:bg-panel-900"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? "¡Copiada!" : "Copiar clave"}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-panel-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-panel-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <ShieldAlert size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Restablecer Contraseña
                </h3>
                <p className="text-xs text-gray-500">
                  Organización: <strong>{enterprise.name}</strong> ({enterprise.email})
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600">
              Como administrador, puedes asignar una nueva contraseña segura sin necesidad de conocer la clave actual.
            </p>

            {error ? <Alert variant="error">{error}</Alert> : null}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700">
                  Nueva contraseña (mín. 8 caracteres)
                </label>
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900"
                >
                  <KeyRound size={13} />
                  <span>Generar aleatoria</span>
                </button>
              </div>
              <Input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Escribe o pulsa en generar..."
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-panel-200">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-panel-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-panel-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={resetMutation.isPending}
                className="rounded-lg bg-panel-800 px-4 py-2 text-sm font-medium text-white hover:bg-panel-900 disabled:opacity-50"
              >
                {resetMutation.isPending ? "Restableciendo..." : "Restablecer contraseña"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
