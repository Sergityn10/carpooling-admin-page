import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { feedbackAdminApi } from "../services/feedbackAdminApi";
import type { FeedbackFiltersState } from "../types/feedback.types";

export function useFeedbackList(filters: Partial<FeedbackFiltersState>) {
  return useQuery({
    queryKey: ["feedback-list", filters],
    queryFn: () => feedbackAdminApi.list(filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
