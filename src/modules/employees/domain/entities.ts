export const KATEGORI_KARYAWAN_VALUES = ["tetap", "kontrak", "freelance"] as const;
export const SUBTIPE_KONTRAK_VALUES = ["full_time", "part_time"] as const;
export const TIPE_GAJI_VALUES = ["bulanan", "per_sesi"] as const;

export type KategoriKaryawan = (typeof KATEGORI_KARYAWAN_VALUES)[number];
export type SubtipeKontrak = (typeof SUBTIPE_KONTRAK_VALUES)[number];
export type TipeGaji = (typeof TIPE_GAJI_VALUES)[number];

export interface EmployeeUser {
  id: number;
  name: string;
  email: string;
}

export interface Employee {
  id: number;
  kode_karyawan: string;
  kategori_karyawan?: string | null;
  subtipe_kontrak?: string | null;
  tipe_gaji?: string | null;
  gaji_pokok?: string | number | null;
  bank?: { nama?: string | null; rekening?: string | null } | null;
  kontak?: { nomor_hp?: string | null; alamat?: string | null } | null;
  tanggal_lahir?: string | null;
  status: string;
  user?: EmployeeUser | null;
  created_at?: string | null;
  updated_at?: string | null;
  divisi?: string | null;
}

export interface CreateEmployeePayload {
  kode_karyawan: string;
  user_id: number;
  kategori_karyawan: string;
  subtipe_kontrak?: string | null;
  tipe_gaji?: string | null;
  gaji_pokok?: number | null;
  bank_nama?: string | null;
  bank_no_rekening?: string | null;
  nomor_hp?: string | null;
  alamat?: string | null;
  tanggal_lahir?: string | null;
  status: "aktif" | "nonaktif";
  divisi?: string | null;
}

export interface UpdateEmployeePayload {
  kode_karyawan?: string | null;
  user_id?: number | null;
  kategori_karyawan?: string | null;
  subtipe_kontrak?: string | null;
  tipe_gaji?: string | null;
  gaji_pokok?: number | null;
  bank_nama?: string | null;
  bank_no_rekening?: string | null;
  nomor_hp?: string | null;
  alamat?: string | null;
  tanggal_lahir?: string | null;
  status?: "aktif" | "nonaktif" | null;
  divisi?: string | null;
}
