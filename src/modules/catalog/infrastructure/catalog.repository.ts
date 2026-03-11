import {
  get,
  getResponse,
  post,
  put,
  postFormData,
  del,
  download,
  DEFAULT_META,
} from "@/shared/infrastructure/api/httpClient";
import { buildQuery } from "@/shared/lib/buildQuery";
import type { PaginatedMeta } from "@/shared/domain/types";
import type {
  Jenjang,
  Program,
  Paket,
  PaketHarga,
  CreateJenjangPayload,
  UpdateJenjangPayload,
  CreateProgramPayload,
  UpdateProgramPayload,
  CreatePaketPayload,
  UpdatePaketPayload,
  CreatePaketHargaPayload,
  UpdatePaketHargaPayload,
  PricingLookupResult,
  LookupPriceParams,
} from "../domain/entities";

// --- Types ---
export interface ListParams {
  page?: number;
  per_page?: number;
  q?: string;
  status?: "Aktif" | "Non Aktif";
  sort_by?: string;
  sort_dir?: "asc" | "desc";
  jenjang_id?: number;
  program_id?: number;
}

export interface ListPaketHargaParams extends ListParams {
  program_id?: number;
  jenjang_id?: number;
  paket_id?: number;
}

// --- Jenjang ---
export async function listJenjang(
  params: ListParams = {}
): Promise<{ items: Jenjang[]; meta: PaginatedMeta }> {
  const qs = buildQuery(params);
  const res = await getResponse<Jenjang[]>(qs ? `catalog/jenjang?${qs}` : "catalog/jenjang");
  return { items: (res.data ?? []) as Jenjang[], meta: res.meta ?? DEFAULT_META };
}

export async function getJenjang(id: number): Promise<Jenjang> {
  return await get<Jenjang>(`catalog/jenjang/${id}`);
}

export async function createJenjang(payload: CreateJenjangPayload): Promise<Jenjang> {
  return await post<Jenjang>("catalog/jenjang", payload);
}

export async function updateJenjang(id: number, payload: UpdateJenjangPayload): Promise<Jenjang> {
  return await put<Jenjang>(`catalog/jenjang/${id}`, payload);
}

export async function deleteJenjang(id: number): Promise<void> {
  await del(`catalog/jenjang/${id}`);
}

// --- Program ---
export async function listProgram(
  params: ListParams = {}
): Promise<{ items: Program[]; meta: PaginatedMeta }> {
  const qs = buildQuery(params);
  const res = await getResponse<Program[]>(qs ? `catalog/program?${qs}` : "catalog/program");
  return { items: (res.data ?? []) as Program[], meta: res.meta ?? DEFAULT_META };
}

export async function getProgram(id: number): Promise<Program> {
  return await get<Program>(`catalog/program/${id}`);
}

export async function createProgram(payload: CreateProgramPayload): Promise<Program> {
  return await post<Program>("catalog/program", payload);
}

export async function updateProgram(id: number, payload: UpdateProgramPayload): Promise<Program> {
  return await put<Program>(`catalog/program/${id}`, payload);
}

/** Upload gambar katalog program; mengembalikan path untuk disimpan di field image. */
export async function uploadProgramImage(file: File): Promise<{ path: string; image_url: string }> {
  const formData = new FormData();
  formData.append("image", file);
  return await postFormData<{ path: string; image_url: string }>("catalog/program/upload-image", formData);
}

export async function deleteProgram(id: number): Promise<void> {
  await del(`catalog/program/${id}`);
}

// --- Paket ---
export async function listPaket(
  params: ListParams = {}
): Promise<{ items: Paket[]; meta: PaginatedMeta }> {
  const qs = buildQuery(params);
  const res = await getResponse<Paket[]>(qs ? `catalog/paket?${qs}` : "catalog/paket");
  return { items: (res.data ?? []) as Paket[], meta: res.meta ?? DEFAULT_META };
}

export async function getPaket(id: number): Promise<Paket> {
  return await get<Paket>(`catalog/paket/${id}`);
}

export async function createPaket(payload: CreatePaketPayload): Promise<Paket> {
  return await post<Paket>("catalog/paket", payload);
}

export async function updatePaket(id: number, payload: UpdatePaketPayload): Promise<Paket> {
  return await put<Paket>(`catalog/paket/${id}`, payload);
}

export async function deletePaket(id: number): Promise<void> {
  await del(`catalog/paket/${id}`);
}

// --- Paket Harga ---
export async function listPaketHarga(
  params: ListPaketHargaParams = {}
): Promise<{ items: PaketHarga[]; meta: PaginatedMeta }> {
  const qs = buildQuery(params);
  const res = await getResponse<PaketHarga[]>(qs ? `catalog/harga?${qs}` : "catalog/harga");
  return { items: (res.data ?? []) as PaketHarga[], meta: res.meta ?? DEFAULT_META };
}

export async function getPaketHarga(id: number): Promise<PaketHarga> {
  return await get<PaketHarga>(`catalog/harga/${id}`);
}

export async function createPaketHarga(payload: CreatePaketHargaPayload): Promise<PaketHarga> {
  return await post<PaketHarga>("catalog/harga", payload);
}

export async function updatePaketHarga(id: number, payload: UpdatePaketHargaPayload): Promise<PaketHarga> {
  return await put<PaketHarga>(`catalog/harga/${id}`, payload);
}

export async function deletePaketHarga(id: number): Promise<void> {
  await del(`catalog/harga/${id}`);
}

export async function lookupPrice(params: LookupPriceParams): Promise<PricingLookupResult> {
  const qs = buildQuery(params);
  const res = await get<{ id: number; harga: number; min: number; max: number }>(`catalog/harga/lookup?${qs}`);
  // Map response to result if needed, assuming backend returns full object or custom
  // Based on backend implementation we probably get a PaketHarga resource
  // Let's assume backend returns PaketHargaResource
  return {
    harga: res.harga,
    rule: res as unknown as PricingLookupResult["rule"],
  };
}

export async function exportJenjang(format: string, params?: ListParams): Promise<void> {
  return download("catalog/jenjang/export", { ...params, export: format });
}

export async function exportProgram(format: string, params?: ListParams): Promise<void> {
  return download("catalog/program/export", { ...params, export: format });
}

export async function exportPaket(format: string, params?: ListParams): Promise<void> {
  return download("catalog/paket/export", { ...params, export: format });
}

export async function exportPaketHarga(format: string, params?: ListPaketHargaParams): Promise<void> {
  return download("catalog/harga/export", { ...params, export: format });
}
