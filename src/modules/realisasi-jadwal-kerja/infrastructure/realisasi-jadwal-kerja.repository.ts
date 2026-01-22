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
  RealisasiJadwal,
  CreateRealisasiJadwalPayload,
  UpdateRealisasiJadwalPayload,
} from "../domain/entities";

export interface ListRealisasiJadwalParams {
  page?: number;
  per_page?: number;
  q?: string;
  status?: "diajukan" | "disetujui" | "ditolak";
  tanggal?: string;
  jadwal_kerja_id?: number | string;
  guru_pengajar_id?: number | string;
  guru_pengganti_id?: number | string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
}

export async function listRealisasiJadwal(
  params: ListRealisasiJadwalParams = {}
): Promise<{ items: RealisasiJadwal[]; meta: PaginatedMeta }> {
  const qs = buildQuery(params);
  const res = await getResponse<RealisasiJadwal[]>(
    qs ? `realisasi-jadwal-kerja?${qs}` : "realisasi-jadwal-kerja"
  );
  return { items: (res.data ?? []) as RealisasiJadwal[], meta: res.meta ?? DEFAULT_META };
}

export async function getRealisasiJadwal(id: number): Promise<RealisasiJadwal> {
  const data = await get<RealisasiJadwal>(`realisasi-jadwal-kerja/${id}`);
  return data as RealisasiJadwal;
}

export async function createRealisasiJadwal(
  payload: CreateRealisasiJadwalPayload
): Promise<RealisasiJadwal> {
  const data = await post<RealisasiJadwal>("realisasi-jadwal-kerja", payload);
  return data as RealisasiJadwal;
}

export async function updateRealisasiJadwal(
  id: number,
  payload: UpdateRealisasiJadwalPayload
): Promise<RealisasiJadwal> {
  const data = await put<RealisasiJadwal>(`realisasi-jadwal-kerja/${id}`, payload);
  return data as RealisasiJadwal;
}

export async function deleteRealisasiJadwal(id: number): Promise<void> {
  await del(`realisasi-jadwal-kerja/${id}`);
}
