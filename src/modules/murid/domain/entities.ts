export interface Murid {
  id: number;
  kode_murid?: string | null;
  nama_lengkap: string;
  jenis_kelamin?: "L" | "P" | null;
  tanggal_lahir?: string | null;
  no_hp: string;
  no_hp_display?: string | null; // Fallback to no_hp_wali if no_hp is empty
  email?: string | null;
  alamat?: string | null;
  
  jenjang_id?: number | null;
  jenjang?: { id: number; nama: string; kode: string } | null;
  
  sekolah_asal?: string | null;
  kelas_sekolah?: string | null;
  
  nama_wali?: string | null;
  no_hp_wali?: string | null;
  email_wali?: string | null;
  hubungan_wali?: string | null;
  
  catatan_khusus?: string | null;
  kebutuhan_khusus?: string | null;
  
  status: "Aktif" | "Non Aktif";
  created_at: string;
  updated_at: string;
}

export type CreateMuridPayload = Omit<Murid, "id" | "created_at" | "updated_at" | "jenjang">;
export type UpdateMuridPayload = Partial<CreateMuridPayload>;

// Bulk import types
export interface BulkCreateMuridItem {
  nama_lengkap: string;
  jenis_kelamin?: "L" | "P" | null;
  tanggal_lahir?: string | null;
  no_hp?: string | null;
  email?: string | null;
  alamat?: string | null;
  status?: "Aktif" | "Non Aktif" | null;
  password?: string | null;
}

export interface BulkCreateMuridPayload {
  items: BulkCreateMuridItem[];
  dry_run: boolean;
}

export interface BulkCreateResult {
  index: number;
  status: "created" | "valid" | "failed";
  id?: number;
  kode_murid?: string;
  nama_lengkap: string;
  errors?: Record<string, string[]>;
}

export interface BulkCreateResponse {
  total: number;
  created: number;
  failed: number;
  valid: number;
  dry_run: boolean;
  results: BulkCreateResult[];
}

