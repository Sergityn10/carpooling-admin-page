import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { RotateCw, MessageSquareQuote } from "lucide-react";
import type {
  AdminAssignableStatus,
  FeedbackFiltersState,
  FeedbackItem,
} from "../features/feedback/types/feedback.types";
import { useFeedbackCategories } from "../features/feedback/hooks/useFeedbackCategories";
import { useFeedbackList } from "../features/feedback/hooks/useFeedbackList";
import { useUpdateFeedbackStatus } from "../features/feedback/hooks/useUpdateFeedbackStatus";
import { useDeleteFeedback } from "../features/feedback/hooks/useDeleteFeedback";
import FeedbackDashboard from "../features/feedback/components/FeedbackDashboard";
import FeedbackFilters from "../features/feedback/components/FeedbackFilters";
import FeedbackTable from "../features/feedback/components/FeedbackTable";
import FeedbackDetailDrawer from "../features/feedback/components/FeedbackDetailDrawer";
import StatusTransitionModal from "../features/feedback/components/StatusTransitionModal";

export default function FeedbackPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Inicializar filtros desde la URL
  const filters: FeedbackFiltersState = useMemo(() => {
    return {
      search: searchParams.get("q") || "",
      category: searchParams.get("category") || "",
      status: searchParams.get("status") || "",
      author_type: searchParams.get("author_type") || "",
      page: parseInt(searchParams.get("page") || "1", 10),
      limit: 20,
    };
  }, [searchParams]);

  // Actualizador de filtros sincronizado con la URL
  const updateFilters = (next: Partial<FeedbackFiltersState>) => {
    const updated = { ...filters, ...next };
    const params = new URLSearchParams();

    if (updated.search) params.set("q", updated.search);
    if (updated.category) params.set("category", updated.category);
    if (updated.status) params.set("status", updated.status);
    if (updated.author_type) params.set("author_type", updated.author_type);
    if (updated.page && updated.page > 1) params.set("page", String(updated.page));

    setSearchParams(params, { replace: true });
  };

  // Consultas y mutaciones
  const { categories } = useFeedbackCategories();
  const listQuery = useFeedbackList(filters);
  const updateStatusMutation = useUpdateFeedbackStatus();
  const deleteMutation = useDeleteFeedback();

  // Estados de modales y drawers
  const [selectedItem, setSelectedItem] = useState<FeedbackItem | null>(null);
  const [statusModalItem, setStatusModalItem] = useState<FeedbackItem | null>(
    null,
  );

  const rawItems = listQuery.data?.data || [];
  const pagination = listQuery.data?.pagination || {
    page: 1,
    limit: 20,
    total: rawItems.length,
    totalPages: 1,
  };

  // Filtrado local por término de búsqueda en campos clave
  const filteredItems = useMemo(() => {
    if (!filters.search.trim()) return rawItems;
    const term = filters.search.trim().toLowerCase();
    return rawItems.filter(
      (item) =>
        item.title.toLowerCase().includes(term) ||
        item.message.toLowerCase().includes(term) ||
        (item.author?.name || "").toLowerCase().includes(term) ||
        (item.author?.email || "").toLowerCase().includes(term),
    );
  }, [rawItems, filters.search]);

  // Mantener actualizado el item seleccionado si se muta en caché
  const activeDetailItem = useMemo(() => {
    if (!selectedItem) return null;
    return filteredItems.find((i) => i.id === selectedItem.id) || selectedItem;
  }, [selectedItem, filteredItems]);

  // Manejar cambio de estado desde el modal
  const handleStatusSubmit = async (
    status: AdminAssignableStatus,
    adminNotes: string,
  ) => {
    if (!statusModalItem) return;

    try {
      await updateStatusMutation.mutateAsync({
        id: statusModalItem.id,
        payload: {
          status,
          admin_notes: adminNotes || null,
        },
      });

      setStatusModalItem(null);
    } catch (err: any) {
      alert(err.message || "Error al actualizar el estado del feedback.");
    }
  };

  // Manejar eliminación de feedback
  const handleDeleteFeedback = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
    } catch (err: any) {
      alert(err.message || "Error al eliminar el feedback.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera de Página */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">
              Buzón de Feedback y Sugerencias
            </h1>
            <span className="rounded-full bg-panel-100 px-2.5 py-0.5 text-xs font-semibold text-panel-800">
              {pagination.total} reportes
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Supervisa, clasifica y resuelve sugerencias, incidencias y propuestas
            de mejora reportadas por los usuarios y organizaciones de YouConnext.
          </p>
        </div>

        <button
          type="button"
          onClick={() => listQuery.refetch()}
          disabled={listQuery.isFetching}
          className="inline-flex items-center gap-1.5 rounded-lg border border-panel-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-panel-50 disabled:opacity-50"
        >
          <RotateCw
            size={14}
            className={listQuery.isFetching ? "animate-spin" : ""}
          />
          Actualizar
        </button>
      </div>

      {/* Dashboard analítico de métricas */}
      <FeedbackDashboard
        items={filteredItems}
        totalCount={pagination.total}
      />

      {/* Barra de filtros, tabs y exportación */}
      <FeedbackFilters
        filters={filters}
        onChange={updateFilters}
        categories={categories}
        itemsForExport={filteredItems}
      />

      {/* Tabla interactiva */}
      <FeedbackTable
        items={filteredItems}
        isLoading={listQuery.isLoading}
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        onPageChange={(newPage) => updateFilters({ page: newPage })}
        onSelect={(item) => setSelectedItem(item)}
        onOpenStatusModal={(item) => setStatusModalItem(item)}
        categories={categories}
      />

      {/* Drawer lateral de triage y detalle */}
      <FeedbackDetailDrawer
        item={activeDetailItem}
        isOpen={Boolean(activeDetailItem)}
        onClose={() => setSelectedItem(null)}
        onOpenStatusModal={(item) => setStatusModalItem(item)}
        onDelete={handleDeleteFeedback}
        isDeleting={deleteMutation.isPending}
        categories={categories}
      />

      {/* Modal de transición de estado */}
      <StatusTransitionModal
        item={statusModalItem}
        isOpen={Boolean(statusModalItem)}
        onClose={() => setStatusModalItem(null)}
        onSubmit={handleStatusSubmit}
        isSubmitting={updateStatusMutation.isPending}
      />
    </div>
  );
}
