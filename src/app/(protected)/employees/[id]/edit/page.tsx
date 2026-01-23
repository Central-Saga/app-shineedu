"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { ConfirmDialog } from "@/modules/identity/presentation/components/shared/ConfirmDialog";
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
import { ValidationError } from "@/shared/infrastructure/api/errors";
import { applyValidationErrors } from "@/shared/lib/applyValidationErrors";
import { getEmployeeUsecase } from "@/modules/employees/application/usecases/getEmployee.usecase";
import { getEmployeesUsecase } from "@/modules/employees/application/usecases/getEmployees.usecase";
import { updateEmployeeUsecase } from "@/modules/employees/application/usecases/updateEmployee.usecase";
import { deleteEmployeeUsecase } from "@/modules/employees/application/usecases/deleteEmployee.usecase";
import { getUserUsecase, updateUserUsecase, updateUserRoleUsecase } from "@/modules/identity/application/usecases/users.usecase";
import { getRolesUsecase } from "@/modules/identity/application/usecases/roles.usecase";
import { authStore } from "@/modules/auth/infrastructure/auth.store";
import type { Employee } from "@/modules/employees/domain/entities";
import type { Role } from "@/modules/identity/domain/entities";
import { NotFoundError } from "@/shared/infrastructure/api/errors";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";
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
  divisi: z.string().optional(),
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
    divisi: e.divisi ?? "",
  };
}

