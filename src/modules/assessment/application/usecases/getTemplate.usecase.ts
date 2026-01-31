import { assessmentRepository } from "@/modules/assessment/infrastructure/assessment.repository";

export const getTemplateUsecase = async (id: number) => {
  return await assessmentRepository.getTemplate(id);
};
