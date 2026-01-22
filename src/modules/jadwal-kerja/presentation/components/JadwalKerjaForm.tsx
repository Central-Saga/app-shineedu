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
import type { Employee } from "@/modules/employees/domain/entities";
import type { JadwalKerja, CreateJadwalKerjaPayload } from "../../domain/entities";
import { JADWAL_KERJA_KATEGORI_VALUES, JADWAL_KERJA_STATUS_VALUES } from "../../domain/entities";

const schema = z.object({
  kategori: z.enum(JADWAL_KERJA_KATEGORI_VALUES),
  mata_pelajaran: z.string().min(1, "Mata pelajaran wajib diisi"),
  hari: z.string().min(1, "Hari wajib diisi"),
  nomor_sesi: z.union([z.string(), z.number()]).transform(v => Number(v)),
  jam_mulai: z.string().min(1, "Jam mulai wajib diisi"),
  jam_selesai: z.string().min(1, "Jam selesai wajib diisi"),
  tarif: z.union([z.string(), z.number()]).transform(v => Number(v)),
  status: z.enum(JADWAL_KERJA_STATUS_VALUES),
  ruangan_kelas: z.string().optional().nullable(),
  guru_pengajar_id: z.union([z.string(), z.number()]).transform(v => Number(v)),
});

type FormValues = z.infer<typeof schema>;

interface JadwalKerjaFormProps {
  initialData?: JadwalKerja;
  employees: Employee[];
  onSubmit: (values: CreateJadwalKerjaPayload) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const HARI_OPTIONS = [
  "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"
];

export function JadwalKerjaForm({
  initialData,
  employees,
  onSubmit,
  onCancel,
  isSubmitting,
}: JadwalKerjaFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialData ? {
      kategori: initialData.kategori,
      mata_pelajaran: initialData.mata_pelajaran,
      hari: initialData.hari,
      nomor_sesi: initialData.nomor_sesi,
      jam_mulai: initialData.jam_mulai,
      jam_selesai: initialData.jam_selesai,
      tarif: initialData.tarif,
      status: initialData.status,
      ruangan_kelas: initialData.ruangan_kelas,
      guru_pengajar_id: initialData.guru_pengajar_id,
    } : {
      kategori: "coding",
      status: "aktif",
      hari: "Senin",
      nomor_sesi: 1,
    },
  });

  const currentKategori = watch("kategori");
  const currentHari = watch("hari");
  const currentStatus = watch("status");
  const currentGuru = watch("guru_pengajar_id");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Accordion type="multiple" defaultValue={["info", "waktu", "pengajar"]} className="w-full">
        {/* Panel 1: Informasi Jadwal */}
        <AccordionItem value="info">
          <AccordionTrigger className="text-lg font-semibold">
            1. Informasi Jadwal
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select
                  value={currentKategori}
                  onValueChange={(v) => setValue("kategori", v as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coding">Coding</SelectItem>
                    <SelectItem value="non_coding">Non Coding</SelectItem>
                  </SelectContent>
                </Select>
                {errors.kategori && <p className="text-destructive text-sm">{errors.kategori.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Mata Pelajaran</Label>
                <Input {...register("mata_pelajaran")} placeholder="Contoh: Python Foundation" />
                {errors.mata_pelajaran && <p className="text-destructive text-sm">{errors.mata_pelajaran.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={currentStatus}
                  onValueChange={(v) => setValue("status", v as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aktif">Aktif</SelectItem>
                    <SelectItem value="nonaktif">Non Aktif</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && <p className="text-destructive text-sm">{errors.status.message}</p>}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Panel 2: Waktu & Ruangan */}
        <AccordionItem value="waktu">
          <AccordionTrigger className="text-lg font-semibold">
            2. Waktu & Ruangan
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Hari</Label>
                <Select
                  value={currentHari}
                  onValueChange={(v) => setValue("hari", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HARI_OPTIONS.map(h => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.hari && <p className="text-destructive text-sm">{errors.hari.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Nomor Sesi</Label>
                <Input type="number" {...register("nomor_sesi")} placeholder="1" />
                {errors.nomor_sesi && <p className="text-destructive text-sm">{errors.nomor_sesi.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Ruangan / Kelas</Label>
                <Input {...register("ruangan_kelas")} placeholder="Contoh: Room A" />
                {errors.ruangan_kelas && <p className="text-destructive text-sm">{errors.ruangan_kelas.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Jam Mulai</Label>
                <Input type="time" {...register("jam_mulai")} />
                {errors.jam_mulai && <p className="text-destructive text-sm">{errors.jam_mulai.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Jam Selesai</Label>
                <Input type="time" {...register("jam_selesai")} />
                {errors.jam_selesai && <p className="text-destructive text-sm">{errors.jam_selesai.message}</p>}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Panel 3: Pengajar & Tarif */}
        <AccordionItem value="pengajar">
          <AccordionTrigger className="text-lg font-semibold">
            3. Pengajar & Tarif
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="space-y-2">
                <Label>Guru Pengajar</Label>
                <Select
                  value={String(currentGuru)}
                  onValueChange={(v) => setValue("guru_pengajar_id", v)}
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
                <Label>Tarif (IDR)</Label>
                <Input type="number" {...register("tarif")} placeholder="0" />
                {errors.tarif && <p className="text-destructive text-sm">{errors.tarif.message}</p>}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex gap-3 pt-6 border-t">
        <Button type="submit" size="lg" disabled={isSubmitting} className="px-8 font-bold">
          {isSubmitting ? "Menyimpan…" : "Simpan Jadwal"}
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={onCancel}>
          Batal
        </Button>
      </div>
    </form>
  );
}
