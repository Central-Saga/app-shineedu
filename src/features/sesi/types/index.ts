import { Enrollment } from "@/modules/enrollment/domain/entities";

export interface Sesi {
  id: number;
  tanggal: string; // YYYY-MM-DD
  hari_indo?: string; 
  jadwal_kerja_id: number;
  kelas_id: number;
  status_sesi: 'TERJADWAL' | 'BERJALAN' | 'SELESAI' | 'BATAL' | 'LIBUR';
  status_kehadiran_guru: 'HADIR' | 'IZIN' | 'SAKIT' | 'ALPHA' | 'DIGANTI';
  jam_mulai_plan: string; // HH:mm:ss
  jam_selesai_plan: string; // HH:mm:ss
  jam_mulai_aktual?: string | null;
  jam_selesai_aktual?: string | null;
  guru_pengajar?: { id: number; user?: { name: string } };
  guru_pengganti?: { id: number; user?: { name: string } };
  ruangan_kelas?: string | null;
  alasan_batal?: string | null;
  is_hangus: boolean; // Note: Resource doesn't show this, check if needed
  created_at?: string; // Optional in resource
  updated_at?: string; // Optional in resource

  // Relations
  kelas?: {
    id: number;
    nama_kelas: string;
    tipe_kelas: 'REGULER' | 'PRIVATE';
    mode_private?: 'INDIVIDU' | 'GROUP' | null;
    program?: { nama: string };
    jenjang?: { nama: string };
  };
}

export interface AbsensiItem {
  id?: number; // Might be null if not generated yet? usually attached to enrollment
  sesi_id: number;
  enrollment_id: number;
  status: 'HADIR' | 'IZIN' | 'SAKIT' | 'ALPHA' | 'BATAL';
  catatan?: string | null;
  
  // Relations
  enrollment?: Enrollment;
  murid?: {
    id: number;
    nama_lengkap: string;
    no_hp?: string;
  };
}

export interface LogbookSesi {
  sesi_id: number;
  ringkasan?: string | null;
  materi?: string | null;
  homework?: string | null;
  catatan_pengajar?: string | null;
}

export interface LogbookMuridItem {
  id?: number;
  sesi_id: number;
  enrollment_id: number;
  catatan_perkembangan?: string | null;
  kesulitan?: string | null;
  target_next?: string | null;
  tugas_individu?: string | null;
  nilai_opsional?: number | null;
  
  enrollment?: Enrollment;
  murid?: {
    id: number;
    nama_lengkap: string;
  };
}

export interface GenerateSesiRequest {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  sumber: "SYSTEM" | "MANUAL";
  auto_populate_absensi?: boolean;
}

export interface UpdateSesiRequest {
    tanggal?: string;
    status_sesi?: string;
    status_kehadiran_guru?: string;
    jam_mulai_aktual?: string;
    jam_selesai_aktual?: string;
    guru_pengganti_id?: number;
    ruangan_kelas?: string;
    alasan_batal?: string;
}

export interface BulkAbsensiRequest {
    items: {
        enrollment_id: number;
        status: string;
        catatan?: string | null;
    }[];
}

export interface BulkLogbookMuridRequest {
    items: {
        enrollment_id: number;
        catatan_perkembangan?: string;
        kesulitan?: string;
        target_next?: string;
        tugas_individu?: string;
        nilai_opsional?: number;
    }[];
}
