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
  LandingGalleryItem,
  CreateLandingGalleryItemPayload,
  UpdateLandingGalleryItemPayload,
} from "../domain/entities";

export interface ListLandingGalleryParams {
  page?: number;
  per_page?: number;
  is_active?: boolean;
}

export async function listLandingGallery(
  params: ListLandingGalleryParams = {}
): Promise<{ items: LandingGalleryItem[]; meta: PaginatedMeta }> {
  const qs = buildQuery(params);
  const res = await getResponse<LandingGalleryItem[]>(
    qs ? `landing-gallery?${qs}` : "landing-gallery"
  );
  const data = Array.isArray(res.data) ? res.data : (res.data as { data?: LandingGalleryItem[] })?.data ?? [];
  return {
    items: data as LandingGalleryItem[],
    meta: res.meta ?? DEFAULT_META,
  };
}

export async function createLandingGalleryItem(
  payload: CreateLandingGalleryItemPayload
): Promise<LandingGalleryItem> {
  const form = new FormData();
  form.append("title", payload.title);
  form.append("image", payload.image);
  if (payload.sort_order != null) form.append("sort_order", String(payload.sort_order));
  if (payload.is_active !== undefined) form.append("is_active", payload.is_active ? "1" : "0");
  const data = await post<LandingGalleryItem>("landing-gallery", form);
  return data as LandingGalleryItem;
}

export async function getLandingGalleryItem(id: number): Promise<LandingGalleryItem> {
  const data = await get<LandingGalleryItem>(`landing-gallery/${id}`);
  return data as LandingGalleryItem;
}

export async function updateLandingGalleryItem(
  id: number,
  payload: UpdateLandingGalleryItemPayload
): Promise<LandingGalleryItem> {
  if (payload.image !== undefined) {
    const form = new FormData();
    if (payload.title !== undefined) form.append("title", payload.title);
    form.append("image", payload.image);
    if (payload.sort_order !== undefined) form.append("sort_order", payload.sort_order == null ? "" : String(payload.sort_order));
    if (payload.is_active !== undefined) form.append("is_active", payload.is_active ? "1" : "0");
    const data = await put<LandingGalleryItem>(`landing-gallery/${id}`, form);
    return data as LandingGalleryItem;
  }
  const body: Record<string, unknown> = {};
  if (payload.title !== undefined) body.title = payload.title;
  if (payload.sort_order !== undefined) body.sort_order = payload.sort_order;
  if (payload.is_active !== undefined) body.is_active = payload.is_active;
  const data = await put<LandingGalleryItem>(`landing-gallery/${id}`, body);
  return data as LandingGalleryItem;
}

export async function deleteLandingGalleryItem(id: number): Promise<void> {
  await del(`landing-gallery/${id}`);
}
