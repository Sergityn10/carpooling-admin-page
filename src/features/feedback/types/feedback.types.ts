export type FeedbackCategoryKey =
  | "bug"
  | "improvement"
  | "usability"
  | "performance"
  | "service"
  | "organization"
  | "other";

export type FeedbackStatusKey =
  | "submitted"
  | "received"
  | "in_progress"
  | "pending_verification"
  | "resolved"
  | "discarded";

export type FeedbackAuthorType = "user" | "enterprise";

export interface FeedbackAuthorUser {
  type: "user";
  id: string | null;
  name: string;
  email: string;
  role?: string;
  img_perfil?: string | null;
}

export interface FeedbackAuthorEnterprise {
  type: "enterprise";
  id: string | null;
  name: string;
  email: string;
  verified?: boolean | null;
  cif?: string | null;
}

export type FeedbackAuthor = FeedbackAuthorUser | FeedbackAuthorEnterprise;

export interface FeedbackItem {
  id: string;
  title: string;
  category: FeedbackCategoryKey;
  message: string;
  status: FeedbackStatusKey;
  status_label: string;
  status_description: string;
  admin_notes: string | null;
  resolved_at: string | null;
  user_resolution_comment: string | null;
  author_type: FeedbackAuthorType;
  author: FeedbackAuthor;
  created_at: string;
  updated_at: string;
}

export interface FeedbackCategoryMeta {
  id: FeedbackCategoryKey;
  label: string;
  description: string;
  icon: string;
}

export interface FeedbackMetadataResponse {
  title: string;
  description: string;
  maxTitleLength: number;
  maxMessageLength: number;
  categories: FeedbackCategoryMeta[];
}

export interface FeedbackFiltersState {
  search: string;
  category: string;
  status: string;
  author_type: string;
  page: number;
  limit: number;
}

export interface FeedbackListResponse {
  status: string;
  data: FeedbackItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type AdminAssignableStatus =
  | "received"
  | "in_progress"
  | "pending_verification"
  | "discarded";

export interface UpdateFeedbackStatusPayload {
  status: AdminAssignableStatus;
  admin_notes?: string | null;
}
