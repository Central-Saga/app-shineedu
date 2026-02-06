import { z } from "zod";

export const jenjangSchema = z.object({
  kode: z.string().min(1, "Kode wajib diisi"),
  nama: z.string().min(1, "Nama wajib diisi"),
  status: z.enum(["Aktif", "Non Aktif"]),
});

export type JenjangFormValues = z.infer<typeof jenjangSchema>;

export const programSchema = z.object({
  kode: z.string().min(1, "Kode wajib diisi"),
  nama: z.string().min(1, "Nama wajib diisi"),
  deskripsi: z.string().optional(),
  status: z.enum(["Aktif", "Non Aktif"]),
  is_highlight: z.boolean().default(false),
  jenjang_ids: z.array(z.number()).min(1, "Pilih minimal satu jenjang"),
});

export type ProgramFormValues = z.infer<typeof programSchema>;

export const paketSchema = z.object({
  kode: z.string().min(1, "Kode wajib diisi"),
  nama: z.string().min(1, "Nama wajib diisi"),
  tipe: z.string().min(1, "Tipe wajib diisi"), // Could be enum based on backend
  pertemuan_per_bulan: z.coerce.number().min(0).optional(),
  durasi_menit: z.coerce.number().min(1, "Durasi wajib diisi"),
  boleh_mix_mapel: z.boolean().default(false),
  max_mapel: z.coerce.number().min(1).optional(),
  bisa_tambah_pertemuan: z.boolean().default(false),
  bisa_ganti_hari: z.boolean().default(false),
  status: z.enum(["Aktif", "Non Aktif"]),
});

export type PaketFormValues = z.infer<typeof paketSchema>;

export const paketHargaSchema = z.object({
  program_id: z.coerce.number().min(1, "Program wajib dipilih"),
  jenjang_id: z.coerce.number().min(1, "Jenjang wajib dipilih"),
  paket_id: z.coerce.number().min(1, "Paket wajib dipilih"),
  min_siswa: z.coerce.number().min(1, "Minimal siswa 1"),
  max_siswa: z.coerce.number().min(1, "Maksimal siswa 1"),
  harga: z.coerce.number().min(0, "Harga tidak boleh negatif"),
  effective_from: z.string().optional(), // Date string YYYY-MM-DD
  effective_to: z.string().optional(),
  status: z.enum(["Aktif", "Non Aktif"]),
}).refine(data => data.max_siswa >= data.min_siswa, {
    message: "Max siswa harus >= Min siswa",
    path: ["max_siswa"]
});

export type PaketHargaFormValues = z.infer<typeof paketHargaSchema>;

export const lookupPriceSchema = z.object({
    program_id: z.string().min(1, "Pilih program"),
    jenjang_id: z.string().min(1, "Pilih jenjang"),
    paket_id: z.string().min(1, "Pilih paket"),
    jumlah_siswa: z.string().min(1, "Isi jumlah siswa"),
    tanggal: z.string().optional(),
});

export type LookupPriceFormValues = z.infer<typeof lookupPriceSchema>;
