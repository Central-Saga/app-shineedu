import { z } from "zod";

export interface MuridFormValues {
  nama_lengkap: string;
  kode_murid: string | null;
  jenis_kelamin: "L" | "P" | null;
  tanggal_lahir: string | null;
  no_hp: string | null;
  email: string | null;
  alamat: string | null;
  jenjang_id: number | null;
  sekolah_asal: string | null;
  kelas_sekolah: string | null;
  nama_wali: string | null;
  no_hp_wali: string | null;
  email_wali: string | null;
  hubungan_wali: string | null;
  catatan_khusus: string | null;
  kebutuhan_khusus: string | null;
  status: "Aktif" | "Non Aktif";
  password?: string | null;
}

export const muridSchema = z.object({
  nama_lengkap: z.string().min(1, "Nama lengkap harus diisi"),
  kode_murid: z.string().nullable().default(null),
  jenis_kelamin: z.preprocess((val) => (val === "" ? null : val), z.enum(["L", "P"]).nullable()).default(null),
  tanggal_lahir: z.preprocess((val) => (val === "" || val === undefined ? null : val), z.string().nullable()).default(null),
  no_hp: z.preprocess((val) => (val === "" ? null : val), z.string().min(8, "Nomor HP minimal 8 digit").nullable()).default(null),
  email: z.preprocess((val) => (val === "" ? null : val), z.string().email("Email tidak valid").nullable().or(z.literal(null))).default(null),
  alamat: z.string().nullable().default(null),
  jenjang_id: z.preprocess((val) => (val === "" ? null : Number(val)), z.number().nullable().default(null)),
  sekolah_asal: z.string().nullable().default(null),
  kelas_sekolah: z.string().nullable().default(null),
  nama_wali: z.string().nullable().default(null),
  no_hp_wali: z.string().nullable().default(null),
  email_wali: z.preprocess((val) => (val === "" ? null : val), z.string().email("Email wali tidak valid").nullable().or(z.literal(null))).default(null),
  hubungan_wali: z.string().nullable().default(null),
  catatan_khusus: z.string().nullable().default(null),
  kebutuhan_khusus: z.string().nullable().default(null),
  status: z.enum(["Aktif", "Non Aktif"]),
  password: z.string().optional().nullable(),
});
