
import {
  get,
  getResponse,
  post,
  put,
  del,
  DEFAULT_META,
} from "@/shared/infrastructure/api/httpClient";
import { buildQuery } from "@/shared/lib/buildQuery";
import type { PaginatedMeta } from "@/shared/domain/types";
import type {
  Cuti,
  CreateCutiPayload,
  UpdateCutiPayload,
} from "../domain/entities";

export interface ListCutiParams {
  page?: number;
  per_page?: number;
  q?: string;
  karyawan_id?: number | string;
  jenis?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  disetujui_oleh?: number | string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
}

export async function listCuti(
  params: ListCutiParams = {}
): Promise<{ items: Cuti[]; meta: PaginatedMeta }> {
  const qs = buildQuery(params);
  const res = await getResponse<Cuti[]>(qs ? `cuti?${qs}` : "cuti");
  return { items: (res.data ?? []) as Cuti[], meta: res.meta ?? DEFAULT_META };
}

export async function createCuti(payload: CreateCutiPayload | FormData): Promise<Cuti> {
  if (payload instanceof FormData) {
    const data = await post<Cuti>("cuti", payload);
    return data as Cuti;
  }

  const containsFile = Object.values(payload).some(v => v instanceof File);
  
  if (containsFile) {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value instanceof File ? value : String(value));
      }
    });
    const data = await post<Cuti>("cuti", formData);
    return data as Cuti;
  }

  const data = await post<Cuti>("cuti", payload);
  return data as Cuti;
}

export async function getCutiDetail(id: number): Promise<Cuti> {
  const data = await get<Cuti>(`cuti/${id}`);
  return data as Cuti;
}

export async function updateCuti(
  id: number,
  payload: UpdateCutiPayload | FormData
): Promise<Cuti> {
  if (payload instanceof FormData) {
    // Laravel needs POST + _method=PUT to handle multipart PUT requests
    if (!payload.has("_method")) {
        payload.append("_method", "PUT");
    }
    const data = await post<Cuti>(`cuti/${id}`, payload);
    return data as Cuti;
  }

  const containsFile = Object.values(payload).some(v => v instanceof File);

  if (containsFile) {
    const formData = new FormData();
    formData.append("_method", "PUT");
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value instanceof File ? value : String(value));
      }
    });
    // Laravel needs POST + _method=PUT to handle multipart PUT requests
    const data = await post<Cuti>(`cuti/${id}`, formData);
    return data as Cuti;
  }

  const data = await put<Cuti>(`cuti/${id}`, payload);
  return data as Cuti;
}

export async function deleteCuti(id: number): Promise<void> {
  await del(`cuti/${id}`);
}

export async function approveCuti(id: number): Promise<Cuti> {
  // If backend uses PATCH /cuti/:id/approve or similar
  // For now assumming specific endpoint or update status
  const data = await post<Cuti>(`cuti/${id}/approve`, {});
  return data as Cuti;
}

export async function rejectCuti(id: number): Promise<Cuti> {
  const data = await post<Cuti>(`cuti/${id}/reject`, {});
  return data as Cuti;
}
