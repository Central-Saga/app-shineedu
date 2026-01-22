
export const PERIODE_VALUES = ["bulanan", "tahunan"] as const;
export const POTONGAN_TIPE_VALUES = ["per_hari", "flat", "none"] as const;

export type PeriodeCuti = (typeof PERIODE_VALUES)[number];
export type PotonganTipe = (typeof POTONGAN_TIPE_VALUES)[number];
export type JenisPengaturanCuti = "cuti" | "izin" | "sakit";

export interface PengaturanCuti {
  id: number;
  kategori_karyawan: string;
  subtipe_kontrak?: string | null;
  jenis: JenisPengaturanCuti;
  periode: PeriodeCuti;
  maksimal_pengajuan?: number | null; // null = unlimited
  minimal_hari_pengajuan: number;
  potongan_tipe: PotonganTipe;
  potongan_nilai?: number | null;
  aktif: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CreatePengaturanCutiPayload {
  kategori_karyawan: string;
  subtipe_kontrak?: string | null;
  jenis: JenisPengaturanCuti;
  periode: PeriodeCuti;
  maksimal_pengajuan?: number | null;
  minimal_hari_pengajuan: number;
  potongan_tipe: PotonganTipe;
  potongan_nilai?: number | null;
  aktif: boolean;
}

export interface UpdatePengaturanCutiPayload {
  kategori_karyawan?: string;
  subtipe_kontrak?: string | null;
  jenis?: JenisPengaturanCuti;
  periode?: PeriodeCuti;
  maksimal_pengajuan?: number | null;
  minimal_hari_pengajuan?: number;
  potongan_tipe?: PotonganTipe;
  potongan_nilai?: number | null;
  aktif?: boolean;
}
