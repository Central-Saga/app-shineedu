export interface Enrollment {
  id: number;
  kode_enrollment: string | null;
  murid_id: number;
  program_id: number;
  jenjang_id: number;
  paket_id: number;
  jumlah_siswa: number;
  harga_final: number | string; // API might return string for decimal
  tanggal_mulai: string | null;
  tanggal_selesai: string | null;
  status: 'Aktif' | 'Pause' | 'Selesai' | 'Cancel';
  catatan: string | null;
  created_at: string;
  updated_at: string;
  
  // Relations (optional/loaded)
  murid?: {
    id: number;
    nama_lengkap: string;
    kode_murid: string;
    no_hp: string;
  };
  program?: {
    id: number;
    nama: string;
  };
  jenjang?: {
    id: number;
    nama: string;
  };
  paket?: {
    id: number;
    nama: string;
  };
  creator?: {
    id: number;
    name: string;
  };
}

export interface CreateEnrollmentRequest {
  murid_id?: number | null;
  murid_baru?: {
    nama_lengkap: string;
    no_hp: string;
    // Add other fields as needed for Murid creation
  } | null;
  program_id: number;
  jenjang_id: number;
  paket_id: number;
  jumlah_siswa: number;
  tanggal_mulai?: string;
  catatan?: string;
}

export interface UpdateEnrollmentRequest {
  tanggal_mulai?: string;
  tanggal_selesai?: string;
  status?: string;
  catatan?: string;
}

export interface PricePreviewRequest {
  program_id: number;
  jenjang_id: number;
  paket_id: number;
  jumlah_siswa: number;
  tanggal_mulai?: string;
}

// Re-export common types if needed
export type EnrollmentStatus = Enrollment['status'];
