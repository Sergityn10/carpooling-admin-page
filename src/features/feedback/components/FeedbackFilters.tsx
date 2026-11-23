import React, { useEffect, useState } from "react";
import { Download, Filter, Search } from "lucide-react";
import clsx from "clsx";
import type {
  FeedbackCategoryMeta,
  FeedbackFiltersState,
  FeedbackItem,
} from "../types/feedback.types";

interface FeedbackFiltersProps {
  filters: FeedbackFiltersState;
  onChange: (next: Partial<FeedbackFiltersState>) => void;
  categories: FeedbackCategoryMeta[];
  itemsForExport: FeedbackItem[];
}

const STATUS_TABS: Array<{ id: string; label: string; countBadge?: string }> = [
  { id: "", label: "Todos" },
  { id: "submitted", label: "Enviados" },
  { id: "received", label: "Recibidos" },
  { id: "in_progress", label: "En Progreso" },
  { id: "pending_verification", label: "En Verificación" },
  { id: "resolved", label: "Resueltos" },
  { id: "discarded", label: "Descartados" },
];

export default function FeedbackFilters({
  filters,
  onChange,
  categories,
  itemsForExport,
}: FeedbackFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search);

  // Debounce de búsqueda a 300 ms
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        onChange({ search: searchInput, page: 1 });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, filters.search, onChange]);

  // Exportar a CSV con BOM UTF-8 para apertura directa y limpia en Microsoft Excel
  const handleExportCsv = () => {
    if (!itemsForExport.length) {
      alert("No hay registros para exportar con los filtros actuales.");
      return;
    }

    const headers = [
      "ID",
      "Título",
      "Categoría",
      "Estado",
      "Tipo Autor",
      "Nombre Autor",
      "Email Autor",
      "Fecha Creación",
      "Notas Admin",
      "Comentario Verificación Usuario",
    ];

    const escapeCsv = (val: string | null | undefined) => {
      if (!val) return '""';
      const clean = String(val).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = itemsForExport.map((item) => [
      escapeCsv(item.id),
      escapeCsv(item.title),
      escapeCsv(item.category),
      escapeCsv(item.status_label || item.status),
      escapeCsv(item.author_type === "enterprise" ? "Organización" : "Particular"),
      escapeCsv(item.author?.name || "-"),
      escapeCsv(item.author?.email || "-"),
      escapeCsv(item.created_at),
      escapeCsv(item.admin_notes || ""),
      escapeCsv(item.user_resolution_comment || ""),
    ]);

    const csvContent =
      "\uFEFF" +
      [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `feedback-youconnext-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3 rounded-xl border border-panel-200 bg-white p-4 shadow-sm">
      {/* 1. Selector de pestañas / chips de estado */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-panel-100 pb-3">
        {STATUS_TABS.map((tab) => {
          const isActive = filters.status === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange({ status: tab.id, page: 1 })}
              className={clsx(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "bg-panel-900 text-white shadow-sm"
                  : "bg-panel-50 text-gray-600 hover:bg-panel-100 hover:text-gray-900",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 2. Barra de búsqueda y selectores secundarios */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Buscador debounced */}
        <div className="relative min-w-[260px] flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por título, contenido, autor o email..."
            className="w-full rounded-lg border border-panel-200 bg-white py-2 pl-9 pr-3 text-xs placeholder-gray-400 focus:border-panel-800 focus:outline-none"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                onChange({ search: "", page: 1 });
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filtro de Categoría */}
        <div className="flex items-center gap-2">
          <select
            value={filters.category}
            onChange={(e) => onChange({ category: e.target.value, page: 1 })}
            className="rounded-lg border border-panel-200 bg-white px-3 py-2 text-xs text-gray-700 focus:border-panel-800 focus:outline-none"
          >
            <option value="">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>

          {/* Filtro de Tipo de Autor */}
          <select
            value={filters.author_type}
            onChange={(e) => onChange({ author_type: e.target.value, page: 1 })}
            className="rounded-lg border border-panel-200 bg-white px-3 py-2 text-xs text-gray-700 focus:border-panel-800 focus:outline-none"
          >
            <option value="">Todos los autores</option>
            <option value="user">Particular (Usuarios)</option>
            <option value="enterprise">Organización (Empresas)</option>
          </select>

          {/* Botón de exportar CSV */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-panel-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-panel-50"
            title="Descargar listado en formato CSV compatible con Excel"
          >
            <Download size={14} />
            Exportar CSV
          </button>
        </div>
      </div>
    </div>
  );
}
