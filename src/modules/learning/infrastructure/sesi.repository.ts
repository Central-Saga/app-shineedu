/**
 * Sesi Repository
 * API client for session materi and assignments
 */
import { get, post, del } from "@/shared/infrastructure/api/httpClient";

export interface MateriAssignment {
  materi_id: number;
  materi_title: string;
  assigned_to: {
    enrollment_id: number;
    murid_nama: string;
    accessed_at: string | null;
  }[];
  total_assigned: number;
  total_accessed: number;
}

export interface AssignmentAssignment {
  assignment_id: number;
  assignment_title: string;
  assigned_to: {
    enrollment_id: number;
    murid_nama: string;
  }[];
  total_assigned: number;
}

export interface SesiMateriAssignmentsResponse {
  materi: MateriAssignment[];
  assignments: AssignmentAssignment[];
}

export const sesiRepository = {
  /**
   * Get materi and assignments for a session
   */
  getMateriAssignments: async (sesiId: number | string): Promise<SesiMateriAssignmentsResponse> => {
    return await get<SesiMateriAssignmentsResponse>(`sesi/${sesiId}/materi-assignments`);
  },

  /**
   * Assign materi to session students
   */
  assignMateri: async (sesiId: number | string, materiModulId: number, enrollmentIds: number[]): Promise<void> => {
    return await post<void>(`sesi/${sesiId}/assign-materi`, { 
      materi_modul_id: materiModulId,
      enrollment_ids: enrollmentIds 
    });
  },

  /**
   * Unassign materi from session
   */
  unassignMateri: async (sesiId: number | string, materiId: number): Promise<void> => {
    return await del<void>(`sesi/${sesiId}/materi/${materiId}`);
  },

  /**
   * Assign assignment to session students
   */
  assignAssignment: async (sesiId: number | string, assignmentId: number, enrollmentIds: number[]): Promise<void> => {
    return await post<void>(`sesi/${sesiId}/assign-assignment`, { 
      assignment_id: assignmentId,
      enrollment_ids: enrollmentIds 
    });
  },

  /**
   * Unassign assignment from session
   */
  unassignAssignment: async (sesiId: number | string, assignmentId: number): Promise<void> => {
    return await del<void>(`sesi/${sesiId}/assignment/${assignmentId}`);
  },
};
