/**
 * Assignment Repository
 * API client for assignments and submissions
 */
import {
  get,
  getResponse,
  post,
  put,
  upload,
  DEFAULT_META as SHARED_DEFAULT_META,
} from "@/shared/infrastructure/api/httpClient";
import { buildQuery } from "@/shared/lib/buildQuery";
import type { PaginatedMeta } from "@/shared/domain/types";
import type {
  Assignment,
  AssignmentSubmission,
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  ReviewSubmissionRequest,
} from "../domain/entities";

export const DEFAULT_META = SHARED_DEFAULT_META;

const BASE_URL = "assignments";

export const assignmentRepository = {
  /**
   * Get list of assignments with filters
   */
  getList: async (params: Record<string, unknown>): Promise<{ data: Assignment[]; meta: PaginatedMeta }> => {
    const qs = buildQuery(params);
    const res = await getResponse<Assignment[]>(qs ? `${BASE_URL}?${qs}` : BASE_URL);
    return { data: res.data || [], meta: res.meta || DEFAULT_META };
  },

  /**
   * Get single assignment by ID with submissions
   */
  getById: async (id: number | string): Promise<Assignment> => {
    return await get<Assignment>(`${BASE_URL}/${id}`);
  },

  /**
   * Create new assignment
   */
  create: async (data: CreateAssignmentRequest): Promise<Assignment> => {
    // If there's a file attachment, use FormData
    if (data.attachment_file) {
      const formData = new FormData();
      formData.append('enrollment_id', String(data.enrollment_id));
      if (data.realisasi_jadwal_kerja_id) formData.append('realisasi_jadwal_kerja_id', String(data.realisasi_jadwal_kerja_id));
      if (data.materi_modul_id) formData.append('materi_modul_id', String(data.materi_modul_id));
      formData.append('title', data.title);
      if (data.instructions) formData.append('instructions', data.instructions);
      if (data.attachment_type) formData.append('attachment_type', data.attachment_type);
      if (data.attachment_url) formData.append('attachment_url', data.attachment_url);
      formData.append('attachment_file', data.attachment_file);
      if (data.due_at) formData.append('due_at', data.due_at);
      
      return await post<Assignment>(BASE_URL, formData);
    }
    
    // Otherwise use regular JSON
    return await post<Assignment>(BASE_URL, data);
  },

  /**
   * Update assignment
   */
  update: async (id: number | string, data: UpdateAssignmentRequest): Promise<Assignment> => {
    // If there's a file attachment, use FormData
    if (data.attachment_file) {
      const formData = new FormData();
      if (data.title) formData.append('title', data.title);
      if (data.instructions) formData.append('instructions', data.instructions);
      if (data.due_at) formData.append('due_at', data.due_at);
      if (data.status) formData.append('status', data.status);
      if (data.materi_modul_id) formData.append('materi_modul_id', String(data.materi_modul_id));
      if (data.attachment_type) formData.append('attachment_type', data.attachment_type);
      if (data.attachment_url) formData.append('attachment_url', data.attachment_url);
      formData.append('attachment_file', data.attachment_file);
      formData.append('_method', 'PUT'); // Laravel method spoofing for FormData
      
      return await post<Assignment>(`${BASE_URL}/${id}`, formData);
    }
    
    // Otherwise use regular JSON
    return await put<Assignment>(`${BASE_URL}/${id}`, data);
  },

  /**
   * Close assignment
   */
  close: async (id: number | string): Promise<Assignment> => {
    return await post<Assignment>(`${BASE_URL}/${id}/close`, {});
  },

  // Submissions
  /**
   * Get submissions for an assignment
   */
  getSubmissions: async (assignmentId: number | string): Promise<AssignmentSubmission[]> => {
    return await get<AssignmentSubmission[]>(`${BASE_URL}/${assignmentId}/submissions`);
  },

  /**
   * Submit assignment (student)
   */
  submit: async (assignmentId: number | string, data: { content_text?: string }): Promise<AssignmentSubmission> => {
    return await post<AssignmentSubmission>(`${BASE_URL}/${assignmentId}/submissions`, data);
  },

  /**
   * Submit assignment with file (student)
   */
  submitWithFile: async (assignmentId: number | string, file: File, contentText?: string): Promise<AssignmentSubmission> => {
    return await upload<AssignmentSubmission>(
      `${BASE_URL}/${assignmentId}/submissions`,
      file,
      contentText ? { content_text: contentText } : {}
    );
  },

  /**
   * Submit assignment (handles both text and file)
   */
  submitAssignment: async (
    assignmentId: number | string, 
    data: { content_text?: string; attachment?: File }
  ): Promise<AssignmentSubmission> => {
    if (data.attachment) {
      return await assignmentRepository.submitWithFile(assignmentId, data.attachment, data.content_text);
    } else {
      return await assignmentRepository.submit(assignmentId, { content_text: data.content_text });
    }
  },

  /**
   * Review submission (tutor)
   */
  reviewSubmission: async (submissionId: number | string, data: ReviewSubmissionRequest): Promise<AssignmentSubmission> => {
    return await put<AssignmentSubmission>(`${BASE_URL}/submissions/${submissionId}/review`, data);
  },
};
