import { z } from "zod";

export const createEnrollmentSchema = z.object({
  // Mode selection (UI only, filtered out before submit if needed, or handled in transform)
  mode_murid: z.enum(["existing", "new"]).default("existing"),
  
  murid_id: z.coerce.number().optional(),
  
  murid_baru: z.object({
    nama_lengkap: z.string().min(1, "Nama lengkap wajib diisi"),
    no_hp: z.string().min(1, "No HP wajib diisi"),
    jenis_kelamin: z.enum(["L", "P"]).optional().nullable(),
    tanggal_lahir: z.string().optional().nullable(),
    alamat: z.string().optional().nullable(),
    nama_wali: z.string().optional().nullable(),
    no_hp_wali: z.string().optional().nullable(),
    email_wali: z.preprocess((val) => (val === "" ? null : val), z.string().email("Email wali tidak valid").nullable().or(z.literal(null))).default(null),
    hubungan_wali: z.string().optional().nullable(),
  }).optional(),

  program_id: z.coerce.number().min(1, "Program wajib dipilih"),
  jenjang_id: z.coerce.number().min(1, "Jenjang wajib dipilih"),
  paket_id: z.coerce.number().min(1, "Paket wajib dipilih"),
  
  jumlah_siswa: z.coerce.number().min(1, "Minimal 1 siswa").default(1),
  
  tanggal_mulai: z.string().optional(), // Date string YYYY-MM-DD
  tanggal_selesai: z.string().optional(),
  
  catatan: z.string().optional(),

  // Registration Fee
  biaya_pendaftaran_amount: z.coerce.number().min(0).default(0),
  biaya_pendaftaran_status: z.enum(['UNPAID', 'PAID', 'WAIVED']).optional(), // Computed usually, but allow override if needed
  biaya_pendaftaran_due_date: z.string().optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.mode_murid === "existing" && !data.murid_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Pilih murid terlebih dahulu",
      path: ["murid_id"],
    });
  }
  if (data.mode_murid === "new") {
    if (!data.murid_baru?.nama_lengkap) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Nama lengkap wajib diisi",
        path: ["murid_baru", "nama_lengkap"],
      });
    }
    if (!data.murid_baru?.no_hp) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "No HP wajib diisi",
        path: ["murid_baru", "no_hp"],
      });
    }
  }
});

export type CreateEnrollmentFormValues = z.infer<typeof createEnrollmentSchema>;

export const updateEnrollmentSchema = z.object({
  mode_murid: z.enum(["existing", "new"]).optional(),
  tanggal_mulai: z.string().optional(),
  tanggal_selesai: z.string().optional(),
  status: z.enum(['Aktif', 'Pause', 'Selesai', 'Cancel']).optional(),
  catatan: z.string().optional(),
  biaya_pendaftaran_amount: z.coerce.number().min(0).optional(),
  biaya_pendaftaran_status: z.enum(['UNPAID', 'PAID', 'WAIVED']).optional(),
  biaya_pendaftaran_due_date: z.string().optional().nullable(),
});

export type UpdateEnrollmentFormValues = z.infer<typeof updateEnrollmentSchema>;
