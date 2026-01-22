
import type { Employee } from "@/modules/employees/domain/entities";

export type JenisCuti = "cuti" | "izin" | "sakit";
export type StatusCuti = "diajukan" | "disetujui" | "ditolak" | "dibatalkan";

export interface Cuti {
  id: number;
  karyawan_id: number;
  jenis: JenisCuti;
  tanggal: string; // YYYY-MM-DD
  status: StatusCuti;
  catatan?: string | null;
  disetujui_oleh?: number | null; // User ID
  created_at?: string | null;
  updated_at?: string | null;

  karyawan?: Employee | null;
  approver?: { id: number; name: string } | null;
}

export interface CreateCutiPayload {
  karyawan_id: number;
  jenis: JenisCuti;
  tanggal: string;
  catatan?: string | null;
  status?: StatusCuti;
}

export interface UpdateCutiPayload {
  karyawan_id?: number;
  jenis?: JenisCuti;
  tanggal?: string;
  catatan?: string | null;
  status?: StatusCuti;
  disetujui_oleh?: number | null;
}
