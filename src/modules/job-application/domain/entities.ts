/**
 * Job Application entity – aligned with landing form (job-applications).
 * Used in app-shineedu (protected CRUD) and landing-shineedu (submit form).
 */

export type JobApplicationExperience =
  | "fresh-graduate"
  | "1-2"
  | "3-5"
  | "5-10"
  | "10+";

export type JobApplicationEducation =
  | "sma"
  | "d3"
  | "s1"
  | "s2"
  | "s3";

export type JobApplicationStatus =
  | "pending"
  | "reviewed"
  | "shortlisted"
  | "rejected"
  | "hired";

export interface JobVacancyPosition {
  id: number;
  title: string;
  location: string;
}

export interface JobApplication {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  position_id: number;
  experience: JobApplicationExperience;
  education: JobApplicationEducation;
  address: string;
  resume_url?: string | null;
  cover_letter_url?: string | null;
  status: JobApplicationStatus;
  tracking_code?: string | null;
  created_at?: string | null;
  updated_at?: string | null;

  /** From API relation */
  position?: JobVacancyPosition | null;
}

export interface CreateJobApplicationPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  position_id: number;
  experience: JobApplicationExperience;
  education: JobApplicationEducation;
  address: string;
  resume?: File | null;
  cover_letter?: File | null;
}

export interface UpdateJobApplicationPayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  position_id?: number;
  experience?: JobApplicationExperience;
  education?: JobApplicationEducation;
  address?: string;
  status?: JobApplicationStatus;
  resume?: File | null;
  cover_letter?: File | null;
}
