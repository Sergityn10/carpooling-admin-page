import { useMutation, useQueryClient } from "@tanstack/react-query";
import { feedbackAdminApi } from "../services/feedbackAdminApi";
import type {
  FeedbackItem,
  FeedbackListResponse,
  UpdateFeedbackStatusPayload,
} from "../types/feedback.types";

interface UpdateStatusParams {
  id: string;
  payload: UpdateFeedbackStatusPayload;
}

export function useUpdateFeedbackStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateStatusParams) =>
      feedbackAdminApi.updateStatus(id, payload),

    onMutate: async ({ id, payload }) => {
      // 1. Cancelar peticiones salientes para evitar sobreescrituras
      await queryClient.cancelQueries({ queryKey: ["feedback-detail", id] });
      await queryClient.cancelQueries({ queryKey: ["feedback-list"] });

      // 2. Guardar snapshot previo de detalle y lista para rollback si falla
      const previousDetail = queryClient.getQueryData<{
        status: string;
        data: FeedbackItem;
      }>(["feedback-detail", id]);

      // 3. Actualizar optimísticamente el detalle
      if (previousDetail?.data) {
        queryClient.setQueryData(["feedback-detail", id], {
          ...previousDetail,
          data: {
            ...previousDetail.data,
            status: payload.status,
            admin_notes:
              payload.admin_notes !== undefined
                ? payload.admin_notes
                : previousDetail.data.admin_notes,
          },
        });
      }

      // 4. Actualizar optimísticamente en los listados en caché
      queryClient.setQueriesData<FeedbackListResponse>(
        { queryKey: ["feedback-list"] },
        (old) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.map((item) =>
              item.id === id
                ? {
                    ...item,
                    status: payload.status,
                    admin_notes:
                      payload.admin_notes !== undefined
                        ? payload.admin_notes
                        : item.admin_notes,
                  }
                : item,
            ),
          };
        },
      );

      return { previousDetail };
    },

    onError: (_err, variables, context) => {
      // Rollback al snapshot previo
      if (context?.previousDetail) {
        queryClient.setQueryData(
          ["feedback-detail", variables.id],
          context.previousDetail,
        );
      }
    },

    onSettled: (_data, _error, variables) => {
      // Revalidación completa
      queryClient.invalidateQueries({
        queryKey: ["feedback-detail", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["feedback-list"] });
    },
  });
}