export default function EmployeesEditPage() {
  const { allowed } = usePermissionGuard("employees.update");
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [roles, setRoles] = useState<Role[]>([]);
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
      divisi: "",
    },
  });

  const { register: registerUser, watch: watchUser, setValue: setUserValue, reset: resetUser, formState: { errors: userErrors } } = useForm({
    defaultValues: { name: "", email: "", password: "", status: "Aktif", role: "" }
  });

  const { setItems } = useBreadcrumbStore();

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Karyawan", href: "/employees" },
      { label: "Edit Karyawan" },
    ]);
  }, [setItems]);

  useEffect(() => {
    if (!allowed || !id || Number.isNaN(id)) return;
    
    const fetchData = async () => {
      try {
        const [emp, rolesRes] = await Promise.all([
          getEmployeeUsecase(id),
          getRolesUsecase({ page: 1, per_page: 100 }),
        ]);
        
        setRoles(rolesRes.items);
        reset(mapEmployeeToForm(emp));
        
        if (emp.user) {
          const user = await getUserUsecase(emp.user.id);
          resetUser({
            name: user.name,
            email: user.email,
            password: "",
            status: (user.status as any) ?? "Aktif",
            role: user.roles?.[0]?.name ?? "",
          });
        }
      } catch (e) {
        if (e instanceof NotFoundError) {
          toast.error("Karyawan tidak ditemukan");
          router.replace("/employees");
        } else {
          toast.error("Gagal memuat data karyawan");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [allowed, id, reset, resetUser, router]);

  async function onSave(values: Form) {
    // Check if kode_karyawan is unique among other employees
    try {
      const { items } = await getEmployeesUsecase({ q: values.kode_karyawan });
      const exists = items.some(e => e.kode_karyawan === values.kode_karyawan && e.id !== id);
      if (exists) {
        setError("kode_karyawan", { message: "Kode karyawan sudah terdaftar." });
        toast.error("Kode karyawan sudah digunakan.");
        return;
      }
    } catch (e) {
      console.error("Uniqueness check failed", e);
    }

    try {
      // 1. Update Employee
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
        status: values.status || "aktif",
        divisi: values.divisi || null,
      });

      // 2. Update linked User if exists
      if (values.user_id) {
        const userValues = watchUser();
        await updateUserUsecase(values.user_id, {
          name: userValues.name,
          email: userValues.email,
          status: userValues.status,
          ...(userValues.password ? { password: userValues.password } : {}),
        });
        await updateUserRoleUsecase(values.user_id, userValues.role);
      }

      toast.success("Data Karyawan & User berhasil diupdate");
      router.push("/employees");
    } catch (e) {
      if (e instanceof ValidationError && e.validationErrors) {
        applyValidationErrors(
          setError as (a: string, b: { type?: string; message: string }) => void,
          e.validationErrors
        );
      } else {
        toast.error(e instanceof Error ? e.message : "Gagal mengupdate karyawan");
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

  const kategori = watch("kategori_karyawan");

  return (
    <div className="w-full">
      <PageHeader title="Edit Karyawan" description={`Ubah data untuk "${watchUser("name") || watch("kode_karyawan")}"`} />

      <form onSubmit={handleSubmit(onSave)} className="space-y-6">
        <Accordion defaultValue="data-karyawan" className="w-full">
          {/* Panel 1: Akun User */}
          <AccordionItem value="akun-user">
            <AccordionTrigger description="Informasi kredensial login">
              Akun User
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nama Lengkap</Label>
                  <Input {...registerUser("name")} placeholder="Nama lengkap user" />
                  {userErrors.name && <p className="text-destructive text-sm">{userErrors.name.message as string}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" {...registerUser("email")} placeholder="email@contoh.com" />
                  {userErrors.email && <p className="text-destructive text-sm">{userErrors.email.message as string}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" {...registerUser("password")} placeholder="Kosongkan jika tidak diubah" />
                  <p className="text-[11px] text-muted-foreground">Minimal 8 karakter unik</p>
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={watchUser("role")}
                    onValueChange={(v) => setUserValue("role", v as any, { shouldValidate: true })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {userErrors.role && <p className="text-destructive text-sm">{userErrors.role.message as string}</p>}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Panel 2: Data Karyawan */}
          <AccordionItem value="data-karyawan">
            <AccordionTrigger description="Identitas dasar dan kode karyawan">
              Data Karyawan
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label>Kode Karyawan</Label>
                  <Input {...register("kode_karyawan")} readOnly className="bg-slate-50 font-mono" />
                </div>
                <div className="space-y-2">
                  <Label>Kategori Karyawan</Label>
                  <Select
                    value={watch("kategori_karyawan") ?? "tetap"}
                    onValueChange={(v) => {
                      setValue("kategori_karyawan", v as any);
                      if (v !== "kontrak") setValue("subtipe_kontrak", null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tetap">Tetap</SelectItem>
                      <SelectItem value="kontrak">Kontrak</SelectItem>
                      <SelectItem value="freelance">Freelance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Divisi / Kategori Mengajar</Label>
                  <Select
                    value={watch("divisi") ?? ""}
                    onValueChange={(v) => setValue("divisi", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Divisi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Coding">Coding</SelectItem>
                      <SelectItem value="Non-Coding">Non-Coding</SelectItem>
                      <SelectItem value="Operasional">Operasional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {kategori === "kontrak" && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-left-2">
                    <Label>Subtipe Kontrak</Label>
                    <Select
                      value={watch("subtipe_kontrak") ?? ""}
                      onValueChange={(v) => setValue("subtipe_kontrak", v as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih subtipe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_time">Full Time</SelectItem>
                        <SelectItem value="part_time">Part Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Panel 3: Kontrak & Gaji */}
          <AccordionItem value="payroll">
            <AccordionTrigger description="Informasi penggajian dan tipe kontrak">
              Kontrak & Gaji
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipe Gaji</Label>
                  <Select
                    value={watch("tipe_gaji") ?? ""}
                    onValueChange={(v) => setValue("tipe_gaji", v as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tipe gaji" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bulanan">Bulanan</SelectItem>
                      <SelectItem value="per_sesi">Per Sesi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Gaji Pokok</Label>
                  <Input type="number" {...register("gaji_pokok")} placeholder="0" />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Panel 4: Bank */}
          <AccordionItem value="bank">
            <AccordionTrigger description="Rekening bank untuk pencairan gaji">
              Bank
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nama Bank</Label>
                  <Input {...register("bank_nama")} placeholder="Contoh: BCA" />
                </div>
                <div className="space-y-2">
                  <Label>Nomor Rekening</Label>
                  <Input {...register("bank_no_rekening")} placeholder="0000000000" />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Panel 5: Kontak & Alamat */}
          <AccordionItem value="kontak">
            <AccordionTrigger description="Informasi komunikasi dan tempat tinggal">
              Kontak & Alamat
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nomor HP</Label>
                  <Input {...register("nomor_hp")} placeholder="08xxxxxxxxxx" />
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Lahir</Label>
                  <DatePicker
                    date={(val => val ? new Date(val) : undefined)(watch("tanggal_lahir"))}
                    setDate={(d) => setValue("tanggal_lahir", d ? format(d, "yyyy-MM-dd") : "")}
                    placeholder="Pilih tanggal lahir"
                  />
                </div>
                <div className="col-span-full space-y-2">
                  <Label>Alamat</Label>
                  <Input {...register("alamat")} placeholder="Alamat lengkap" />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex flex-wrap items-center gap-3 pt-6">
          <Button type="submit" size="lg" disabled={isSubmitting} className="px-8 font-bold">
            {isSubmitting ? "Menyimpan…" : "Simpan Perubahan"}
          </Button>
          <Button type="button" variant="outline" size="lg" asChild>
            <Link href="/employees">Batal</Link>
          </Button>
          {canDeleteRole && (
            <Button
              type="button"
              variant="destructive"
              size="lg"
              onClick={() => setDeleteOpen(true)}
              className="ml-auto"
            >
              <Trash2 className="mr-2 size-4" />
              Hapus Karyawan
            </Button>
          )}
        </div>
      </form>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Hapus Karyawan"
        description="Anda yakin ingin menghapus karyawan ini? Akun user terkait tidak akan dihapus otomatis."
        confirmLabel="Hapus"
        variant="destructive"
        onConfirm={onDelete}
      />
    </div>
  );
}
