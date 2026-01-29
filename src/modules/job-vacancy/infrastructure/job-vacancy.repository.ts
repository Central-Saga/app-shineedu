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
  JobVacancy,
  CreateJobVacancyPayload,
  UpdateJobVacancyPayload,
} from "../domain/entities";

export interface ListJobVacancyParams {
  page?: number;
  per_page?: number;
  q?: string;
  is_active?: boolean | string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
}

export async function listJobVacancies(
  params: ListJobVacancyParams = {}
): Promise<{ items: JobVacancy[]; meta: PaginatedMeta }> {
  const qs = buildQuery(params);
  const res = await getResponse<JobVacancy[]>(
    qs ? `job-vacancies?${qs}` : "job-vacancies"
  );
  return {
    items: (res.data ?? []) as JobVacancy[],
    meta: res.meta ?? DEFAULT_META,
  };
}

export async function getJobVacancyDetail(id: number): Promise<JobVacancy> {
  const data = await get<JobVacancy>(`job-vacancies/${id}`);
  return data as JobVacancy;
}

export async function createJobVacancy(
  payload: CreateJobVacancyPayload
): Promise<JobVacancy> {
  const data = await post<JobVacancy>("job-vacancies", payload);
  return data as JobVacancy;
}

export async function updateJobVacancy(
  id: number,
  payload: UpdateJobVacancyPayload
): Promise<JobVacancy> {
  const data = await put<JobVacancy>(`job-vacancies/${id}`, payload);
  return data as JobVacancy;
}

export async function deleteJobVacancy(id: number): Promise<void> {
  await del(`job-vacancies/${id}`);
}
