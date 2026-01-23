
"use client";

import { useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  createPengaturanCuti,
  updatePengaturanCuti,
} from "../../infrastructure/pengaturan-cuti.repository";
import type { PengaturanCuti } from "../../domain/entities";
import { Users, BookOpen, Clock, Banknote, ShieldCheck } from "lucide-react";

const formSchema = z.object({
  kategori_karyawan: z.enum(["tetap", "kontrak", "freelance"]),
  subtipe_kontrak: z.enum(["full_time", "part_time"]).optional().nullable(),
  divisi: z.string(), // changed from kategori_mapel enum to string for flexibility or matching enum
  jenis: z.enum(["izin", "sakit"]),
  periode: z.enum(["bulanan", "tahunan"]),
  maksimal_pengajuan: z.union([z.string(), z.number()]).optional().nullable(),
  minimal_hari_pengajuan: z.union([z.string(), z.number()]),
  potongan_tipe: z.enum(["per_hari", "flat", "none"]),
  potongan_nilai: z.union([z.string(), z.number()]).optional().nullable(),
  aktif: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface PengaturanCutiFormProps {
  initialData?: PengaturanCuti;
  isEdit?: boolean;
}

export function PengaturanCutiForm({ initialData, isEdit = false }: PengaturanCutiFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      kategori_karyawan: (initialData?.kategori_karyawan as any) || "tetap",
      subtipe_kontrak: (initialData?.subtipe_kontrak as any) || null,
      divisi: (initialData as any)?.divisi || "all", // use 'all' as default for safety
      jenis: initialData?.jenis || "izin",
      periode: initialData?.periode || "tahunan",
      maksimal_pengajuan: initialData?.maksimal_pengajuan ?? "",
      minimal_hari_pengajuan: initialData?.minimal_hari_pengajuan ?? 0,
      potongan_tipe: initialData?.potongan_tipe || "none",
      potongan_nilai: initialData?.potongan_nilai ?? 0,
      aktif: initialData?.aktif ?? true,
    },
  });

  const kategori = watch("kategori_karyawan");
  const subtipe = watch("subtipe_kontrak");
  const divisi = watch("divisi");
  const jenis = watch("jenis");
  const periode = watch("periode");
  const potonganTipe = watch("potongan_tipe");
  const aktif = watch("aktif");

  useEffect(() => {
    if (kategori !== "kontrak") {
      setValue("subtipe_kontrak", null);
    }
  }, [kategori, setValue]);

  useEffect(() => {
    if (potonganTipe === "none") {
      setValue("potongan_nilai", null);
    }
  }, [potonganTipe, setValue]);

  async function onSubmit(values: FormValues) {
    try {
      const payload = {
        ...values,
        maksimal_pengajuan: values.maksimal_pengajuan === "" ? null : Number(values.maksimal_pengajuan),
        minimal_hari_pengajuan: Number(values.minimal_hari_pengajuan),
        potongan_nilai: values.potongan_nilai ? Number(values.potongan_nilai) : null,
      };

      if (isEdit && initialData) {
        await updatePengaturanCuti(initialData.id, payload as any);
        toast.success("Aturan cuti diperbarui");
      } else {
        await createPengaturanCuti(payload as any);
        toast.success("Aturan cuti dibuat");
      }
      router.push("/pengaturan-cuti");
    } catch (e: any) {
      toast.error(e?.message || "Gagal menyimpan aturan");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Panel 1: Target Karyawan */}
        <Card className="shadow-sm border-muted-foreground/10">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Target Karyawan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Kategori Karyawan</Label>
              <Select
                value={kategori}
                onValueChange={(v) => setValue("kategori_karyawan", v as any, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tetap">Tetap</SelectItem>
                  <SelectItem value="kontrak">Kontrak</SelectItem>
                  <SelectItem value="freelance">Freelance</SelectItem>
                </SelectContent>
              </Select>
              {errors.kategori_karyawan && (
                <p className="text-sm text-destructive">{errors.kategori_karyawan.message}</p>
              )}
            </div>

            {kategori === "kontrak" && (
              <div className="space-y-2">
                <Label>Subtipe Kontrak</Label>
                <Select
                  value={subtipe || ""}
                  onValueChange={(v) => setValue("subtipe_kontrak", v as any, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Subtipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                  </SelectContent>
                </Select>
                {errors.subtipe_kontrak && (
                  <p className="text-sm text-destructive">{errors.subtipe_kontrak.message}</p>
                )}
              </div>
            )}
            
            <Separator className="my-2" />

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <Label>Divisi / Kategori Mengajar</Label>
              </div>
              <Select
                value={divisi}
                onValueChange={(v) => setValue("divisi", v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Divisi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Divisi</SelectItem>
                  <SelectItem value="Coding">Coding</SelectItem>
                  <SelectItem value="Non-Coding">Non-Coding</SelectItem>
                  <SelectItem value="Operasional">Operasional</SelectItem>
                </SelectContent>
              </Select>
              {errors.divisi && (
                <p className="text-sm text-destructive">{errors.divisi.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Jenis Pengajuan</Label>
              <Select
                value={jenis}
                onValueChange={(v) => setValue("jenis", v as any, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Jenis" />
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

        {/* Panel 2: Aturan Kuota */}
        <Card className="shadow-sm border-muted-foreground/10">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary" />
              Aturan Kuota & Minimal Hari
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Periode</Label>
              <Select
                value={periode}
                onValueChange={(v) => setValue("periode", v as any, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Periode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bulanan">Bulanan</SelectItem>
                  <SelectItem value="tahunan">Tahunan</SelectItem>
                </SelectContent>
              </Select>
              {errors.periode && (
                <p className="text-sm text-destructive">{errors.periode.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Maksimal Pengajuan (Kali)</Label>
              <Input
                {...register("maksimal_pengajuan")}
                type="number"
                placeholder="Kosongkan jika unlimited"
              />
              <p className="text-xs text-muted-foreground">Biarkan kosong untuk tanpa batas.</p>
              {errors.maksimal_pengajuan && (
                <p className="text-sm text-destructive">{errors.maksimal_pengajuan.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Minimal Hari Sebelum (H-?)</Label>
              <Input
                {...register("minimal_hari_pengajuan")}
                type="number"
                min={0}
              />
              <p className="text-xs text-muted-foreground">Minimal hari pengajuan sebelum tanggal.</p>
              {errors.minimal_hari_pengajuan && (
                <p className="text-sm text-destructive">{errors.minimal_hari_pengajuan.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Panel 3: Potongan */}
        <Card className="shadow-sm border-muted-foreground/10">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Banknote className="h-5 w-5 text-primary" />
              Potongan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tipe Potongan</Label>
              <Select
                value={potonganTipe}
                onValueChange={(v) => setValue("potongan_tipe", v as any, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak Ada</SelectItem>
                  <SelectItem value="per_hari">Per Hari (Gaji Pokok / Hari Kerja)</SelectItem>
                  <SelectItem value="flat">Flat (Nominal Tetap)</SelectItem>
                </SelectContent>
              </Select>
              {errors.potongan_tipe && (
                <p className="text-sm text-destructive">{errors.potongan_tipe.message}</p>
              )}
            </div>

            {potonganTipe !== "none" && (
              <div className="space-y-2">
                <Label>Nilai Potongan</Label>
                <Input
                  {...register("potongan_nilai")}
                  type="number"
                />
                <p className="text-xs text-muted-foreground">
                  {potonganTipe === "flat"
                    ? "Masukkan nominal Rupiah"
                    : "Nilai perkalian/koefisien (misal 1 untuk 1x gaji per hari)"}
                </p>
                {errors.potongan_nilai && (
                  <p className="text-sm text-destructive">{errors.potongan_nilai.message}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Panel 4: Status */}
        <Card className="shadow-sm border-muted-foreground/10">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Status Aktif</Label>
                <p className="text-sm text-muted-foreground">
                  Aktifkan aturan ini untuk diterapkan.
                </p>
              </div>
              <Switch
                checked={aktif}
                onCheckedChange={(v) => setValue("aktif", v)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-4">
        <Button variant="outline" type="button" onClick={() => router.back()}>
          Batal
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan..." : "Simpan Aturan"}
        </Button>
      </div>
    </form>
  );
}
