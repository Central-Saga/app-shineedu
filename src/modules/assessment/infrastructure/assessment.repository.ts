import {
  get,
  getResponse,
  post,
  DEFAULT_META,
} from "@/shared/infrastructure/api/httpClient";
import { buildQuery } from "@/shared/lib/buildQuery";
import type { PaginatedMeta } from "@/shared/domain/types";
import type {
  AssessmentGrade,
  CertificateTemplate,
  CreateGradeInput,
  CreateTemplateInput,
} from "../domain/entities";

const TEMPLATES_URL = "assessment/templates";
const GRADES_URL = "assessment/grades";

export const assessmentRepository = {
  // --- Templates ---
  getTemplates: async (
    params: Record<string, unknown>
  ): Promise<{ data: CertificateTemplate[]; meta: PaginatedMeta }> => {
    const qs = buildQuery(params);
    const res = await getResponse<CertificateTemplate[]>(
      qs ? `${TEMPLATES_URL}?${qs}` : TEMPLATES_URL
    );
    return { data: res.data || [], meta: res.meta || DEFAULT_META };
  },

  getTemplate: async (id: number): Promise<CertificateTemplate> => {
    return await get<CertificateTemplate>(`${TEMPLATES_URL}/${id}`);
  },

  createTemplate: async (input: CreateTemplateInput) => {
    // Need FormData for file upload
    const formData = new FormData();
    formData.append("name", input.name);
    formData.append("type", input.type);
    formData.append("data_mapping", input.data_mapping);
    formData.append("cover_image", input.cover_image);
    if (input.result_image) {
      formData.append("result_image", input.result_image);
    }

    const res = await post<CertificateTemplate>(TEMPLATES_URL, formData);
    return { data: res };
  },

  // --- Grades ---
  getGrades: async (
    params: Record<string, unknown>
  ): Promise<{ data: AssessmentGrade[]; meta: PaginatedMeta }> => {
    const qs = buildQuery(params);
    const res = await getResponse<AssessmentGrade[]>(
      qs ? `${GRADES_URL}?${qs}` : GRADES_URL
    );
    return { data: res.data || [], meta: res.meta || DEFAULT_META };
  },

  getGrade: async (id: number): Promise<AssessmentGrade> => {
    return await get<AssessmentGrade>(`${GRADES_URL}/${id}`);
  },

  createGrade: async (input: CreateGradeInput) => {
    const res = await post<AssessmentGrade>(GRADES_URL, input);
    return { data: res };
  },

  generateCertificate: async (id: number) => {
    // Returns { url: string, certificate_no: string, generated_at: string }
    const res = await post<{
      url: string;
      certificate_no: string;
      generated_at: string;
    }>(`${GRADES_URL}/${id}/generate`, {});
    return { data: res };
  },
};
