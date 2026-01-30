/**
 * Learning Module - Domain Entities
 * TypeScript interfaces for Materi Modul and Assignment features
 */

// Material Module Types
export interface MateriModulItem {
  id: number;
  materi_modul_id: number;
  type: 'FILE' | 'URL';
  title: string;
  content?: string | null;
  url?: string | null;
  file_path?: string | null;
  file_url?: string | null;
  order_no: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MateriModul {
  id: number;
  title: string;
  description?: string | null;
  program_id?: number | null;
  program?: { id: number; nama: string } | null;
  jenjang_id?: number | null;
  jenjang?: { id: number; nama: string } | null;
  is_active: boolean;
  created_by: number;
  creator?: { id: number; name: string } | null;
  items?: MateriModulItem[];
  items_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateMateriModulRequest {
  title: string;
  description?: string;
  program_id?: number;
  jenjang_id?: number;
  is_active?: boolean;
  items?: Omit<MateriModulItem, 'id' | 'materi_modul_id' | 'created_at' | 'updated_at'>[];
}

export interface UpdateMateriModulRequest {
  title?: string;
  description?: string;
  program_id?: number;
  jenjang_id?: number;
  is_active?: boolean;
}

export interface CreateMateriItemRequest {
  type: MateriModulItem['type'];
  title: string;
  content?: string;
  url?: string;
  file_path?: string;
  order_no?: number;
  is_active?: boolean;
}

// Assignment Types
export type AssignmentStatus = 'ASSIGNED' | 'SUBMITTED' | 'REVIEWED' | 'CLOSED';
export type SubmissionStatus = 'SUBMITTED' | 'REVISION_REQUESTED' | 'ACCEPTED';

export interface AssignmentSubmission {
  id: number;
  assignment_id: number;
  submitted_by: number;
  submitted_by_user?: { id: number; name: string } | null;
  submitted_at?: string;
  content_text?: string | null;
  attachment_path?: string | null;
  attachment_url?: string | null;
  status: SubmissionStatus;
  reviewed_by?: number | null;
  reviewer?: { id: number; name: string } | null;
  reviewed_at?: string | null;
  feedback?: string | null;
  score?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface Assignment {
  id: number;
  enrollment_id: number;
  enrollment?: {
    id: number;
    kode_enrollment?: string;
    murid?: { id: number; nama_lengkap: string } | null;
  } | null;
  realisasi_jadwal_kerja_id?: number | null;
  sesi?: {
    id: number;
    tanggal: string;
    jam_mulai?: string;
    jam_selesai?: string;
  } | null;
  materi_modul_id?: number | null;
  materi_modul?: { id: number; title: string } | null;
  title: string;
  instructions?: string | null;
  attachment_type?: 'NONE' | 'FILE' | 'URL';
  attachment_url?: string | null;
  attachment_path?: string | null;
  attachment_file_url?: string | null;
  due_at?: string | null;
  is_overdue?: boolean;
  status: AssignmentStatus;
  assigned_by: number;
  assigned_by_user?: { id: number; name: string } | null;
  submissions_count?: number;
  latest_submission?: AssignmentSubmission | null;
  submissions?: AssignmentSubmission[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateAssignmentRequest {
  enrollment_id: number;
  realisasi_jadwal_kerja_id?: number;
  materi_modul_id?: number;
  title: string;
  instructions?: string;
  attachment_type?: 'NONE' | 'FILE' | 'URL';
  attachment_url?: string;
  attachment_file?: File;
  due_at?: string;
}

export interface UpdateAssignmentRequest {
  title?: string;
  instructions?: string;
  due_at?: string;
  status?: AssignmentStatus;
  materi_modul_id?: number;
  attachment_type?: 'NONE' | 'FILE' | 'URL';
  attachment_url?: string;
  attachment_file?: File;
}

export interface SubmitAssignmentRequest {
  content_text?: string;
  attachment?: File;
}

export interface ReviewSubmissionRequest {
  status: 'ACCEPTED' | 'REVISION_REQUESTED';
  feedback?: string;
  score?: number;
}
