
"use client";

import { useEffect, useState } from "react";
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
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { toast } from "sonner";
import { Info, AlertTriangle, Paperclip, X } from "lucide-react";
import {
  createCuti,
  updateCuti,
} from "../../infrastructure/cuti.repository";
import type { Cuti } from "../../domain/entities";
import { getEmployeesUsecase } from "@/modules/employees/application/usecases/getEmployees.usecase";
import type { Employee } from "@/modules/employees/domain/entities";
import { authStore, useAuthStore } from "@/modules/auth/infrastructure/auth.store";

const formSchema = z.object({
  karyawan_id: z.string().min(1, "Karyawan wajib dipilih"),
  jenis: z.enum(["cuti", "izin", "sakit"]),
  tanggal: z.date(),
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
      jenis: initialData?.jenis || "cuti",
      tanggal: initialData?.tanggal ? new Date(initialData.tanggal) : new Date(),
      status: initialData?.status || "diajukan",
      catatan: initialData?.catatan || "",
    },
  });

  const selectedKaryawanId = watch("karyawan_id");
  const selectedJenis = watch("jenis");
  const selectedDate = watch("tanggal");
  const selectedStatus = watch("status");
  const buktiPendukung = watch("bukti_pendukung");

  const selectedEmployee = employees.find((e) => String(e.id) === selectedKaryawanId);
  const isKontrak = selectedEmployee?.kategori_karyawan === "kontrak";
  const isFreelance = selectedEmployee?.kategori_karyawan === "freelance";
  const isIzin = selectedJenis === "izin";

  useEffect(() => {
    getEmployeesUsecase({ per_page: 100, status: "aktif" })
      .then((res) => {
        setEmployees(res.items);
        // Auto-select if user is an employee and creating new
        if (!isEdit && !selectedKaryawanId && user) {
          const matched = res.items.find((e) => e.user?.id === user.id);
          if (matched) {
            setValue("karyawan_id", String(matched.id));
          }
        }
      })
      .catch(() => toast.error("Gagal memuat list karyawan"));
  }, [user, isEdit, setValue, selectedKaryawanId]);

  async function onSubmit(values: FormValues) {
    try {
      const formData = new FormData();
      formData.append("karyawan_id", String(values.karyawan_id));
      formData.append("jenis", values.jenis);
      formData.append("tanggal", format(values.tanggal, "yyyy-MM-dd"));
      // Force status if not manager
      formData.append("status", canManage ? values.status : "diajukan");
      formData.append("catatan", values.catatan || "");
      
      if (values.bukti_pendukung?.[0]) {
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

  const isEmployeeOnly = !canManage;
  const showH3Warning =
    isKontrak &&
    isIzin &&
    selectedDate &&
    isBefore(selectedDate, addDays(startOfDay(new Date()), 3)) &&
    !isBefore(selectedDate, startOfDay(new Date()));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Panel 1: Karyawan & Jenis */}
        <Card>
          <CardHeader>
            <CardTitle>Karyawan & Jenis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Karyawan</Label>
              <Select
                value={selectedKaryawanId}
                onValueChange={(v) => setValue("karyawan_id", v, { shouldValidate: true })}
                disabled={isEdit || isEmployeeOnly}
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

            {isFreelance && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-800 text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <Info className="h-4 w-4" />
                  Freelance
                </div>
                <div className="mt-1">
                  Tidak ada batasan kuota; konsekuensi: tidak mendapat fee sesi.
                </div>
              </div>
            )}

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
                  <SelectItem value="cuti">Cuti</SelectItem>
                  <SelectItem value="izin">Izin</SelectItem>
                  <SelectItem value="sakit">Sakit</SelectItem>
                </SelectContent>
              </Select>
              {errors.jenis && (
                <p className="text-sm text-destructive">{errors.jenis.message}</p>
              )}
              {isKontrak && isIzin && (
                <p className="text-xs text-muted-foreground italic">Minimal 3 hari sebelum tanggal izin.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Panel 2: Tanggal & Bukti */}
        <Card>
          <CardHeader>
            <CardTitle>Tanggal & Dokumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tanggal</Label>
              <DatePicker
                date={selectedDate}
                setDate={(d) => setValue("tanggal", d as Date, { shouldValidate: true })}
                disabled={true} // Locked for everyone
              />
              <p className="text-[11px] text-muted-foreground">Tanggal pengajuan terkunci pada hari ini.</p>
              {errors.tanggal && (
                <p className="text-sm text-destructive">{errors.tanggal.message}</p>
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
                  H-3 Warning
                </div>
                <div className="mt-1">
                  Pengajuan izin kurang dari 3 hari. Mohon hubungi admin jika mendesak.
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Panel 3: Status & Catatan */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Status & Catatan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={selectedStatus}
                onValueChange={(v) => setValue("status", v as any, { shouldValidate: true })}
                disabled={!canManage}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diajukan">Diajukan</SelectItem>
                  {canManage && (
                    <>
                      <SelectItem value="disetujui">Disetujui</SelectItem>
                      <SelectItem value="ditolak">Ditolak</SelectItem>
                      <SelectItem value="dibatalkan">Dibatalkan</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {canManage ? "Pilih status pengajuan." : "Status pengajuan otomatis 'Diajukan'."}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Catatan / Alasan</Label>
              <textarea
                {...register("catatan")}
                placeholder="Tuliskan alasan pengajuan secara jelas..."
                className="flex min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {errors.catatan && (
                <p className="text-sm text-destructive">{errors.catatan.message}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-4 p-4 border-t bg-muted/20">
        <Button variant="outline" type="button" onClick={() => router.back()}>
          Batal
        </Button>
        <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
          {isSubmitting ? "Menyimpan..." : "Simpan Pengajuan"}
        </Button>
      </div>
    </form>
  );
}
