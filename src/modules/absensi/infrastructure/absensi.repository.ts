
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
  Absensi,
  CreateAbsensiPayload,
  UpdateAbsensiPayload,
} from "../domain/entities";

export interface ListAbsensiParams {
  page?: number;
  per_page?: number;
  q?: string;
  karyawan_id?: number | string;
  status_kehadiran?: string;
  start_date?: string;
  end_date?: string;
  sumber_absen?: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
}

export async function listAbsensi(
  params: ListAbsensiParams = {}
): Promise<{ items: Absensi[]; meta: PaginatedMeta }> {
  const qs = buildQuery(params);
  const res = await getResponse<Absensi[]>(qs ? `absensi?${qs}` : "absensi");
  return { items: (res.data ?? []) as Absensi[], meta: res.meta ?? DEFAULT_META };
}

export async function createAbsensi(
  payload: CreateAbsensiPayload
): Promise<Absensi> {
  const data = await post<Absensi>("absensi", payload);
  return data as Absensi;
}

export async function getAbsensiDetail(id: number): Promise<Absensi> {
  const data = await get<Absensi>(`absensi/${id}`);
  return data as Absensi;
}

export async function updateAbsensi(
  id: number,
  payload: UpdateAbsensiPayload
): Promise<Absensi> {
  const data = await put<Absensi>(`absensi/${id}`, payload);
  return data as Absensi;
}

export async function deleteAbsensi(id: number): Promise<void> {
  await del(`absensi/${id}`);
}
