import { useMutation, useQueryClient } from "@tanstack/react-query";
import { feedbackAdminApi } from "../services/feedbackAdminApi";

export function useDeleteFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => feedbackAdminApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback-list"] });
    },
  });
}
