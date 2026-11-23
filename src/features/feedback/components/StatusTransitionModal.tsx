import { useEffect, useState } from "react";
import { X, Info, CheckCircle2, AlertTriangle } from "lucide-react";
import type {
  AdminAssignableStatus,
  FeedbackItem,
} from "../types/feedback.types";
import FeedbackStatusBadge from "./FeedbackStatusBadge";

interface StatusTransitionModalProps {
  item: FeedbackItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (status: AdminAssignableStatus, adminNotes: string) => Promise<void>;
  isSubmitting: boolean;
}

const AVAILABLE_STATUSES: Array<{
  id: AdminAssignableStatus;
  label: string;
  desc: string;
}> = [
  {
    id: "received",
    label: "Recibido",
    desc: "El reporte ha sido revisado y clasificado por el equipo.",
  },
  {
    id: "in_progress",
    label: "En progreso",
    desc: "El equipo técnico o de producto está trabajando en la solución.",
  },
  {
    id: "pending_verification",
    label: "Cambio realizado (En verificación)",
    desc: "Se ha desplegado la corrección. Se solicita al usuario que lo verifique.",
  },
  {
    id: "discarded",
    label: "Descartado",
    desc: "No reproducible, fuera de alcance, inviable o duplicado.",
  },
];

export default function StatusTransitionModal({
  item,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: StatusTransitionModalProps) {
  const [selectedStatus, setSelectedStatus] =
    useState<AdminAssignableStatus>("received");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (item) {
      if (
        item.status === "received" ||
        item.status === "in_progress" ||
        item.status === "pending_verification" ||
        item.status === "discarded"
      ) {
        setSelectedStatus(item.status);
      } else {
        setSelectedStatus("received");
      }
      setNotes(item.admin_notes || "");
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(selectedStatus, notes);
  };

  const isAlreadyResolved = item.status === "resolved";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl border border-panel-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-panel-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Triage y Cambio de Estado
            </h3>
            <p className="text-xs text-gray-500">
              Actualiza el ciclo de vida del reporte y añade notas de seguimiento
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-panel-100 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* Resumen del feedback */}
        <div className="mt-4 rounded-xl border border-panel-100 bg-panel-50/70 p-3">
          <div className="text-xs font-medium text-gray-500">Feedback:</div>
          <div className="font-semibold text-gray-900 line-clamp-1">
            {item.title}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-gray-500">Estado actual:</span>
            <FeedbackStatusBadge
              status={item.status}
              label={item.status_label}
            />
          </div>
        </div>

        {isAlreadyResolved ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>Reporte Resuelto y Confirmado</span>
            </div>
            <p className="mt-1 text-emerald-800">
              Este feedback ya ha sido probado y confirmado como resuelto por el
              usuario emisor.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Opciones de estado */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-700">
                Selecciona nuevo estado:
              </label>

              <div className="space-y-2">
                {AVAILABLE_STATUSES.map((st) => {
                  const isChecked = selectedStatus === st.id;
                  return (
                    <label
                      key={st.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                        isChecked
                          ? "border-panel-800 bg-panel-50/80 shadow-sm"
                          : "border-panel-200 hover:bg-panel-50/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={st.id}
                        checked={isChecked}
                        onChange={() => setSelectedStatus(st.id)}
                        className="mt-0.5 text-panel-900 focus:ring-panel-800"
                      />
                      <div className="text-xs">
                        <div className="font-semibold text-gray-900">
                          {st.label}
                        </div>
                        <div className="text-gray-500">{st.desc}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Alerta explicativa sobre Verificación asimétrica */}
            {selectedStatus === "pending_verification" && (
              <div className="flex items-start gap-2.5 rounded-xl border border-orange-200 bg-orange-50/70 p-3 text-xs text-orange-900">
                <Info size={16} className="shrink-0 text-orange-600 mt-0.5" />
                <div>
                  <span className="font-semibold">Verificación del Usuario:</span>{" "}
                  Al marcar este estado, el usuario autor verá en su app que el
                  cambio ha sido desplegado y podrá confirmar o solicitar ajustes.
                </div>
              </div>
            )}

            {/* Alerta si se marca Descartado */}
            {selectedStatus === "discarded" && (
              <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-900">
                <AlertTriangle size={16} className="shrink-0 text-rose-600 mt-0.5" />
                <div>
                  <span className="font-semibold">Motivo de descarte:</span> Por
                  favor especifica en las notas la razón por la que se descarta
                  (ej: duplicado, comportamiento esperado o inviable).
                </div>
              </div>
            )}

            {/* Notas de administración */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">
                Notas internas / Motivo de cambio:
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Añade detalles del cambio, link a pull request, ticket de Jira, o motivo de resolución..."
                className="w-full rounded-xl border border-panel-200 p-2.5 text-xs text-gray-900 focus:border-panel-800 focus:outline-none"
              />
            </div>

            {/* Footer de botones */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-panel-100">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-xs font-medium text-gray-700 hover:bg-panel-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-panel-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-panel-800 disabled:opacity-50"
              >
                {isSubmitting ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
