import type { Employee } from "@/modules/employees/domain/entities";

export const JADWAL_KERJA_KATEGORI_VALUES = ["coding", "non_coding"] as const;
export const JADWAL_KERJA_STATUS_VALUES = ["Aktif", "Non Aktif"] as const;

export type JadwalKerjaKategori = (typeof JADWAL_KERJA_KATEGORI_VALUES)[number];
export type JadwalKerjaStatus = (typeof JADWAL_KERJA_STATUS_VALUES)[number];

export interface JadwalKerja {
  id: number;
  kategori: JadwalKerjaKategori;
  mata_pelajaran: string;
  hari: string;
  nomor_sesi: string;
  jam_mulai: string;
  jam_selesai: string;
  tarif: number | string;
  status: JadwalKerjaStatus;
  ruangan_kelas?: string | null;
  guru_pengajar_id: number;
  guru_pengajar?: Employee | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CreateJadwalKerjaPayload {
  kategori: JadwalKerjaKategori;
  mata_pelajaran: string;
  hari: string;
  nomor_sesi: string;
  jam_mulai: string;
  jam_selesai: string;
  tarif: number;
  status: JadwalKerjaStatus;
  ruangan_kelas?: string | null;
  guru_pengajar_id: number;
}

export interface UpdateJadwalKerjaPayload extends Partial<CreateJadwalKerjaPayload> {}

export interface BulkCreateJadwalKerjaItem {
  kategori: JadwalKerjaKategori;
  mata_pelajaran?: string | null;
  hari: string;
  nomor_sesi?: string | null;
  jam_mulai: string;
  jam_selesai: string;
  tarif: number;
  status: JadwalKerjaStatus;
  ruangan_kelas?: string | null;
  guru_pengajar_id: number;
  kelas_id?: number | null;
}

export interface BulkCreateJadwalKerjaPayload {
  items: BulkCreateJadwalKerjaItem[];
  dry_run: boolean;
}

export interface BulkCreateJadwalKerjaResult {
  index: number;
  status: "created" | "valid" | "failed";
  id?: number;
  errors?: Record<string, string[]>;
}

export interface BulkCreateJadwalKerjaResponse {
  total: number;
  created: number;
  failed: number;
  valid: number;
  dry_run: boolean;
  results: BulkCreateJadwalKerjaResult[];
}
