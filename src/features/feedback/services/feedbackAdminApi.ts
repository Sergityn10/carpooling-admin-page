import { http } from "../../../api/http";
import type {
  FeedbackFiltersState,
  FeedbackItem,
  FeedbackListResponse,
  FeedbackMetadataResponse,
  UpdateFeedbackStatusPayload,
} from "../types/feedback.types";

export const feedbackAdminApi = {
  /**
   * Obtiene los metadatos y el catálogo de categorías dinámicas de feedback
   */
  getCategories: () =>
    http<{ status: string; data: FeedbackMetadataResponse }>(
      "users",
      "/api/feedback/categories",
    ),

  /**
   * Lista todos los feedbacks con filtros de estado, categoría, autor y paginación
   */
  list: (params?: Partial<FeedbackFiltersState>) => {
    const qs = new URLSearchParams();
    if (params?.category) qs.set("category", params.category);
    if (params?.status) qs.set("status", params.status);
    if (params?.author_type) qs.set("author_type", params.author_type);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));

    const query = qs.toString();
    return http<FeedbackListResponse>(
      "users",
      `/api/feedback${query ? `?${query}` : ""}`,
    );
  },

  /**
   * Obtiene el detalle completo de un feedback por su ID
   */
  getById: (id: string) =>
    http<{ status: string; data: FeedbackItem }>(
      "users",
      `/api/feedback/${encodeURIComponent(id)}`,
    ),

  /**
   * Actualiza el estado operativo y notas de un feedback
   */
  updateStatus: (id: string, payload: UpdateFeedbackStatusPayload) =>
    http<{ status: string; message: string; data: FeedbackItem }>(
      "users",
      `/api/feedback/${encodeURIComponent(id)}/status`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    ),

  /**
   * Elimina un feedback
   */
  remove: (id: string) =>
    http<{ status: string; message: string }>(
      "users",
      `/api/feedback/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      },
    ),
};
