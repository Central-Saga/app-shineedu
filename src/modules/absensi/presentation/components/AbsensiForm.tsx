
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
import { format } from "date-fns";
import { toast } from "sonner";
import {
  createAbsensi,
  updateAbsensi,
} from "../../infrastructure/absensi.repository";
import type { Absensi } from "../../domain/entities";
import { getEmployeesUsecase } from "@/modules/employees/application/usecases/getEmployees.usecase";
import type { Employee } from "@/modules/employees/domain/entities";

const formSchema = z.object({
  karyawan_id: z.string().min(1, "Karyawan wajib dipilih"),
  tanggal: z.date(),
  status_kehadiran: z.enum(["hadir", "izin", "cuti", "sakit", "alpha"]),
  jam_masuk: z.string().optional(),
  jam_pulang: z.string().optional(),
  sumber_absen: z.enum(["mesin", "web", "mobile", "manual"]).default("manual"),
  catatan: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AbsensiFormProps {
  initialData?: Absensi;
  isEdit?: boolean;
}

export function AbsensiForm({ initialData, isEdit = false }: AbsensiFormProps) {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);

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
      tanggal: initialData?.tanggal ? new Date(initialData.tanggal) : new Date(),
      status_kehadiran: initialData?.status_kehadiran || "hadir",
      jam_masuk: initialData?.jam_masuk || "",
      jam_pulang: initialData?.jam_pulang || "",
      sumber_absen: initialData?.sumber_absen || "manual",
      catatan: initialData?.catatan || "",
    },
  });

  const status = watch("status_kehadiran");
  const karyawanId = watch("karyawan_id");
  const tanggal = watch("tanggal");
  const sumber = watch("sumber_absen");

  useEffect(() => {
    getEmployeesUsecase({ per_page: 100, status: "aktif" })
      .then((res) => setEmployees(res.items))
      .catch(() => toast.error("Gagal memuat list karyawan"));
  }, []);

  async function onSubmit(values: FormValues) {
    try {
      const payload = {
        karyawan_id: Number(values.karyawan_id),
        tanggal: format(values.tanggal, "yyyy-MM-dd"), // Correct format
        status_kehadiran: values.status_kehadiran,
        jam_masuk: values.status_kehadiran === "hadir" ? values.jam_masuk : null,
        jam_pulang: values.status_kehadiran === "hadir" ? values.jam_pulang : null,
        sumber_absen: values.sumber_absen,
        catatan: values.catatan,
      };

      if (isEdit && initialData) {
        await updateAbsensi(initialData.id, payload);
        toast.success("Absensi berhasil diperbarui");
      } else {
        await createAbsensi(payload);
        toast.success("Absensi berhasil dibuat");
      }
      router.push("/absensi");
    } catch (e: any) {
      toast.error(e?.message || "Gagal menyimpan absensi");
    }
  }

  const isHadir = status === "hadir";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Panel 1: Identitas & Tanggal */}
        <Card>
          <CardHeader>
            <CardTitle>Identitas & Tanggal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Karyawan</Label>
              <Select
                value={karyawanId}
                onValueChange={(v) => setValue("karyawan_id", v, { shouldValidate: true })}
                disabled={isEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Karyawan" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.user?.name || e.kode_karyawan} ({e.kode_karyawan})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.karyawan_id && (
                <p className="text-sm text-destructive">{errors.karyawan_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Tanggal</Label>
              <DatePicker
                date={tanggal}
                setDate={(d) => setValue("tanggal", d as Date, { shouldValidate: true })}
              />
              {errors.tanggal && (
                <p className="text-sm text-destructive">{errors.tanggal.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Panel 2: Kehadiran */}
        <Card>
          <CardHeader>
            <CardTitle>Kehadiran & Jam</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Status Kehadiran</Label>
              <Select
                value={status}
                onValueChange={(v) => setValue("status_kehadiran", v as any, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hadir">Hadir</SelectItem>
                  <SelectItem value="izin">Izin</SelectItem>
                  <SelectItem value="cuti">Cuti</SelectItem>
                  <SelectItem value="sakit">Sakit</SelectItem>
                  <SelectItem value="alpha">Alpha</SelectItem>
                </SelectContent>
              </Select>
              {errors.status_kehadiran && (
                <p className="text-sm text-destructive">{errors.status_kehadiran.message}</p>
              )}
            </div>

            {isHadir && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Jam Masuk</Label>
                  <Input type="time" {...register("jam_masuk")} />
                  {errors.jam_masuk && (
                    <p className="text-sm text-destructive">{errors.jam_masuk.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Jam Pulang</Label>
                  <Input type="time" {...register("jam_pulang")} />
                  {errors.jam_pulang && (
                    <p className="text-sm text-destructive">{errors.jam_pulang.message}</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Panel 3: Catatan */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Catatan & Sumber</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sumber Absen</Label>
                <Select
                  value={sumber}
                  onValueChange={(v) => setValue("sumber_absen", v as any, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sumber" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="mesin">Mesin</SelectItem>
                    <SelectItem value="web">Web</SelectItem>
                    <SelectItem value="mobile">Mobile</SelectItem>
                  </SelectContent>
                </Select>
                {errors.sumber_absen && (
                  <p className="text-sm text-destructive">{errors.sumber_absen.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Catatan</Label>
              <textarea
                {...register("catatan")}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {errors.catatan && (
                <p className="text-sm text-destructive">{errors.catatan.message}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-4">
        <Button variant="outline" type="button" onClick={() => router.back()}>
          Batal
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan..." : "Simpan Absensi"}
        </Button>
      </div>
    </form>
  );
}
