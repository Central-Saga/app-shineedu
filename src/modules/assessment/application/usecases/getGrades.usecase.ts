import { assessmentRepository } from "@/modules/assessment/infrastructure/assessment.repository";
import type { AssessmentGrade } from "@/modules/assessment/domain/entities";
import type { PaginatedResult } from "@/shared/domain/types";

export interface GetGradesParams {
  page?: number;
  per_page?: number;
  q?: string;
  type?: string; 
  generated_status?: "generated" | "not_generated";
  sort_by?: string;
  sort_dir?: "asc" | "desc";
}

export const getGradesUsecase = async (
  params: GetGradesParams
): Promise<PaginatedResult<AssessmentGrade[]>> => {
  const { data, meta } = await assessmentRepository.getGrades(
    params as Record<string, unknown>
  );
  return { items: data, meta };
};
