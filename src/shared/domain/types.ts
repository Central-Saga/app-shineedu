/**
 * Backend API response wrapper.
 * Format: { success, message, data, errors?, meta? }
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ValidationErrors;
  meta?: PaginatedMeta;
}

/**
 * Meta untuk response paginated (Laravel).
 * from, to: number | null saat halaman kosong.
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
