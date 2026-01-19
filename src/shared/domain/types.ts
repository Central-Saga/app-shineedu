/**
 * Backend API response wrapper.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ValidationErrors;
  meta?: Record<string, unknown>;
}

/**
 * Meta untuk response paginated (Laravel).
 */
export interface PaginatedMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number | null;
  to: number | null;
}

/**
 * Validation errors: field -> messages (array) atau { message: string }.
 */
export type ValidationErrors = Record<string, string[] | { message: string }>;
