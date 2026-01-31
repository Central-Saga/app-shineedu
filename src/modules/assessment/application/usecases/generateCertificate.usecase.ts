import { assessmentRepository } from "@/modules/assessment/infrastructure/assessment.repository";

export const generateCertificateUsecase = async (id: number) => {
  return await assessmentRepository.generateCertificate(id);
};
