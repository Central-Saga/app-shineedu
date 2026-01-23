
import type { Employee } from "@/modules/employees/domain/entities";

export type JenisCuti = "izin" | "sakit";
export type StatusCuti = "diajukan" | "disetujui" | "ditolak" | "dibatalkan";

export interface Cuti {
  id: number;
  karyawan_id: number;
  jenis: JenisCuti;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  tanggal?: string;   // Legacy/Backwards compat
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
  start_date: string;
  end_date: string;
  catatan?: string | null;
  status?: StatusCuti;
}

export interface UpdateCutiPayload {
  karyawan_id?: number;
  jenis?: JenisCuti;
  start_date?: string;
  end_date?: string;
  catatan?: string | null;
  status?: StatusCuti;
  disetujui_oleh?: number | null;
}
