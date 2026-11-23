import { useState } from "react";
import { Link } from "react-router-dom";
import {
  X,
  Copy,
  Check,
  Building2,
  User,
  ExternalLink,
  Trash2,
  SlidersHorizontal,
  Clock,
  Calendar,
  CheckCircle,
  StickyNote,
} from "lucide-react";
import clsx from "clsx";
import type { FeedbackCategoryMeta, FeedbackItem } from "../types/feedback.types";
import { formatDateTime } from "../../../lib/format";
import FeedbackCategoryBadge from "./FeedbackCategoryBadge";
import FeedbackStatusBadge from "./FeedbackStatusBadge";
import { useUpdateFeedbackStatus } from "../hooks/useUpdateFeedbackStatus";

interface FeedbackDetailDrawerProps {
  item: FeedbackItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenStatusModal: (item: FeedbackItem) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
  categories: FeedbackCategoryMeta[];
}

export default function FeedbackDetailDrawer({
  item,
  isOpen,
  onClose,
  onOpenStatusModal,
  onDelete,
  isDeleting,
  categories,
}: FeedbackDetailDrawerProps) {
  const [copied, setCopied] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");

  const updateMutation = useUpdateFeedbackStatus();

  if (!isOpen || !item) return null;

  const isEnterprise = item.author_type === "enterprise";
  const categoryMeta = categories.find((c) => c.id === item.category);

  const handleCopyId = () => {
    navigator.clipboard.writeText(item.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startEditNotes = () => {
    setNotesDraft(item.admin_notes || "");
    setEditingNotes(true);
  };

  const handleSaveNotes = async () => {
    if (item.status === "resolved") {
      alert("No se pueden modificar notas de un feedback ya resuelto.");
      setEditingNotes(false);
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: item.id,
        payload: {
          status: item.status as any,
          admin_notes: notesDraft,
        },
      });
      setEditingNotes(false);
    } catch (err: any) {
      alert(err.message || "Error guardando notas internas.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="flex w-screen max-w-lg flex-col bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-panel-200 px-6 py-4">
            <div className="flex items-center gap-2">
              <FeedbackStatusBadge
                status={item.status}
                label={item.status_label}
              />
              <button
                type="button"
                onClick={handleCopyId}
                className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-gray-400 hover:bg-panel-100 hover:text-gray-700"
                title="Copiar ID"
              >
                <span className="font-mono text-[11px]">
                  {item.id.slice(0, 8)}...
                </span>
                {copied ? (
                  <Check size={12} className="text-emerald-600" />
                ) : (
                  <Copy size={12} />
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-gray-400 hover:bg-panel-100 hover:text-gray-700"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body scrolleable */}
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
            {/* 1. Tarjeta del Autor */}
            <div className="rounded-xl border border-panel-200 bg-panel-50/50 p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={clsx(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-semibold",
                      isEnterprise
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-panel-200 text-panel-900",
                    )}
                  >
                    {isEnterprise ? <Building2 size={18} /> : <User size={18} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {item.author?.name || "Autor desconocido"}
                      </span>
                      <span
                        className={clsx(
                          "rounded px-1.5 py-0.5 text-[10px] font-medium",
                          isEnterprise
                            ? "bg-indigo-100 text-indigo-800"
                            : "bg-panel-200 text-panel-900",
                        )}
                      >
                        {isEnterprise ? "Organización" : "Particular"}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.author?.email || "Sin email registrado"}
                    </div>
                  </div>
                </div>

                {/* Enlace directo a la ficha */}
                {item.author?.id && (
                  <Link
                    to={
                      isEnterprise
                        ? `/organizaciones/${item.author.id}`
                        : `/usuarios/${item.author.id}`
                    }
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs font-medium text-panel-800 hover:underline"
                    title="Abrir ficha en nueva pestaña"
                  >
                    <span>Ficha</span>
                    <ExternalLink size={12} />
                  </Link>
                )}
              </div>
            </div>

            {/* 2. Detalle y Contenido del Feedback */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FeedbackCategoryBadge
                  category={item.category}
                  label={categoryMeta?.label}
                />
                <span className="text-xs text-gray-400">
                  {categoryMeta?.description}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {item.title}
                </h3>
                {/* Renderizado nativo seguro contra stored XSS */}
                <div className="mt-2 rounded-lg border border-panel-200 bg-white p-3.5 text-sm leading-relaxed text-gray-800 whitespace-pre-wrap break-words shadow-sm">
                  {item.message}
                </div>
              </div>
            </div>

            {/* 3. Fechas y Seguimiento */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 rounded-lg border border-panel-100 bg-panel-50 p-2.5">
                <Calendar size={14} className="text-gray-400" />
                <div>
                  <div className="text-gray-400 text-[11px]">Enviado el</div>
                  <div className="font-medium text-gray-800">
                    {formatDateTime(item.created_at)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-panel-100 bg-panel-50 p-2.5">
                <Clock size={14} className="text-gray-400" />
                <div>
                  <div className="text-gray-400 text-[11px]">Actualizado</div>
                  <div className="font-medium text-gray-800">
                    {formatDateTime(item.updated_at)}
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Comentario de Verificación del Usuario (Si aplica) */}
            {item.user_resolution_comment && (
              <div className="space-y-1.5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
                  <CheckCircle size={16} className="text-emerald-700" />
                  <span>Respuesta de verificación del autor</span>
                </div>
                <div className="text-xs leading-relaxed text-emerald-950 whitespace-pre-wrap break-words">
                  {item.user_resolution_comment}
                </div>
              </div>
            )}

            {/* 5. Notas Internas de Administración */}
            <div className="space-y-2 rounded-xl border border-panel-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
                  <StickyNote size={14} className="text-panel-800" />
                  <span>Notas internas del equipo</span>
                </div>
                {!editingNotes && item.status !== "resolved" && (
                  <button
                    type="button"
                    onClick={startEditNotes}
                    className="text-xs font-medium text-panel-800 hover:underline"
                  >
                    {item.admin_notes ? "Editar nota" : "Añadir nota"}
                  </button>
                )}
              </div>

              {editingNotes ? (
                <div className="space-y-2 pt-1">
                  <textarea
                    rows={3}
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    placeholder="Escribe notas privadas para el equipo (ej: issue en Jira #124, parche en v1.4)..."
                    className="w-full rounded-lg border border-panel-200 p-2 text-xs focus:border-panel-800 focus:outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingNotes(false)}
                      className="rounded px-2.5 py-1 text-xs text-gray-600 hover:bg-panel-100"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={updateMutation.isPending}
                      onClick={handleSaveNotes}
                      className="rounded bg-panel-900 px-3 py-1 text-xs font-medium text-white hover:bg-panel-800 disabled:opacity-50"
                    >
                      {updateMutation.isPending ? "Guardando..." : "Guardar nota"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-gray-600 whitespace-pre-wrap break-words">
                  {item.admin_notes || (
                    <span className="italic text-gray-400">
                      Sin notas registradas para este reporte.
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer de Acciones */}
          <div className="flex items-center justify-between border-t border-panel-200 bg-panel-50 px-6 py-4">
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => {
                if (
                  confirm(
                    `¿Estás seguro de que deseas eliminar permanentemente el feedback "${item.title}"?`,
                  )
                ) {
                  onDelete(item.id);
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 disabled:opacity-50"
            >
              <Trash2 size={14} />
              Eliminar
            </button>

            <button
              type="button"
              onClick={() => onOpenStatusModal(item)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-panel-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-panel-800"
            >
              <SlidersHorizontal size={14} />
              Cambiar Estado / Triage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
