import { ChevronLeft, ChevronRight, Eye, SlidersHorizontal, User, Building2 } from "lucide-react";
import clsx from "clsx";
import type { FeedbackCategoryMeta, FeedbackItem } from "../types/feedback.types";
import { Table, Td, Th } from "../../../components/ui/Table";
import { formatRelative } from "../../../lib/format";
import FeedbackCategoryBadge from "./FeedbackCategoryBadge";
import FeedbackStatusBadge from "./FeedbackStatusBadge";

interface FeedbackTableProps {
  items: FeedbackItem[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (newPage: number) => void;
  onSelect: (item: FeedbackItem) => void;
  onOpenStatusModal: (item: FeedbackItem) => void;
  categories: FeedbackCategoryMeta[];
}

export default function FeedbackTable({
  items,
  isLoading,
  page,
  totalPages,
  total,
  onPageChange,
  onSelect,
  onOpenStatusModal,
  categories,
}: FeedbackTableProps) {
  const getCategoryLabel = (id: string) => {
    return categories.find((c) => c.id === id)?.label || id;
  };

  return (
    <div className="space-y-3">
      <Table>
        <thead>
          <tr>
            <Th className="w-40">Categoría</Th>
            <Th>Título y Mensaje</Th>
            <Th className="w-56">Autor</Th>
            <Th className="w-36 text-center">Estado</Th>
            <Th className="w-32 text-right">Fecha</Th>
            <Th className="w-32 text-right">Acciones</Th>
          </tr>
        </thead>
        <tbody>
          {isLoading && items.length === 0 ? (
            <tr>
              <Td colSpan={6} className="py-12 text-center text-gray-500">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-panel-800 border-t-transparent" />
                  <span className="text-xs">Cargando feedbacks...</span>
                </div>
              </Td>
            </tr>
          ) : items.length === 0 ? (
            <tr>
              <Td colSpan={6} className="py-12 text-center text-gray-500">
                <div className="text-sm font-medium text-gray-700">
                  No se encontraron feedbacks
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  Prueba cambiando los filtros de búsqueda o el estado
                  seleccionado.
                </div>
              </Td>
            </tr>
          ) : (
            items.map((item) => {
              const isEnterprise = item.author_type === "enterprise";

              return (
                <tr
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className="cursor-pointer transition-colors hover:bg-panel-50"
                >
                  {/* Categoría */}
                  <Td>
                    <FeedbackCategoryBadge
                      category={item.category}
                      label={getCategoryLabel(item.category)}
                    />
                  </Td>

                  {/* Título y extracto seguro */}
                  <Td>
                    <div className="max-w-md">
                      <div className="font-medium text-gray-900 line-clamp-1">
                        {item.title}
                      </div>
                      <div className="mt-0.5 text-xs text-gray-500 line-clamp-1">
                        {item.message}
                      </div>
                    </div>
                  </Td>

                  {/* Autor */}
                  <Td>
                    <div className="flex items-center gap-2">
                      <div
                        className={clsx(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                          isEnterprise
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-panel-100 text-panel-800",
                        )}
                        title={isEnterprise ? "Organización" : "Particular"}
                      >
                        {isEnterprise ? (
                          <Building2 size={13} />
                        ) : (
                          <User size={13} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-xs font-medium text-gray-900">
                          {item.author?.name || "Anónimo"}
                        </div>
                        <div className="truncate text-[11px] text-gray-400">
                          {item.author?.email || "Sin email"}
                        </div>
                      </div>
                    </div>
                  </Td>

                  {/* Estado */}
                  <Td className="text-center">
                    <FeedbackStatusBadge
                      status={item.status}
                      label={item.status_label}
                    />
                  </Td>

                  {/* Fecha */}
                  <Td className="text-right text-xs text-gray-500">
                    {formatRelative(item.created_at)}
                  </Td>

                  {/* Acciones */}
                  <Td className="text-right">
                    <div
                      className="flex items-center justify-end gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => onSelect(item)}
                        className="inline-flex items-center gap-1 rounded-md p-1.5 text-xs font-medium text-gray-600 hover:bg-panel-100 hover:text-gray-900"
                        title="Ver detalle completo"
                      >
                        <Eye size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenStatusModal(item)}
                        className="inline-flex items-center gap-1 rounded-md bg-panel-100 px-2 py-1 text-xs font-medium text-panel-800 transition-colors hover:bg-panel-200"
                        title="Cambiar estado y gestionar notas"
                      >
                        <SlidersHorizontal size={12} />
                        Triage
                      </button>
                    </div>
                  </Td>
                </tr>
              );
            })
          )}
        </tbody>
      </Table>

      {/* Paginación */}
      <div className="flex items-center justify-between px-2 text-xs text-gray-500">
        <div>
          Mostrando página <span className="font-semibold text-gray-800">{page}</span> de{" "}
          <span className="font-semibold text-gray-800">{totalPages || 1}</span> ({total} resultados)
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1 || isLoading}
            onClick={() => onPageChange(page - 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-panel-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-panel-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft size={14} />
            Anterior
          </button>
          <button
            type="button"
            disabled={page >= totalPages || isLoading}
            onClick={() => onPageChange(page + 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-panel-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-panel-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Siguiente
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
