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
