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
  Blog,
  BlogAsset,
  CreateBlogPayload,
  UpdateBlogPayload,
  CreateBlogAssetPayload,
} from "../domain/entities";

export interface ListBlogsParams {
  page?: number;
  per_page?: number;
  status?: string;
  category?: string;
  q?: string;
}

export async function listBlogs(
  params: ListBlogsParams = {}
): Promise<{ items: Blog[]; meta: PaginatedMeta }> {
  const qs = buildQuery(params);
  const res = await getResponse<Blog[]>(
    qs ? `blogs?${qs}` : "blogs"
  );
  const data = Array.isArray(res.data) ? res.data : (res.data as { data?: Blog[] })?.data ?? [];
  return {
    items: data as Blog[],
    meta: res.meta ?? DEFAULT_META,
  };
}

export async function getBlog(id: number): Promise<Blog> {
  const data = await get<Blog>(`blogs/${id}`);
  return data as Blog;
}

export async function createBlog(payload: CreateBlogPayload): Promise<Blog> {
  const data = await post<Blog>("blogs", payload);
  return data as Blog;
}

export async function updateBlog(id: number, payload: UpdateBlogPayload): Promise<Blog> {
  const data = await put<Blog>(`blogs/${id}`, payload);
  return data as Blog;
}

export async function deleteBlog(id: number): Promise<void> {
  await del(`blogs/${id}`);
}

export async function uploadBlogAsset(
  blogId: number,
  payload: CreateBlogAssetPayload
): Promise<BlogAsset> {
  const form = new FormData();
  form.append("file", payload.file);
  if (payload.title != null) form.append("title", payload.title);
  if (payload.description != null) form.append("description", payload.description);
  const data = await post<BlogAsset>(`blogs/${blogId}/assets`, form);
  return data as BlogAsset;
}

export async function deleteBlogAsset(blogId: number, assetId: number): Promise<void> {
  await del(`blogs/${blogId}/assets/${assetId}`);
}
