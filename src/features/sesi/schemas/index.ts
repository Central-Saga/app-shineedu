import { z } from "zod";

export const generateSesiSchema = z.object({
  from: z.string().refine(val => !isNaN(Date.parse(val)), "Tanggal tidak valid"),
  to: z.string().refine(val => !isNaN(Date.parse(val)), "Tanggal tidak valid"),
  sumber: z.enum(["SYSTEM", "MANUAL"]).default("SYSTEM"),
  auto_populate_absensi: z.boolean().default(true),
}).refine(data => new Date(data.from) <= new Date(data.to), {
    message: "Tanggal selesai harus setelah tanggal mulai",
    path: ["to"]
});

export const updateSesiSchema = z.object({
  status_sesi: z.enum(['TERJADWAL', 'BERJALAN', 'SELESAI', 'BATAL', 'LIBUR']),
  status_kehadiran_guru: z.enum(['HADIR', 'IZIN', 'SAKIT', 'ALPHA', 'DIGANTI']),
  jam_mulai_aktual: z.string().optional().nullable(),
  jam_selesai_aktual: z.string().optional().nullable(),
  guru_pengganti_id: z.coerce.number().optional().nullable(),
  ruangan_kelas: z.string().optional().nullable(),
  alasan_batal: z.string().optional().nullable(),
}).superRefine((data, ctx) => {
    if (data.status_sesi === "BATAL" && !data.alasan_batal) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Alasan batal wajib diisi jika status BATAL",
            path: ["alasan_batal"]
        });
    }
    if (data.status_kehadiran_guru === "DIGANTI" && !data.guru_pengganti_id) {
         ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Guru pengganti wajib dipilih",
            path: ["guru_pengganti_id"]
        });
    }
});

export const logbookSesiSchema = z.object({
    ringkasan: z.string().optional().nullable(),
    materi: z.string().optional().nullable(),
    homework: z.string().optional().nullable(),
    catatan_pengajar: z.string().optional().nullable(),
});

export const bulkAbsensiItemSchema = z.object({
    enrollment_id: z.number(),
    status: z.enum(['HADIR', 'IZIN', 'SAKIT', 'ALPHA', 'BATAL']),
    catatan: z.string().optional().nullable(),
});

export const bulkAbsensiSchema = z.object({
    items: z.array(bulkAbsensiItemSchema),
});

export const bulkLogbookMuridItemSchema = z.object({
    enrollment_id: z.number(),
    catatan_perkembangan: z.string().optional().nullable(),
    kesulitan: z.string().optional().nullable(),
    target_next: z.string().optional().nullable(),
    tugas_individu: z.string().optional().nullable(),
    nilai_opsional: z.coerce.number().optional().nullable(),
});

export const bulkLogbookMuridSchema = z.object({
    items: z.array(bulkLogbookMuridItemSchema),
});
