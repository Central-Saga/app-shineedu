import { assessmentRepository } from "@/modules/assessment/infrastructure/assessment.repository";

export const getGradeUsecase = async (id: number) => {
  return await assessmentRepository.getGrade(id);
};
