import type { Employee } from "@/modules/employees/domain/entities";
import type { JadwalKerja } from "@/modules/jadwal-kerja/domain/entities";

export const REALISASI_JADWAL_STATUS_VALUES = ["diajukan", "disetujui", "ditolak"] as const;

export type RealisasiJadwalStatus = (typeof REALISASI_JADWAL_STATUS_VALUES)[number];

export interface RealisasiJadwal {
  id: number;
  tanggal: string;
  jadwal_kerja_id: number;
  jadwal_kerja?: JadwalKerja | null;
  status: RealisasiJadwalStatus;
  ruangan_kelas?: string | null;
  guru_pengajar_id?: number | null;
  guru_pengajar?: Employee | null;
  guru_pengganti_id?: number | null;
  guru_pengganti?: Employee | null;
  sumber?: string | null;
  catatan?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CreateRealisasiJadwalPayload {
  tanggal: string;
  jadwal_kerja_id: number;
  status: RealisasiJadwalStatus;
  ruangan_kelas?: string | null;
  guru_pengajar_id?: number | null;
  guru_pengganti_id?: number | null;
  sumber?: string | null;
  catatan?: string | null;
}

export interface UpdateRealisasiJadwalPayload extends Partial<CreateRealisasiJadwalPayload> {}
