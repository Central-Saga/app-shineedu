import { assessmentRepository } from "@/modules/assessment/infrastructure/assessment.repository";
import type { CreateTemplateInput } from "@/modules/assessment/domain/entities";

export const createTemplateUsecase = async (input: CreateTemplateInput) => {
  return await assessmentRepository.createTemplate(input);
};
