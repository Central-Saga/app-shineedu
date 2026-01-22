
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
  PengaturanCuti,
  CreatePengaturanCutiPayload,
  UpdatePengaturanCutiPayload,
} from "../domain/entities";

export interface ListPengaturanCutiParams {
  page?: number;
  per_page?: number;
  q?: string;
  kategori_karyawan?: string;
  subtipe_kontrak?: string;
  jenis?: string;
  periode?: string;
  aktif?: boolean | number | string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
}

export async function listPengaturanCuti(
  params: ListPengaturanCutiParams = {}
): Promise<{ items: PengaturanCuti[]; meta: PaginatedMeta }> {
  const qs = buildQuery(params);
  const res = await getResponse<PengaturanCuti[]>(
    qs ? `pengaturan-cuti?${qs}` : "pengaturan-cuti"
  );
  return {
    items: (res.data ?? []) as PengaturanCuti[],
    meta: res.meta ?? DEFAULT_META,
  };
}

export async function createPengaturanCuti(
  payload: CreatePengaturanCutiPayload
): Promise<PengaturanCuti> {
  const data = await post<PengaturanCuti>("pengaturan-cuti", payload);
  return data as PengaturanCuti;
}

export async function getPengaturanCutiDetail(
  id: number
): Promise<PengaturanCuti> {
  const data = await get<PengaturanCuti>(`pengaturan-cuti/${id}`);
  return data as PengaturanCuti;
}

export async function updatePengaturanCuti(
  id: number,
  payload: UpdatePengaturanCutiPayload
): Promise<PengaturanCuti> {
  const data = await put<PengaturanCuti>(`pengaturan-cuti/${id}`, payload);
  return data as PengaturanCuti;
}

export async function deletePengaturanCuti(id: number): Promise<void> {
  await del(`pengaturan-cuti/${id}`);
}
