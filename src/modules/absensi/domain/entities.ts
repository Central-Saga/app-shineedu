
import type { Employee } from "@/modules/employees/domain/entities";

export type StatusKehadiran = "hadir" | "izin" | "cuti" | "sakit" | "alpha";
export type SumberAbsen = "mesin" | "web" | "mobile" | "manual";

export interface Absensi {
  id: number;
  karyawan_id: number;
  tanggal: string; // YYYY-MM-DD
  status_kehadiran: StatusKehadiran;
  jam_masuk?: string | null; // HH:mm:ss
  jam_pulang?: string | null; // HH:mm:ss
  durasi_menit?: number | null;
  sumber_absen?: SumberAbsen | null;
  catatan?: string | null;
  created_at?: string | null;
  updated_at?: string | null;

  karyawan?: Employee | null;
}

export interface CreateAbsensiPayload {
  karyawan_id: number;
  tanggal: string;
  status_kehadiran: StatusKehadiran;
  jam_masuk?: string | null;
  jam_pulang?: string | null;
  sumber_absen?: SumberAbsen | null;
  catatan?: string | null;
}

export interface UpdateAbsensiPayload {
  karyawan_id?: number;
  tanggal?: string;
  status_kehadiran?: StatusKehadiran;
  jam_masuk?: string | null;
  jam_pulang?: string | null;
  sumber_absen?: SumberAbsen | null;
  catatan?: string | null;
}
