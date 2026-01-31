import {
  get,
  getResponse,
  post,
  put,
  postFormData,
  putFormData,
  del,
  DEFAULT_META,
} from "@/shared/infrastructure/api/httpClient";
import { buildQuery } from "@/shared/lib/buildQuery";
import type { PaginatedMeta } from "@/shared/domain/types";
import type {
  BlogPost,
  CreateBlogPostPayload,
  UpdateBlogPostPayload,
} from "../domain/entities";

function buildBlogFormData(
  payload: CreateBlogPostPayload | UpdateBlogPostPayload,
  imageFile?: File | null,
  removeImage?: boolean
): FormData {
  const form = new FormData();
  if ("title" in payload && payload.title !== undefined) form.append("title", payload.title);
  form.append("content", payload.content ?? "");
  form.append("excerpt", payload.excerpt ?? "");
  if (payload.status !== undefined) form.append("status", payload.status);
  form.append("category", payload.category ?? "");
  if (imageFile) form.append("image", imageFile);
  if (removeImage) form.append("remove_image", "1");
  return form;
}

export interface ListBlogParams {
  page?: number;
  per_page?: number;
  q?: string;
  status?: string;
  category?: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
}

export async function listBlogPosts(
  params: ListBlogParams = {}
): Promise<{ items: BlogPost[]; meta: PaginatedMeta }> {
  const qs = buildQuery(params);
  const res = await getResponse<BlogPost[]>(
    qs ? `landing-blog?${qs}` : "landing-blog"
  );
  const items = (res.data ?? []) as BlogPost[];
  return {
    items: Array.isArray(items) ? items : [],
    meta: (res.meta ?? DEFAULT_META) as PaginatedMeta,
  };
}

export async function getBlogPostDetail(id: number): Promise<BlogPost> {
  const data = await get<BlogPost>(`landing-blog/${id}`);
  return data as BlogPost;
}

export async function createBlogPost(
  payload: CreateBlogPostPayload,
  imageFile?: File | null
): Promise<BlogPost> {
  if (imageFile) {
    const form = buildBlogFormData(payload, imageFile);
    const data = await postFormData<BlogPost>("landing-blog", form);
    return data as BlogPost;
  }
  const data = await post<BlogPost>("landing-blog", payload);
  return data as BlogPost;
}

export async function updateBlogPost(
  id: number,
  payload: UpdateBlogPostPayload,
  imageFile?: File | null,
  removeImage?: boolean
): Promise<BlogPost> {
  if (imageFile || removeImage) {
    const form = buildBlogFormData(payload, imageFile ?? null, removeImage);
    const data = await putFormData<BlogPost>(`landing-blog/${id}`, form);
    return data as BlogPost;
  }
  const data = await put<BlogPost>(`landing-blog/${id}`, payload);
  return data as BlogPost;
}

export async function deleteBlogPost(id: number): Promise<void> {
  await del(`landing-blog/${id}`);
}
