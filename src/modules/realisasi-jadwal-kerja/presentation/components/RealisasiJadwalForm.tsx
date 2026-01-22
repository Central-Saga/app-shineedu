"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";
import type { Employee } from "@/modules/employees/domain/entities";
import type { JadwalKerja } from "@/modules/jadwal-kerja/domain/entities";
import type { RealisasiJadwal, CreateRealisasiJadwalPayload } from "../../domain/entities";
import { REALISASI_JADWAL_STATUS_VALUES } from "../../domain/entities";

const schema = z.object({
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  jadwal_kerja_id: z.number().min(1, "Jadwal wajib dipilih"),
  status: z.enum(REALISASI_JADWAL_STATUS_VALUES),
  ruangan_kelas: z.string().optional().nullable(),
  guru_pengajar_id: z.number().optional().nullable(),
  guru_pengganti_id: z.number().optional().nullable(),
  sumber: z.string().optional().nullable(),
  catatan: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

interface RealisasiJadwalFormProps {
  initialData?: RealisasiJadwal;
  jadwalList: JadwalKerja[];
  employees: Employee[];
  onSubmit: (values: CreateRealisasiJadwalPayload) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function RealisasiJadwalForm({
  initialData,
  jadwalList,
  employees,
  onSubmit,
  onCancel,
  isSubmitting,
}: RealisasiJadwalFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialData ? {
      tanggal: initialData.tanggal,
      jadwal_kerja_id: initialData.jadwal_kerja_id,
      status: initialData.status,
      ruangan_kelas: initialData.ruangan_kelas,
      guru_pengajar_id: initialData.guru_pengajar_id || initialData.jadwal_kerja?.guru_pengajar_id,
      guru_pengganti_id: initialData.guru_pengganti_id,
      sumber: initialData.sumber,
      catatan: initialData.catatan,
    } : {
      status: "diajukan",
      tanggal: format(new Date(), "yyyy-MM-dd"),
    },
  });

  const currentTanggal = watch("tanggal");
  const currentJadwal = watch("jadwal_kerja_id");
  const currentStatus = watch("status");
  const currentGuru = watch("guru_pengajar_id");
  const currentPengganti = watch("guru_pengganti_id");

  // Sync pengajar when jadwal changes
  const currentRuangan = watch("ruangan_kelas");
  const currentSumber = watch("sumber");

  useEffect(() => {
    const selectedJadwal = jadwalList.find(j => j.id === Number(currentJadwal));
    if (!selectedJadwal) return;

    const isRuanganOverride = currentRuangan && currentRuangan !== selectedJadwal.ruangan_kelas;
    const isGuruOverride = currentGuru && Number(currentGuru) !== selectedJadwal.guru_pengajar_id;
    const isSubstitution = !!currentPengganti;

    if (isRuanganOverride || isGuruOverride || isSubstitution) {
      if (!currentSumber?.includes("Override")) {
        setValue("sumber", "Manual (Override)", { shouldDirty: true });
      }
    } else {
      // If everything matches and it was an override, maybe revert to original or Sistem?
      // But let's check if it was originally Sistem
      if (initialData?.sumber?.includes("Sistem") && currentSumber?.includes("Override")) {
        setValue("sumber", initialData.sumber, { shouldDirty: true });
      }
    }
  }, [currentRuangan, currentGuru, currentPengganti, currentJadwal, currentSumber, jadwalList, setValue, initialData]);

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data as CreateRealisasiJadwalPayload))} className="space-y-6">
      <Accordion defaultValue="ref" className="w-full">
        {/* Panel 1: Referensi Jadwal & Tanggal */}
        <AccordionItem value="ref">
          <AccordionTrigger className="text-lg font-semibold">
            1. Referensi Jadwal & Tanggal
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="space-y-2">
                <Label>Tanggal Realisasi</Label>
                <DatePicker
                  date={currentTanggal ? new Date(currentTanggal) : null}
                  setDate={(d) => setValue("tanggal", d ? format(d, "yyyy-MM-dd") : "")}
                  placeholder="Pilih tanggal"
                  disabled={!!initialData}
                />
                {errors.tanggal && <p className="text-destructive text-sm">{errors.tanggal.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Jadwal Kerja</Label>
                <Select
                  value={String(currentJadwal)}
                  onValueChange={(v) => {
                    const numV = Number(v);
                    setValue("jadwal_kerja_id", numV);
                    const j = jadwalList.find(item => item.id === numV);
                    if (j) {
                      setValue("guru_pengajar_id", j.guru_pengajar_id);
                      setValue("ruangan_kelas", j.ruangan_kelas);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jadwal" />
                  </SelectTrigger>
                  <SelectContent>
                    {jadwalList.map(j => (
                      <SelectItem key={j.id} value={String(j.id)}>
                        {j.mata_pelajaran} ({j.hari} {j.jam_mulai}-{j.jam_selesai})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.jadwal_kerja_id && <p className="text-destructive text-sm">{errors.jadwal_kerja_id.message}</p>}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Panel 2: Pengajar & Pengganti */}
        <AccordionItem value="pengajar">
          <AccordionTrigger className="text-lg font-semibold">
            2. Pengajar & Pengganti
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="space-y-2">
                <Label>Guru Pengajar (Default)</Label>
                <Select
                  value={String(currentGuru || "")}
                  onValueChange={(v) => setValue("guru_pengajar_id", Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih pengajar" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(e => (
                      <SelectItem key={e.id} value={String(e.id)}>{e.user?.name || e.kode_karyawan}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.guru_pengajar_id && <p className="text-destructive text-sm">{errors.guru_pengajar_id.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Guru Pengganti (Jika ada)</Label>
                <Select
                  value={currentPengganti ? String(currentPengganti) : "none"}
                  onValueChange={(v) => setValue("guru_pengganti_id", v === "none" ? null : Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih pengganti" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tanpa Pengganti</SelectItem>
                    {employees.map(e => (
                      <SelectItem key={e.id} value={String(e.id)}>{e.user?.name || e.kode_karyawan}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Panel 3: Ruangan */}
        <AccordionItem value="ruangan">
          <AccordionTrigger className="text-lg font-semibold">
            3. Ruangan
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="space-y-2">
                <Label>Ruangan / Kelas (Override)</Label>
                <Input {...register("ruangan_kelas")} placeholder="Contoh: Room B" />
                <p className="text-[11px] text-muted-foreground">Kosongkan jika sama dengan jadwal</p>
              </div>
              <div className="space-y-2">
                <Label>Sumber</Label>
                <Input {...register("sumber")} placeholder="Contoh: Manual / System" />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Panel 4: Status & Catatan */}
        <AccordionItem value="status">
          <AccordionTrigger className="text-lg font-semibold">
            4. Status & Catatan
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label>Status Realisasi</Label>
                <Select
                  value={currentStatus}
                  onValueChange={(v) => setValue("status", v as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diajukan">Diajukan</SelectItem>
                    <SelectItem value="disetujui">Disetujui</SelectItem>
                    <SelectItem value="ditolak">Ditolak</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Catatan</Label>
                <Input {...register("catatan")} placeholder="Catatan tambahan..." />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex gap-3 pt-6 border-t">
        <Button type="submit" size="lg" disabled={isSubmitting} className="px-8 font-bold">
          {isSubmitting ? "Menyimpan…" : "Simpan Realisasi"}
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={onCancel}>
          Batal
        </Button>
      </div>
    </form>
  );
}
