"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, addDays, isBefore, startOfDay, differenceInDays } from "date-fns";
import { toast } from "sonner";
import { AlertTriangle, Paperclip, X } from "lucide-react";
import {
  createCuti,
  updateCuti,
} from "../../infrastructure/cuti.repository";
import type { Cuti } from "../../domain/entities";
import { listPengaturanCuti } from "@/modules/pengaturan-cuti/infrastructure/pengaturan-cuti.repository";
import type { PengaturanCuti } from "@/modules/pengaturan-cuti/domain/entities";
import { getEmployeesUsecase } from "@/modules/employees/application/usecases/getEmployees.usecase";
import type { Employee } from "@/modules/employees/domain/entities";
import { authStore, useAuthStore } from "@/modules/auth/infrastructure/auth.store";
import type { DateRange } from "react-day-picker";
import { rekapService } from "@/modules/hr/infrastructure/rekap.service";

const formSchema = z.object({
  karyawan_id: z.string().min(1, "Karyawan wajib dipilih"),
  jenis: z.enum(["izin", "sakit", "cuti"]),
  start_date: z.date({ message: "Tanggal mulai wajib diisi" }),
  end_date: z.date({ message: "Tanggal selesai wajib diisi" }),
  status: z.enum(["diajukan", "disetujui", "ditolak", "dibatalkan"]),
  catatan: z.string().optional(),
  bukti_pendukung: z.any().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CutiFormProps {
  initialData?: Cuti;
  isEdit?: boolean;
}

export function CutiForm({ initialData, isEdit = false }: CutiFormProps) {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [settings, setSettings] = useState<PengaturanCuti[]>([]);
  const [usage, setUsage] = useState<{ izin_disetujui: number; sakit_disetujui: number; cuti_disetujui: number } | null>(null);
  const user = useAuthStore((state) => state.user);
  const canManage = authStore.hasPermission("cuti.manage");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      karyawan_id: initialData?.karyawan_id ? String(initialData.karyawan_id) : "",
      jenis: (initialData?.jenis as any) || "izin",
      start_date: initialData?.start_date ? new Date(initialData.start_date) : (initialData?.tanggal ? new Date(initialData.tanggal) : new Date()),
      end_date: initialData?.end_date ? new Date(initialData.end_date) : (initialData?.tanggal ? new Date(initialData.tanggal) : new Date()),
      status: initialData?.status || "diajukan",
      catatan: initialData?.catatan || "",
    },
  });

  const selectedKaryawanId = watch("karyawan_id");
  const selectedJenis = watch("jenis");
  const selectedStartDate = watch("start_date");
  const selectedEndDate = watch("end_date");
  const selectedStatus = watch("status");
  const buktiPendukung = watch("bukti_pendukung");

  const selectedEmployee = employees.find((e) => String(e.id) === selectedKaryawanId);
  const isSakit = selectedJenis === "sakit";

  // Load Data
  useEffect(() => {
    Promise.all([
      getEmployeesUsecase({ per_page: 100, status: "aktif" }),
      listPengaturanCuti({ per_page: 100, aktif: 1 })
    ])
      .then(([empRes, setRes]) => {
        setEmployees(empRes.items);
        setSettings(setRes.items);
        if (!isEdit && !selectedKaryawanId && user) {
          const matched = empRes.items.find((e) => e.user?.id === user.id);
          if (matched) setValue("karyawan_id", String(matched.id));
        }
      })
      .catch(() => toast.error("Gagal memuat data pendukung"));
  }, [user, isEdit, setValue, selectedKaryawanId]);

  // Load Usage (Quota)
  useEffect(() => {
    if (!selectedKaryawanId || !selectedStartDate) return;
    const now = selectedStartDate;
    rekapService.getRekapDetail(Number(selectedKaryawanId), { bulan: now.getMonth() + 1, tahun: now.getFullYear() })
      .then(res => setUsage(res.cuti))
      .catch(() => setUsage(null));
  }, [selectedKaryawanId, selectedStartDate]);

  // Rule Matching logic
  const applicableRule = useMemo(() => {
    if (!selectedEmployee) return null;
    const normalize = (s: string | null | undefined) => s?.toLowerCase().trim();
    
    return settings.find(s => 
      normalize(s.kategori_karyawan) === normalize(selectedEmployee.kategori_karyawan) &&
      normalize(s.jenis) === normalize(selectedJenis) &&
      (s.subtipe_kontrak ? normalize(s.subtipe_kontrak) === normalize(selectedEmployee.subtipe_kontrak) : true)
    );
  }, [settings, selectedEmployee, selectedJenis]);

  const minDaysBefore = applicableRule?.minimal_hari_pengajuan ?? 0;
  const maxQuota = applicableRule?.maksimal_pengajuan ?? null;

  const usedCount = useMemo(() => {
    if (!usage) return 0;
    if (selectedJenis === "izin") return usage.izin_disetujui;
    if (selectedJenis === "sakit") return usage.sakit_disetujui;
    if (selectedJenis === "cuti") return usage.cuti_disetujui;
    return 0;
  }, [usage, selectedJenis]);

  const remaining = maxQuota !== null ? Math.max(0, maxQuota - usedCount) : 999;

  const firstValidDate = useMemo(() => {
     const today = startOfDay(new Date());
     return addDays(today, isSakit ? 0 : minDaysBefore);
  }, [isSakit, minDaysBefore]);

  const disabledDates = useMemo(() => {
    return {
      before: firstValidDate
    };
  }, [firstValidDate]);

  // Adjust dates if they become invalid due to rule/type changes
  useEffect(() => {
    if (!isEdit && selectedStartDate && isBefore(startOfDay(selectedStartDate), firstValidDate)) {
        setValue("start_date", firstValidDate);
        setValue("end_date", firstValidDate);
    }
  }, [firstValidDate, isEdit, selectedStartDate, setValue]);

  const duration = useMemo(() => {
    if (!selectedStartDate || !selectedEndDate) return 0;
    const start = startOfDay(selectedStartDate);
    const end = startOfDay(selectedEndDate);
    if (isBefore(end, start)) return 0;
    return differenceInDays(end, start) + 1;
  }, [selectedStartDate, selectedEndDate]);

  const isQuotaExceeded = duration > remaining;

  // Strict enforcement for Sakit
  useEffect(() => {
    if (isSakit) {
      const today = startOfDay(new Date());
      setValue("start_date", today);
      setValue("end_date", today);
    }
  }, [isSakit, setValue]);

  // Handle date selection with quota check
  const handleRangeChange = (range: DateRange | undefined) => {
    if (!range?.from) return;
    
    const from = range.from;
    const to = range.to || range.from;

    const newDuration = differenceInDays(to, from) + 1;
    
    if (newDuration > remaining) {
        toast.warning(`Sisa kuota anda tidak cukup (${remaining} hari tersisa). Durasi terpilih: ${newDuration} hari.`);
    }

    setValue("start_date", from, { shouldValidate: true });
    setValue("end_date", to, { shouldValidate: true });
  };

  async function onSubmit(values: FormValues) {
    if (isQuotaExceeded) {
      toast.error(`Durasi pengajuan (${duration} hari) melebihi sisa kuota (${remaining} hari)`);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("karyawan_id", String(values.karyawan_id));
      formData.append("jenis", values.jenis);
      formData.append("start_date", format(values.start_date, "yyyy-MM-dd"));
      formData.append("end_date", format(values.end_date, "yyyy-MM-dd"));
      formData.append("tanggal", format(values.start_date, "yyyy-MM-dd"));
      formData.append("status", canManage ? values.status : "diajukan");
      formData.append("catatan", values.catatan || "");
      if (values.bukti_pendukung?.[0]) formData.append("bukti_pendukung", values.bukti_pendukung[0]);

      if (isEdit && initialData) {
        await updateCuti(initialData.id, formData);
        toast.success("Berhasil diperbarui");
      } else {
        await createCuti(formData);
        toast.success("Berhasil diajukan");
      }
      router.push("/cuti");
    } catch (e: any) {
      toast.error(e?.message || "Gagal menyimpan pengajuan");
    }
  }

  const showH3Warning =
    !isSakit &&
    selectedStartDate &&
    isBefore(startOfDay(selectedStartDate), addDays(startOfDay(new Date()), minDaysBefore)) &&
    !isBefore(startOfDay(selectedStartDate), startOfDay(new Date()));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Info Karyawan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Karyawan</Label>
              <Select value={selectedKaryawanId} onValueChange={(v) => setValue("karyawan_id", v)} disabled={isEdit || !canManage}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Karyawan" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>{e.user?.name} ({e.kategori_karyawan})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.karyawan_id && <p className="text-sm text-destructive">{errors.karyawan_id.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Jenis Pengajuan</Label>
              <Select value={selectedJenis} onValueChange={(v) => setValue("jenis", v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="izin">Izin</SelectItem>
                  <SelectItem value="sakit">Sakit</SelectItem>
                  <SelectItem value="cuti">Cuti Tahunan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tanggal & Dokumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{isSakit ? "Tanggal" : "Rentang Tanggal"}</Label>
              {isSakit ? (
                <Input value={format(selectedStartDate || new Date(), "dd-MM-yyyy")} disabled />
              ) : (
                <DatePickerWithRange
                  date={{ from: selectedStartDate, to: selectedEndDate }}
                  setDate={handleRangeChange}
                  disabled={disabledDates}
                />
              )}
            </div>

            <div className="rounded-md bg-muted p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sisa Kuota Bulan Ini:</span>
                  <span className="font-bold">{remaining === 999 ? "Tanpa Batas" : `${remaining} Hari`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Durasi Terpilih:</span>
                  <span className={`font-bold ${isQuotaExceeded ? "text-destructive" : ""}`}>{duration} Hari</span>
                </div>
            </div>

            <div className="space-y-2">
              <Label>Bukti Pendukung (Opsional)</Label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input type="file" className="hidden" id="bukti_pendukung" onChange={(e) => setValue("bukti_pendukung", e.target.files)} />
                  <Label htmlFor="bukti_pendukung" className="flex cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed p-4 hover:bg-muted/50">
                    <Paperclip className="h-4 w-4" />
                    <span>{buktiPendukung?.[0]?.name || "Upload File"}</span>
                  </Label>
                </div>
                {buktiPendukung?.[0] && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => setValue("bukti_pendukung", undefined)}><X className="h-4 w-4" /></Button>
                )}
              </div>
            </div>

            {showH3Warning && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800 text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  Warning
                </div>
                <div className="mt-1">Pengajuan minimal {minDaysBefore} hari sebelum tanggal mulai.</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Status & Catatan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={selectedStatus} onValueChange={(v) => setValue("status", v as any)} disabled={!canManage}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diajukan">Diajukan</SelectItem>
                      <SelectItem value="disetujui">Disetujui</SelectItem>
                      <SelectItem value="ditolak">Ditolak</SelectItem>
                      <SelectItem value="dibatalkan">Dibatalkan</SelectItem>
                    </SelectContent>
                  </Select>
               </div>
               <div className="md:col-span-2 space-y-2">
                  <Label>Catatan / Alasan</Label>
                  <textarea {...register("catatan")} className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring outline-none" placeholder="Alasan pengajuan..." />
               </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" type="button" onClick={() => router.back()}>Batal</Button>
        <Button type="submit" disabled={isSubmitting || isQuotaExceeded} className="min-w-[120px]">
          {isSubmitting ? "Menyimpan..." : isEdit ? "Update" : "Simpan"}
        </Button>
      </div>
    </form>
  );
}
