import { useQuery } from "@tanstack/react-query";
import { feedbackAdminApi } from "../services/feedbackAdminApi";

export function useFeedbackDetail(id: string | null) {
  return useQuery({
    queryKey: ["feedback-detail", id],
    queryFn: () => (id ? feedbackAdminApi.getById(id) : null),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}
