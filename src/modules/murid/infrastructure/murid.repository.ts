import {
  get,
  getResponse,
  post,
  put,
  del,
  DEFAULT_META as SHARED_DEFAULT_META,
} from "@/shared/infrastructure/api/httpClient";
import { buildQuery } from "@/shared/lib/buildQuery";
import type { PaginatedMeta } from "@/shared/domain/types";
import type { Murid, CreateMuridPayload, UpdateMuridPayload } from "../domain/entities";

export const DEFAULT_META = SHARED_DEFAULT_META;

export interface ListMuridParams {
  page?: number;
  per_page?: number;
  q?: string;
  status?: string;
  jenjang_id?: number;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
}

export async function listMurids(
  params: ListMuridParams = {}
): Promise<{ items: Murid[]; meta: PaginatedMeta }> {
  const qs = buildQuery(params);
  const res = await getResponse<Murid[]>(qs ? `murid?${qs}` : "murid");
  return { items: (res.data ?? []) as Murid[], meta: res.meta ?? DEFAULT_META };
}

export async function createMurid(payload: CreateMuridPayload): Promise<Murid> {
  const data = await post<Murid>("murid", payload);
  return data as Murid;
}

export async function getMurid(id: number): Promise<Murid> {
  const data = await get<Murid>(`murid/${id}`);
  return data as Murid;
}

export async function updateMurid(
  id: number,
  payload: UpdateMuridPayload
): Promise<Murid> {
  const data = await put<Murid>(`murid/${id}`, payload);
  return data as Murid;
}

export async function deleteMurid(id: number): Promise<void> {
  await del(`murid/${id}`);
}
