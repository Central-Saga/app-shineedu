
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, addDays, isBefore, startOfDay, differenceInDays } from "date-fns";
import { toast } from "sonner";
import { Info, AlertTriangle, Paperclip, X } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  karyawan_id: z.string().min(1, "Karyawan wajib dipilih"),
  jenis: z.enum(["izin", "sakit"]),
  start_date: z.date({ required_error: "Tanggal mulai wajib diisi" }),
  end_date: z.date({ required_error: "Tanggal selesai wajib diisi" }),
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
      jenis: initialData?.jenis || "izin",
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
  const isFreelance = selectedEmployee?.kategori_karyawan === "freelance";
  const isIzin = selectedJenis === "izin";
  const isSakit = selectedJenis === "sakit";

  useEffect(() => {
    if (isSakit) {
      const today = new Date();
      setValue("start_date", today, { shouldValidate: true });
      setValue("end_date", today, { shouldValidate: true });
    }
  }, [isSakit, setValue]);

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
          if (matched) {
            setValue("karyawan_id", String(matched.id));
          }
        }
      })
      .catch(() => toast.error("Gagal memuat data pendukung"));
  }, [user, isEdit, setValue, selectedKaryawanId]);

  const normalizeDivisi = (val: string | null | undefined) => 
    val?.toLowerCase().replace("-", "_").trim();

  const applicableRule = useMemo(() => {
    return settings
      .filter(s => 
        s.kategori_karyawan === selectedEmployee?.kategori_karyawan &&
        s.jenis === selectedJenis &&
        (s.subtipe_kontrak ? s.subtipe_kontrak === selectedEmployee?.subtipe_kontrak : !selectedEmployee?.subtipe_kontrak)
      )
      .find(s => {
        const ruleDivisi = normalizeDivisi(s.divisi);
        const empDivisi = normalizeDivisi(selectedEmployee?.divisi);
        return ruleDivisi === empDivisi || ruleDivisi === "all";
      });
  }, [settings, selectedEmployee, selectedJenis]);

  const minDays = useMemo(() => applicableRule?.minimal_hari_pengajuan ?? 0, [applicableRule]);
  const maxDays = useMemo(() => applicableRule?.maksimal_pengajuan ?? null, [applicableRule]);

  const disabledDates = useMemo(() => {
    const today = startOfDay(new Date());
    return {
      before: addDays(today, isSakit ? 0 : minDays)
    };
  }, [isSakit, minDays]);

  const duration = useMemo(() => {
    if (!selectedStartDate || !selectedEndDate) return 0;
    const start = startOfDay(selectedStartDate);
    const end = startOfDay(selectedEndDate);
    if (isBefore(end, start)) return 0;
    return differenceInDays(end, start) + 1;
  }, [selectedStartDate, selectedEndDate]);

  const isDurationExceeded = !!(maxDays && duration > maxDays);

  // Reset selected date if it becomes invalid
  useEffect(() => {
    if (selectedStartDate && !isSakit) {
      const fromDate = startOfDay(selectedStartDate);
      if (isBefore(fromDate, disabledDates.before)) {
        setValue("start_date", disabledDates.before, { shouldValidate: true });
        if (selectedEndDate && isBefore(startOfDay(selectedEndDate), disabledDates.before)) {
          setValue("end_date", disabledDates.before, { shouldValidate: true });
        }
      }
    }
  }, [isSakit, disabledDates.before, setValue]);

  useEffect(() => {
    if (selectedStartDate && selectedEndDate && isBefore(startOfDay(selectedEndDate), startOfDay(selectedStartDate))) {
      setValue("end_date", selectedStartDate, { shouldValidate: true });
    }
  }, [selectedStartDate, selectedEndDate, setValue]);

  async function onSubmit(values: FormValues) {
    if (isDurationExceeded) {
      toast.error(`Durasi pengajuan melebihi batas maksimal (${maxDays} hari)`);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("karyawan_id", String(values.karyawan_id));
      formData.append("jenis", values.jenis);
      
      const startStr = format(values.start_date, "yyyy-MM-dd");
      const endStr = format(values.end_date, "yyyy-MM-dd");
      
      formData.append("start_date", startStr);
      formData.append("end_date", endStr);
      formData.append("tanggal", startStr);

      formData.append("status", canManage ? values.status : "diajukan");
      formData.append("catatan", values.catatan || "");

      if (values.bukti_pendukung instanceof File) {
        formData.append("bukti_pendukung", values.bukti_pendukung);
      } else if (values.bukti_pendukung?.[0] instanceof File) {
        formData.append("bukti_pendukung", values.bukti_pendukung[0]);
      }

      if (isEdit && initialData) {
        await updateCuti(initialData.id, formData as any);
        toast.success("Pengajuan cuti diperbarui");
      } else {
        await createCuti(formData as any);
        toast.success("Pengajuan cuti dibuat");
      }
      router.push("/cuti");
    } catch (e: any) {
      toast.error(e?.message || "Gagal menyimpan pengajuan");
    }
  }

  const showH3Warning =
    isIzin &&
    selectedStartDate &&
    isBefore(startOfDay(selectedStartDate), addDays(startOfDay(new Date()), minDays || 3)) &&
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
              <Select
                value={selectedKaryawanId}
                onValueChange={(v) => setValue("karyawan_id", v, { shouldValidate: true })}
                disabled={isEdit || !canManage}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Karyawan" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.user?.name || e.kode_karyawan} ({e.kategori_karyawan})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.karyawan_id && (
                <p className="text-sm text-destructive">{errors.karyawan_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Jenis Pengajuan</Label>
              <Select
                value={selectedJenis}
                onValueChange={(v) => setValue("jenis", v as any, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="izin">Izin</SelectItem>
                  <SelectItem value="sakit">Sakit</SelectItem>
                </SelectContent>
              </Select>
              {errors.jenis && (
                <p className="text-sm text-destructive">{errors.jenis.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tanggal & Dokumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mulai</Label>
                  <DatePicker
                    date={selectedStartDate}
                    setDate={(d) => setValue("start_date", d as Date, { shouldValidate: true })}
                    disabled={isSakit}
                    disabledDates={disabledDates}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Selesai</Label>
                  <DatePicker
                    date={selectedEndDate}
                    setDate={(d) => setValue("end_date", d as Date, { shouldValidate: true })}
                    disabled={isSakit}
                    disabledDates={{ before: selectedStartDate || disabledDates.before }}
                  />
                </div>
             </div>

             <div className="rounded-md bg-muted p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Durasi:</span>
                  <span className={`font-bold ${isDurationExceeded ? "text-destructive" : "text-primary"}`}>
                    {duration} Hari
                  </span>
                </div>
                {maxDays && (
                   <div className="flex justify-between">
                      <span className="text-muted-foreground">Maksimal:</span>
                      <span>{maxDays} Hari</span>
                   </div>
                )}
                {isDurationExceeded && (
                   <p className="text-destructive font-bold text-center pt-1 border-t mt-1">
                      (!) Melebihi batas maksimal pengajuan
                   </p>
                )}
             </div>

            <div className="space-y-2">
              <Label>Bukti Pendukung (Opsional)</Label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input
                    type="file"
                    className="hidden"
                    id="bukti_pendukung"
                    onChange={(e) => setValue("bukti_pendukung", e.target.files)}
                  />
                  <Label
                    htmlFor="bukti_pendukung"
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed p-4 hover:bg-muted/50"
                  >
                    <Paperclip className="h-4 w-4" />
                    <span>{buktiPendukung?.[0]?.name || "Upload File (PDF/Image)"}</span>
                  </Label>
                </div>
                {buktiPendukung?.[0] && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setValue("bukti_pendukung", undefined)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {showH3Warning && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800 text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  Warning
                </div>
                <div className="mt-1">
                  Pengajuan kurang dari {minDays} hari sebelum tanggal mulai.
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="md:col-span-1 space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={selectedStatus}
                    onValueChange={(v) => setValue("status", v as any, { shouldValidate: true })}
                    disabled={!canManage}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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
                  <textarea
                    {...register("catatan")}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Alasan pengajuan..."
                  />
               </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" type="button" onClick={() => router.back()}>
          Batal
        </Button>
        <Button type="submit" disabled={isSubmitting || isDurationExceeded} className="min-w-[120px]">
          {isSubmitting ? "Menyimpan..." : isEdit ? "Update" : "Simpan"}
        </Button>
      </div>
    </form>
  );
}
