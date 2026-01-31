export type CertificateType = "english" | "computer";

export interface CertificateTemplate {
  id: number;
  name: string;
  type: CertificateType;
  cover_image: string | null;
  result_image: string | null;
  // data_mapping is JSON object.
  // We can type it loosely or strictly. Keeping it Record<string, any> for flexibility based on backend.
  data_mapping: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AssessmentGrade {
  id: number;
  enrollment_id: number;
  certificate_template_id: number;
  teacher_karyawan_id: number | null;
  // scores is JSON. e.g. { grammar: 90, speaking: 80 }
  scores: Record<string, number>;
  total_score: number; // Decimal string from backend usually comes as string or number? PHP decimal -> string usually. Let's assume number if auto-converted or string. Helper checks show it might be string. Let's use string | number to be safe or number if FE parses it.
  // Actually, standard ApiResponse T usually keeps JSON types. Laravel numeric strings.
  // Let's use string for decimals to be safe as per standard Laravel-JSON serialization.
  average_score: string | number; 
  predicate: string;
  certificate_level: string | null;
  certificate_no: string | null;
  generated_at: string | null;
  payload_snapshot: any | null;
  created_at: string;
  updated_at: string;

  // Relations (often included)
  enrollment?: {
    id: number;
    student?: {
        id: number;
        nama_lengkap: string;
    };
    program?: {
        id: number;
        nama: string;
    };
  };
  certificate_template?: CertificateTemplate;
  teacher?: {
    id: number;
    nama: string; // from Employee -> User
  };
}

// Requests
export interface CreateTemplateInput {
  name: string;
  type: CertificateType;
  cover_image: File;
  result_image?: File;
  data_mapping: string; // JSON string for multipart
}

export interface CreateGradeInput {
  enrollment_id: number;
  certificate_template_id: number;
  teacher_karyawan_id?: number;
  scores: Record<string, number>;
}
