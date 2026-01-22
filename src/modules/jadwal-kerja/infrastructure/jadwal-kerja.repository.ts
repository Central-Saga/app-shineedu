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
  JadwalKerja,
  CreateJadwalKerjaPayload,
  UpdateJadwalKerjaPayload,
} from "../domain/entities";

export interface ListJadwalKerjaParams {
  page?: number;
  per_page?: number;
  q?: string;
  status?: "Aktif" | "Non Aktif";
  kategori?: "coding" | "non_coding";
  hari?: string;
  guru_pengajar_id?: number | string;
  ruangan_kelas?: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
}

export async function listJadwalKerja(
  params: ListJadwalKerjaParams = {}
): Promise<{ items: JadwalKerja[]; meta: PaginatedMeta }> {
  const qs = buildQuery(params);
  const res = await getResponse<JadwalKerja[]>(
    qs ? `jadwal-kerja?${qs}` : "jadwal-kerja"
  );
  return { items: (res.data ?? []) as JadwalKerja[], meta: res.meta ?? DEFAULT_META };
}

export async function getJadwalKerja(id: number): Promise<JadwalKerja> {
  const data = await get<JadwalKerja>(`jadwal-kerja/${id}`);
  return data as JadwalKerja;
}

export async function createJadwalKerja(
  payload: CreateJadwalKerjaPayload
): Promise<JadwalKerja> {
  const data = await post<JadwalKerja>("jadwal-kerja", payload);
  return data as JadwalKerja;
}

export async function updateJadwalKerja(
  id: number,
  payload: UpdateJadwalKerjaPayload
): Promise<JadwalKerja> {
  const data = await put<JadwalKerja>(`jadwal-kerja/${id}`, payload);
  return data as JadwalKerja;
}

export async function deleteJadwalKerja(id: number): Promise<void> {
  await del(`jadwal-kerja/${id}`);
}
