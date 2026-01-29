/**
 * Job Vacancy entity – aligned with landing detail (title, type, location, description, requirements, responsibilities, benefits).
 */

export interface JobVacancy {
  id: number;
  title: string;
  location?: string | null;
  employment_type?: string | null;
  description?: string | null;
  posted_at?: string | null;
  end_at?: string | null;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CreateJobVacancyPayload {
  title: string;
  location?: string | null;
  employment_type?: string | null;
  description?: string | null;
  posted_at?: string | null;
  end_at?: string | null;
  requirements?: string[];
  responsibilities?: string[];
  benefits?: string[];
  is_active?: boolean;
}

export interface UpdateJobVacancyPayload {
  title?: string;
  location?: string | null;
  employment_type?: string | null;
  description?: string | null;
  posted_at?: string | null;
  end_at?: string | null;
  requirements?: string[];
  responsibilities?: string[];
  benefits?: string[];
  is_active?: boolean;
}
