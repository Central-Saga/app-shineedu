
import { z } from "zod";

export const createKelasSchema = z.object({
  nama_kelas: z.string().min(1, "Nama kelas wajib diisi"),
  program_id: z.number().min(1, "Program wajib dipilih").optional(),
  jenjang_id: z.number().min(1, "Jenjang wajib dipilih").optional(),
  tipe_kelas: z.enum(["REGULER", "PRIVATE"], {
    message: "Tipe kelas wajib dipilih",
  }),
  mode_private: z.enum(["INDIVIDU", "GROUP"]).optional().nullable(),
  kapasitas: z.coerce.number().min(1, "Kapasitas minimal 1").optional().nullable(),
  status: z.enum(["Draft", "Aktif", "Selesai", "Non Aktif"]).default("Aktif"),
  periode_mulai: z.string().optional().nullable(),
  periode_selesai: z.string().optional().nullable(),
  ruangan_default: z.string().optional().nullable(),
  catatan: z.string().optional().nullable(),
}).refine((data) => {
  return data.program_id !== undefined && data.program_id > 0;
}, {
  message: "Program wajib dipilih",
  path: ["program_id"],
}).refine((data) => {
  return data.jenjang_id !== undefined && data.jenjang_id > 0;
}, {
  message: "Jenjang wajib dipilih",
  path: ["jenjang_id"],
}).refine((data) => {
  if (data.tipe_kelas === "PRIVATE" && !data.mode_private) {
    return false;
  }
  return true;
}, {
  message: "Mode private wajib dipilih untuk kelas private",
  path: ["mode_private"],
}).refine((data) => {
    if (data.periode_mulai && data.periode_selesai) {
        return new Date(data.periode_selesai) >= new Date(data.periode_mulai);
    }
    return true;
}, {
    message: "Periode selesai harus setelah periode mulai",
    path: ["periode_selesai"],
});

export type CreateKelasValues = z.infer<typeof createKelasSchema>;

export const addAnggotaSchema = z.object({
  enrollment_ids: z.array(z.number()).min(1, "Pilih minimal 1 siswa"),
  tanggal_masuk: z.string().optional(), // YYYY-MM-DD
});

export type AddAnggotaValues = z.infer<typeof addAnggotaSchema>;
