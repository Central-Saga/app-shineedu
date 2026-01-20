"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppBreadcrumbs } from "@/shared/presentation/components/AppBreadcrumbs";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { ConfirmDialog } from "@/modules/identity/presentation/components/shared/ConfirmDialog";
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
import { Switch } from "@/components/ui/switch";
import { ValidationError } from "@/shared/infrastructure/api/errors";
import { applyValidationErrors } from "@/shared/lib/applyValidationErrors";
import { getEmployeeUsecase } from "@/modules/employees/application/usecases/getEmployee.usecase";
import { updateEmployeeUsecase } from "@/modules/employees/application/usecases/updateEmployee.usecase";
import { deleteEmployeeUsecase } from "@/modules/employees/application/usecases/deleteEmployee.usecase";
import { getUsersUsecase } from "@/modules/identity/application/usecases/users.usecase";
import { authStore } from "@/modules/auth/infrastructure/auth.store";
import type { Employee } from "@/modules/employees/domain/entities";
import type { IdentityUser } from "@/modules/identity/domain/entities";
import { NotFoundError } from "@/shared/infrastructure/api/errors";
import { Trash2 } from "lucide-react";
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
  user_id: z.number().nullable(),
  kategori_karyawan: z.enum(["tetap", "kontrak", "freelance"]).optional(),
  subtipe_kontrak: z.enum(["full_time", "part_time"]).optional().nullable(),
  tipe_gaji: z.enum(["bulanan", "per_sesi"]).optional().nullable(),
  gaji_pokok: z.union([z.string(), z.number()]).optional(),
  bank_nama: z.string().optional(),
  bank_no_rekening: z.string().optional(),
  nomor_hp: z.string().optional(),
  alamat: z.string().optional(),
  tanggal_lahir: z.string().optional(),
  status: z.enum(STATUS_OPTIONS).optional(),
});

type Form = z.infer<typeof schema>;

function toNum(v: string | number | undefined): number | null {
  if (v === "" || v === undefined || v === null) return null;
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isNaN(n) ? null : n;
}

function mapEmployeeToForm(e: Employee): Form {
  const gaji = e.gaji_pokok;
  return {
    kode_karyawan: e.kode_karyawan,
    user_id: e.user?.id ?? null,
    kategori_karyawan: (e.kategori_karyawan === "tetap" || e.kategori_karyawan === "kontrak" || e.kategori_karyawan === "freelance")
      ? e.kategori_karyawan
      : "tetap",
    subtipe_kontrak: (e.subtipe_kontrak === "full_time" || e.subtipe_kontrak === "part_time")
      ? e.subtipe_kontrak
      : null,
    tipe_gaji: (e.tipe_gaji === "bulanan" || e.tipe_gaji === "per_sesi")
      ? e.tipe_gaji
      : null,
    gaji_pokok: gaji != null ? String(gaji) : "",
    bank_nama: e.bank?.nama ?? "",
    bank_no_rekening: e.bank?.rekening ?? "",
    nomor_hp: e.kontak?.nomor_hp ?? "",
    alamat: e.kontak?.alamat ?? "",
    tanggal_lahir: e.tanggal_lahir ?? "",
    status: (e.status === "aktif" || e.status === "nonaktif" ? e.status : "aktif") as "aktif" | "nonaktif",
  };
}

export default function EmployeesEditPage() {
  const { allowed } = usePermissionGuard("employees.update");
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [users, setUsers] = useState<IdentityUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const canDeleteRole = authStore.hasPermission("employees.delete");

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      kode_karyawan: "",
      user_id: null,
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
    if (!allowed || !id || Number.isNaN(id)) return;
    Promise.all([
      getEmployeeUsecase(id),
      getUsersUsecase({ page: 1, per_page: 100 }),
    ])
      .then(([emp, usersRes]) => {
        setUsers(usersRes.users);
        reset(mapEmployeeToForm(emp));
      })
      .catch((e) => {
        if (e instanceof NotFoundError) {
          toast.error("Karyawan tidak ditemukan");
          router.replace("/employees");
        } else {
          toast.error("Gagal memuat karyawan");
        }
      })
      .finally(() => setLoading(false));
  }, [allowed, id, reset, router]);

  async function onSave(values: Form) {
    try {
      await updateEmployeeUsecase(id, {
        kode_karyawan: values.kode_karyawan,
        user_id: values.user_id ?? undefined,
        kategori_karyawan: values.kategori_karyawan ?? null,
        subtipe_kontrak: values.subtipe_kontrak ?? null,
        tipe_gaji: values.tipe_gaji ?? null,
        gaji_pokok: toNum(values.gaji_pokok),
        bank_nama: values.bank_nama || null,
        bank_no_rekening: values.bank_no_rekening || null,
        nomor_hp: values.nomor_hp || null,
        alamat: values.alamat || null,
        tanggal_lahir: values.tanggal_lahir || null,
        status: values.status ?? null,
      });
      toast.success("Karyawan berhasil diupdate");
    } catch (e) {
      if (e instanceof ValidationError && e.validationErrors) {
        applyValidationErrors(
          setError as (a: string, b: { type?: string; message: string }) => void,
          e.validationErrors
        );
      }
    }
  }

  async function onDelete() {
    try {
      await deleteEmployeeUsecase(id);
      toast.success("Karyawan berhasil dihapus");
      router.replace("/employees");
    } finally {
      setDeleteOpen(false);
    }
  }

  if (!allowed) return null;
  if (loading) return <div className="p-4">Memuat…</div>;

  return (
    <div>
      <AppBreadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Karyawan", href: "/employees" },
          { label: "Edit" },
        ]}
      />
      <PageHeader title="Edit Karyawan" description="Ubah data karyawan" />

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="space-y-4 pt-6">
          <form onSubmit={handleSubmit(onSave)} className="space-y-4">
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
                  value={watch("user_id") != null ? String(watch("user_id")) : ""}
                  onValueChange={(v) => setValue("user_id", v ? Number(v) : null)}
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
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Kategori Karyawan</Label>
                <Select
                  value={watch("kategori_karyawan") ?? "tetap"}
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
              </div>
              <div className="space-y-2">
                <Label>Subtipe Kontrak</Label>
                <Select
                  value={watch("subtipe_kontrak") ?? "__none__"}
                  onValueChange={(v) => setValue("subtipe_kontrak", v === "__none__" ? null : (v as Form["subtipe_kontrak"]))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="—" />
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
                    <SelectValue placeholder="—" />
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
              <div className="flex items-center gap-2">
                <Switch
                  id="status"
                  checked={(watch("status") ?? "aktif") === "aktif"}
                  onCheckedChange={(c) => setValue("status", c ? "aktif" : "nonaktif")}
                />
                <span className="text-sm">Status: {watch("status") ?? "aktif"}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan…" : "Simpan"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/employees">Batal</Link>
              </Button>
              {canDeleteRole && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="mr-2 size-4" />
                  Hapus
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Hapus Karyawan"
        description="Anda yakin ingin menghapus karyawan ini?"
        confirmLabel="Hapus"
        variant="destructive"
        onConfirm={onDelete}
      />
    </div>
  );
}
