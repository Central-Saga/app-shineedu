/**
 * Materi Modul Repository
 * API client for learning materials
 */
import {
  get,
  getResponse,
  post,
  put,
  del,
  upload,
  DEFAULT_META as SHARED_DEFAULT_META,
} from "@/shared/infrastructure/api/httpClient";
import { buildQuery } from "@/shared/lib/buildQuery";
import type { PaginatedMeta } from "@/shared/domain/types";
import type {
  MateriModul,
  MateriModulItem,
  CreateMateriModulRequest,
  UpdateMateriModulRequest,
  CreateMateriItemRequest,
} from "../domain/entities";

export const DEFAULT_META = SHARED_DEFAULT_META;

const BASE_URL = "materi-modul";

export const materiRepository = {
  /**
   * Get list of materi modul with filters
   */
  getList: async (params: Record<string, unknown>): Promise<{ data: MateriModul[]; meta: PaginatedMeta }> => {
    const qs = buildQuery(params);
    const res = await getResponse<MateriModul[]>(qs ? `${BASE_URL}?${qs}` : BASE_URL);
    return { data: res.data || [], meta: res.meta || DEFAULT_META };
  },

  /**
   * Get single materi modul by ID
   */
  getById: async (id: number | string): Promise<MateriModul> => {
    return await get<MateriModul>(`${BASE_URL}/${id}`);
  },

  /**
   * Create new materi modul
   */
  create: async (data: CreateMateriModulRequest): Promise<MateriModul> => {
    return await post<MateriModul>(BASE_URL, data);
  },

  /**
   * Update materi modul
   */
  update: async (id: number | string, data: UpdateMateriModulRequest): Promise<MateriModul> => {
    return await put<MateriModul>(`${BASE_URL}/${id}`, data);
  },

  /**
   * Delete materi modul
   */
  delete: async (id: number | string): Promise<void> => {
    return await del(`${BASE_URL}/${id}`);
  },

  // Item management
  /**
   * Add item to materi modul
   */
  addItem: async (modulId: number | string, data: CreateMateriItemRequest): Promise<MateriModulItem> => {
    return await post<MateriModulItem>(`${BASE_URL}/${modulId}/items`, data);
  },

  /**
   * Add item with file upload
   */
  addItemWithFile: async (modulId: number | string, file: File, data: Omit<CreateMateriItemRequest, 'file_path'>): Promise<MateriModulItem> => {
    return await upload<MateriModulItem>(`${BASE_URL}/${modulId}/items`, file, data as Record<string, unknown>);
  },

  /**
   * Update item
   */
  updateItem: async (itemId: number | string, data: Partial<CreateMateriItemRequest>): Promise<MateriModulItem> => {
    return await put<MateriModulItem>(`${BASE_URL}/items/${itemId}`, data);
  },

  /**
   * Delete item
   */
  deleteItem: async (itemId: number | string): Promise<void> => {
    return await del(`${BASE_URL}/items/${itemId}`);
  },

  /**
   * Reorder items
   */
  reorderItems: async (modulId: number | string, itemIds: number[]): Promise<void> => {
    return await post(`${BASE_URL}/${modulId}/reorder`, { item_ids: itemIds });
  },
};
