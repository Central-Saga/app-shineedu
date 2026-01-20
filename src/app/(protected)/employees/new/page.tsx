"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppBreadcrumbs } from "@/shared/presentation/components/AppBreadcrumbs";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ValidationError } from "@/shared/infrastructure/api/errors";
import { applyValidationErrors } from "@/shared/lib/applyValidationErrors";
import { createEmployeeUsecase } from "@/modules/employees/application/usecases/createEmployee.usecase";
import { getUsersUsecase } from "@/modules/identity/application/usecases/users.usecase";
import type { IdentityUser } from "@/modules/identity/domain/entities";
import { toast } from "sonner";

const STATUS_OPTIONS = ["aktif", "nonaktif"] as const;
const KATEGORI_OPTIONS = [
  { label: "Tetap", value: "tetap" },
  { label: "Kontrak", value: "kontrak" },
  { label: "Freelance", value: "freelance" },
];
const SUBTIPE_OPTIONS = [
  { label: "Full Time", value: "full_time" },
  { label: "Part Time", value: "part_time" },
];
const TIPE_GAJI_OPTIONS = [
  { label: "Bulanan", value: "bulanan" },
  { label: "Per Sesi", value: "per_sesi" },
];

const schema = z.object({
  kode_karyawan: z.string().min(1, "Kode karyawan wajib diisi"),
  user_id: z.number().min(1, "User wajib dipilih"),
  kategori_karyawan: z.enum(["tetap", "kontrak", "freelance"]),
  subtipe_kontrak: z.enum(["full_time", "part_time"]).optional().nullable(),
  tipe_gaji: z.enum(["bulanan", "per_sesi"]).optional().nullable(),
  gaji_pokok: z.union([z.string(), z.number()]).optional(),
  bank_nama: z.string().optional(),
  bank_no_rekening: z.string().optional(),
  nomor_hp: z.string().optional(),
  alamat: z.string().optional(),
  tanggal_lahir: z.string().optional(),
  status: z.enum(STATUS_OPTIONS),
});

type Form = z.infer<typeof schema>;

function toNum(v: string | number | undefined): number | null {
  if (v === "" || v === undefined || v === null) return null;
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isNaN(n) ? null : n;
}

export default function EmployeesNewPage() {
  const { allowed } = usePermissionGuard("employees.create");
  const router = useRouter();
  const [users, setUsers] = useState<IdentityUser[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      kode_karyawan: "",
      user_id: 0,
      kategori_karyawan: "tetap",
      subtipe_kontrak: null,
      tipe_gaji: null,
      gaji_pokok: "",
      bank_nama: "",
      bank_no_rekening: "",
      nomor_hp: "",
      alamat: "",
      tanggal_lahir: "",
      status: "aktif",
    },
  });

  useEffect(() => {
    if (!allowed) return;
    getUsersUsecase({ page: 1, per_page: 100 })
      .then((r) => setUsers(r.users))
      .catch(() => toast.error("Gagal memuat users"));
  }, [allowed]);

  async function onSubmit(values: Form) {
    try {
      await createEmployeeUsecase({
        kode_karyawan: values.kode_karyawan,
        user_id: values.user_id,
        kategori_karyawan: values.kategori_karyawan,
        subtipe_kontrak: values.subtipe_kontrak ?? null,
        tipe_gaji: values.tipe_gaji ?? null,
        gaji_pokok: toNum(values.gaji_pokok),
        bank_nama: values.bank_nama || null,
        bank_no_rekening: values.bank_no_rekening || null,
        nomor_hp: values.nomor_hp || null,
        alamat: values.alamat || null,
        tanggal_lahir: values.tanggal_lahir || null,
        status: values.status,
      });
      toast.success("Karyawan berhasil ditambahkan");
      router.replace("/employees");
    } catch (e) {
      if (e instanceof ValidationError && e.validationErrors) {
        applyValidationErrors(
          setError as (a: string, b: { type?: string; message: string }) => void,
          e.validationErrors
        );
      }
    }
  }

  if (!allowed) return null;

  return (
    <div>
      <AppBreadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Karyawan", href: "/employees" },
          { label: "New" },
        ]}
      />
      <PageHeader title="Tambah Karyawan" description="Tambah karyawan baru" />

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="space-y-4 pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="kode_karyawan">Kode Karyawan</Label>
                <Input id="kode_karyawan" {...register("kode_karyawan")} />
                {errors.kode_karyawan && (
                  <p className="text-destructive text-sm">{errors.kode_karyawan.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>User</Label>
                <Select
                  value={watch("user_id") ? String(watch("user_id")) : ""}
                  onValueChange={(v) => setValue("user_id", Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.name} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.user_id && (
                  <p className="text-destructive text-sm">{errors.user_id.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Kategori Karyawan</Label>
                <Select
                  value={watch("kategori_karyawan")}
                  onValueChange={(v) => setValue("kategori_karyawan", v as Form["kategori_karyawan"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KATEGORI_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.kategori_karyawan && (
                  <p className="text-destructive text-sm">{errors.kategori_karyawan.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Subtipe Kontrak</Label>
                <Select
                  value={watch("subtipe_kontrak") ?? "__none__"}
                  onValueChange={(v) => setValue("subtipe_kontrak", v === "__none__" ? null : (v as Form["subtipe_kontrak"]))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih (opsional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">—</SelectItem>
                    {SUBTIPE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipe Gaji</Label>
                <Select
                  value={watch("tipe_gaji") ?? "__none__"}
                  onValueChange={(v) => setValue("tipe_gaji", v === "__none__" ? null : (v as Form["tipe_gaji"]))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih (opsional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">—</SelectItem>
                    {TIPE_GAJI_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gaji_pokok">Gaji Pokok</Label>
                <Input
                  id="gaji_pokok"
                  type="number"
                  step="any"
                  {...register("gaji_pokok")}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bank_nama">Bank - Nama</Label>
                <Input id="bank_nama" {...register("bank_nama")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_no_rekening">Bank - No. Rekening</Label>
                <Input id="bank_no_rekening" {...register("bank_no_rekening")} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nomor_hp">Nomor HP</Label>
                <Input id="nomor_hp" {...register("nomor_hp")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tanggal_lahir">Tanggal Lahir</Label>
                <Input id="tanggal_lahir" type="date" {...register("tanggal_lahir")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alamat">Alamat</Label>
              <Input id="alamat" {...register("alamat")} />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={watch("status")}
                onValueChange={(v) => setValue("status", v as Form["status"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aktif">Aktif</SelectItem>
                  <SelectItem value="nonaktif">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan…" : "Simpan"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/employees">Batal</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
