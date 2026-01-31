import { assessmentRepository } from "@/modules/assessment/infrastructure/assessment.repository";
import type { CreateGradeInput } from "@/modules/assessment/domain/entities";

export const createGradeUsecase = async (input: CreateGradeInput) => {
  return await assessmentRepository.createGrade(input);
};
