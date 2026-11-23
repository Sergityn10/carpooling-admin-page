import { useQuery } from "@tanstack/react-query";
import { feedbackAdminApi } from "../services/feedbackAdminApi";
import type { FeedbackCategoryMeta } from "../types/feedback.types";

export const FALLBACK_FEEDBACK_CATEGORIES: FeedbackCategoryMeta[] = [
  {
    id: "bug",
    label: "Reportar un fallo",
    description: "Informa sobre errores técnicos, pantallas rotas o mal funcionamiento.",
    icon: "bug",
  },
  {
    id: "improvement",
    label: "Propuesta de mejora",
    description: "Sugiere nuevas características o ideas para la plataforma.",
    icon: "lightbulb",
  },
  {
    id: "usability",
    label: "Experiencia de uso (Diseño)",
    description: "Comenta sobre la navegación, facilidad de uso o diseño visual.",
    icon: "sparkles",
  },
  {
    id: "performance",
    label: "Rendimiento y velocidad",
    description: "Reporta tiempos de carga lentos o problemas de respuesta.",
    icon: "gauge",
  },
  {
    id: "service",
    label: "Servicio de Carpooling",
    description: "Feedback relacionado con reservas, cancelaciones o trayectos.",
    icon: "car",
  },
  {
    id: "organization",
    label: "Gestión Corporativa",
    description: "Específico para administradores y empleados de organizaciones.",
    icon: "building",
  },
  {
    id: "other",
    label: "Otros comentarios",
    description: "Cualquier otra inquietud o mensaje general.",
    icon: "message-square",
  },
];

export function useFeedbackCategories() {
  const query = useQuery({
    queryKey: ["feedback-categories"],
    queryFn: async () => {
      try {
        const res = await feedbackAdminApi.getCategories();
        return res?.data?.categories ?? FALLBACK_FEEDBACK_CATEGORIES;
      } catch (err) {
        console.warn("Error cargando categorías de feedback, usando fallback:", err);
        return FALLBACK_FEEDBACK_CATEGORIES;
      }
    },
    staleTime: 1000 * 60 * 60, // 1 hora
    refetchOnWindowFocus: false,
  });

  const categories = query.data ?? FALLBACK_FEEDBACK_CATEGORIES;

  const getCategoryMeta = (categoryId: string): FeedbackCategoryMeta => {
    const found = categories.find((c) => c.id === categoryId);
    if (found) return found;
    return {
      id: categoryId as any,
      label: categoryId,
      description: "",
      icon: "message-square",
    };
  };

  return {
    ...query,
    categories,
    getCategoryMeta,
  };
}
