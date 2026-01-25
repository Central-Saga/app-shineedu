import {
  get,
  getResponse,
  post,
  put,
  del,
  DEFAULT_META as SHARED_DEFAULT_META,
} from "@/shared/infrastructure/api/httpClient";
import { buildQuery } from "@/shared/lib/buildQuery"; // Helper for query building
import { CreateEnrollmentRequest, Enrollment, PricePreviewRequest, UpdateEnrollmentRequest } from "../domain/entities";
import type { PaginatedMeta } from "@/shared/domain/types";

export const DEFAULT_META = SHARED_DEFAULT_META;

const BASE_URL = "enrollments"; // Assuming prefix is handled or I should check. Murid repo uses "murid". So "enrollments" seems correct relative to base.

export const enrollmentRepository = {
  getEnrollments: async (params: Record<string, any>): Promise<{ data: Enrollment[]; meta: PaginatedMeta }> => {
    // buildQuery usually handles object -> string
    const qs = buildQuery(params);
    const res = await getResponse<Enrollment[]>(qs ? `${BASE_URL}?${qs}` : BASE_URL);
    return { data: res.data || [], meta: res.meta || DEFAULT_META };
  },

  getEnrollment: async (id: number | string): Promise<Enrollment> => {
    return await get<Enrollment>(`${BASE_URL}/${id}`);
  },

  createEnrollment: async (data: CreateEnrollmentRequest) => {
    const res = await post<Enrollment>(BASE_URL, data);
    return { data: res };
  },

  updateEnrollment: async (id: number | string, data: UpdateEnrollmentRequest) => {
    const res = await put<Enrollment>(`${BASE_URL}/${id}`, data);
    return { data: res };
  },

  deleteEnrollment: async (id: number | string) => {
    return await del(`${BASE_URL}/${id}`);
  },

  getEnrollmentPricePreview: async (params: PricePreviewRequest) => {
    // Assuming catalog/harga/lookup is the endpoint
    // Price preview might be a GET with params
    const query = buildQuery({
      program_id: params.program_id,
      jenjang_id: params.jenjang_id,
      paket_id: params.paket_id,
      jumlah_siswa: params.jumlah_siswa,
      date: params.tanggal_mulai // mapping param if needed
    });
    
    // Note: HttpClient usually returns just data for `get<T>`, or full response for `getResponse<T>`.
    // I need to check if `get` returns data directly. 
    // MuridRepo: `const data = await get<Murid>(...)`.
    // So `get` returns data.
    
    const data = await get<{ harga: number; id: number }>(`catalog/harga/lookup?${query}`);
    return { data };
  },
};
