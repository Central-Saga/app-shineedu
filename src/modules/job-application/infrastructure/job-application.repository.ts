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
  JobApplication,
  CreateJobApplicationPayload,
  UpdateJobApplicationPayload,
} from "../domain/entities";

export interface ListJobApplicationParams {
  page?: number;
  per_page?: number;
  q?: string;
  position_id?: number | string;
  status?: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
}

export async function listJobApplications(
  params: ListJobApplicationParams = {}
): Promise<{ items: JobApplication[]; meta: PaginatedMeta }> {
  const qs = buildQuery(params);
  const res = await getResponse<JobApplication[]>(
    qs ? `job-applications?${qs}` : "job-applications"
  );
  return {
    items: (res.data ?? []) as JobApplication[],
    meta: res.meta ?? DEFAULT_META,
  };
}

export async function getJobApplicationDetail(
  id: number
): Promise<JobApplication> {
  const data = await get<JobApplication>(`job-applications/${id}`);
  return data as JobApplication;
}

export async function createJobApplication(
  payload: CreateJobApplicationPayload | FormData
): Promise<JobApplication> {
  if (payload instanceof FormData) {
    const data = await post<JobApplication>("job-applications", payload);
    return data as JobApplication;
  }

  const hasFile =
    payload.resume instanceof File || payload.cover_letter instanceof File;
  if (hasFile) {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(
          key,
          value instanceof File ? value : String(value)
        );
      }
    });
    const data = await post<JobApplication>("job-applications", formData);
    return data as JobApplication;
  }

  const data = await post<JobApplication>("job-applications", payload);
  return data as JobApplication;
}

export async function updateJobApplication(
  id: number,
  payload: UpdateJobApplicationPayload | FormData
): Promise<JobApplication> {
  if (payload instanceof FormData) {
    if (!payload.has("_method")) payload.append("_method", "PUT");
    const data = await post<JobApplication>(`job-applications/${id}`, payload);
    return data as JobApplication;
  }

  const hasFile =
    payload.resume instanceof File || payload.cover_letter instanceof File;
  if (hasFile) {
    const formData = new FormData();
    formData.append("_method", "PUT");
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(
          key,
          value instanceof File ? value : String(value)
        );
      }
    });
    const data = await post<JobApplication>(`job-applications/${id}`, formData);
    return data as JobApplication;
  }

  const data = await put<JobApplication>(`job-applications/${id}`, payload);
  return data as JobApplication;
}

export async function deleteJobApplication(id: number): Promise<void> {
  await del(`job-applications/${id}`);
}
