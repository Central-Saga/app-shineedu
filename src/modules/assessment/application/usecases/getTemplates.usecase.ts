import { assessmentRepository } from "@/modules/assessment/infrastructure/assessment.repository";
import type { CertificateTemplate } from "@/modules/assessment/domain/entities";
import type { PaginatedResult } from "@/shared/domain/types";

export interface GetTemplatesParams {
  page?: number;
  per_page?: number;
  q?: string;
  type?: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
}

export const getTemplatesUsecase = async (
  params: GetTemplatesParams
): Promise<PaginatedResult<CertificateTemplate[]>> => {
  const { data, meta } = await assessmentRepository.getTemplates(
    params as Record<string, unknown>
  );
  return { items: data, meta };
};
