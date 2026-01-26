import { JadwalKerja } from "@/modules/jadwal-kerja/domain/entities";

export interface Kelas {
  id: number;
  kode_kelas: string;
  nama_kelas: string;
  program_id: number;
  jenjang_id: number;
  tipe_kelas: "REGULER" | "PRIVATE";
  mode_private?: "INDIVIDU" | "GROUP" | null;
  kapasitas?: number | null;
  status: "Draft" | "Aktif" | "Selesai" | "Non Aktif";
  periode_mulai?: string;
  periode_selesai?: string;
  ruangan_default?: string;
  catatan?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  program?: { id: number; nama: string };
  jenjang?: { id: number; nama: string };
  enrollments_count?: number;
  enrollments?: KelasEnrollment[];
  schedules?: JadwalKerja[];
}

export interface KelasEnrollment {
    id: number;
    murid_id: number;
    paket_id: number;
    kode_enrollment: string;
    
    murid?: {
        id: number;
        nama_lengkap: string;
        no_hp?: string;
    };
    paket?: {
        id: number;
        nama: string;
    };
    
    // Pivot data when accessed via Kelas
    pivot?: {
        tanggal_masuk: string;
        status_anggota: string;
    }
}
