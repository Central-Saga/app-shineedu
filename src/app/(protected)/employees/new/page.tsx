"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
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
import { createEmployeeUsecase } from "@/modules/employees/application/usecases/createEmployee.usecase";
import { getEmployeesUsecase } from "@/modules/employees/application/usecases/getEmployees.usecase";
import { getRolesUsecase } from "@/modules/identity/application/usecases/roles.usecase";
import type { CreateEmployeePayload } from "@/modules/employees/domain/entities";
import type { Role } from "@/modules/identity/domain/entities";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";
import { RefreshCw } from "lucide-react";



const STATUS_OPTIONS = ["aktif", "nonaktif"] as const;

const employeeSchema = z.object({
  kode_karyawan: z.string().min(1, "Kode karyawan wajib diisi"),
  user_id: z.number().optional(),
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
  divisi: z.string().optional(),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

function toNum(v: string | number | undefined): number | null {
  if (v === "" || v === undefined || v === null) return null;
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isNaN(n) ? null : n;
}

function toEmployeePayload(
  v: EmployeeFormValues
): CreateEmployeePayload["employee"] {
  return {
    kode_karyawan: v.kode_karyawan,
    kategori_karyawan: v.kategori_karyawan,
    subtipe_kontrak: v.subtipe_kontrak ?? null,
    tipe_gaji: v.tipe_gaji ?? null,
    gaji_pokok: toNum(v.gaji_pokok),
    bank_nama: v.bank_nama || null,
    bank_no_rekening: v.bank_no_rekening || null,
    nomor_hp: v.nomor_hp || null,
    alamat: v.alamat || null,
    tanggal_lahir: v.tanggal_lahir || null,
    status: v.status,
    divisi: v.divisi || null,
  };
}

export default function EmployeesNewPage() {
  const { allowed } = usePermissionGuard("employees.create");
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
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
      divisi: "",
    },
  });

  const {
    register: registerUser,
    watch: watchUser,
    trigger: triggerUser,
    getValues: getUserValues,
    setError: setUserError,
    setValue: setUserValue,
    formState: { errors: userErrors }
  } = useForm({
    defaultValues: { name: "", email: "", password: "", status: "Aktif", role: "" }
  });

  const { setItems } = useBreadcrumbStore();
  const dob = watch("tanggal_lahir");

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Karyawan", href: "/employees" },
      { label: "Tambah Karyawan" },
    ]);
  }, [setItems]);

  useEffect(() => {
    if (!allowed) return;
    getRolesUsecase({ page: 1, per_page: 100 })
      .then((r) => setRoles(r.items))
      .catch(() => toast.error("Gagal memuat roles"));
  }, [allowed]);

  // Auto-generate code on DOB change
  useEffect(() => {
    if (dob) {
      generateCode();
    }
  }, [dob]);

  function generateCode() {
    const date = watch("tanggal_lahir");
    if (!date) return;
    
    // date might be a string (from previous input) or a Date object
    const d = new Date(date);
    if (isNaN(d.getTime())) return;

    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    const random = Math.floor(1000 + Math.random() * 9000); // 4 digits for better uniqueness
    setValue("kode_karyawan", `${dd}${mm}${yy}${random}`);
  }

  async function onSubmit(values: EmployeeFormValues) {
    // Check if kode_karyawan is unique
    try {
      const { items } = await getEmployeesUsecase({ q: values.kode_karyawan });
      const exists = items.some(e => e.kode_karyawan === values.kode_karyawan);
      if (exists) {
        setError("kode_karyawan", { message: "Kode karyawan sudah terdaftar. Silakan klik refresh untuk generate kode baru." });
        toast.error("Kode karyawan sudah digunakan.");
        return;
      }
    } catch (e) {
      console.error("Uniqueness check failed", e);
    }

    const isUserValid = await triggerUser();
    if (!isUserValid) return;

    const userValues = getUserValues();

    try {
      // Create User and Employee in ONE request (Atomic)
      await createEmployeeUsecase({
        user: {
          user_name: userValues.name,
          user_email: userValues.email,
          user_password: userValues.password,
          user_role: userValues.role,
        },
        employee: toEmployeePayload(values),
      });

      toast.success("User dan Karyawan berhasil ditambahkan");
      router.replace("/employees");
    } catch (e) {
      if (e instanceof ValidationError && e.validationErrors) {
        // Map backend errors like "user.user_email" back to form structure if possible
        // but for now, we just apply them.
        
        // Split errors for the two forms
        const employeeErrors: Record<string, string[]> = {};
        const userFormErrors: Record<string, string[]> = {};

        Object.entries(e.validationErrors).forEach(([key, msgs]) => {
          const messages = Array.isArray(msgs) ? msgs : [(msgs as any).message];
          
          if (key.startsWith("user.")) {
            // Map "user.user_name" to "name" in user form
            const field = key.replace("user.user_", "").replace("user.", "");
            userFormErrors[field] = messages;
          } else if (key.startsWith("employee.")) {
            const field = key.replace("employee.", "");
            employeeErrors[field] = messages;
          } else {
            employeeErrors[key] = messages;
          }
        });

        if (Object.keys(userFormErrors).length > 0) {
          applyValidationErrors(
            setUserError as (a: string, b: { type?: string; message: string }) => void,
            userFormErrors
          );
          toast.error("Gagal membuat akun user. Cek kembali form Akun User.");
        }

        if (Object.keys(employeeErrors).length > 0) {
          applyValidationErrors(
            setError as (a: string, b: { type?: string; message: string }) => void,
            employeeErrors
          );
          toast.error("Gagal menyimpan data karyawan.");
        }
      } else {
        toast.error(e instanceof Error ? e.message : "Gagal menyimpan data");
      }
    }
  }

  if (!allowed) return null;

  const kategori = watch("kategori_karyawan");

  return (
    <div className="w-full">
      <PageHeader title="Tambah Karyawan" description="Lengkapi data untuk menambahkan karyawan baru dan akun aksesnya" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Accordion defaultValue="akun-user" className="w-full">
          {/* Panel 1: Akun User */}
          <AccordionItem value="akun-user">
            <AccordionTrigger description="Informasi kredensial untuk login sistem">
              Akun User
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nama Lengkap</Label>
                  <Input {...registerUser("name")} placeholder="Nama lengkap user" />
                  <p className="text-[11px] text-muted-foreground">Digunakan sebagai nama tampilan</p>
                  {userErrors.name && <p className="text-destructive text-sm">{userErrors.name.message as string}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" {...registerUser("email")} placeholder="email@contoh.com" />
                  <p className="text-[11px] text-muted-foreground">Digunakan untuk akses login</p>
                  {userErrors.email && <p className="text-destructive text-sm">{userErrors.email.message as string}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" {...registerUser("password")} placeholder="Minimal 8 karakter" />
                  <p className="text-[11px] text-muted-foreground">Minimal 8 karakter unik</p>
                  {userErrors.password && <p className="text-destructive text-sm">{userErrors.password.message as string}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={watchUser("role")}
                    onValueChange={(v) => setUserValue("role", v, { shouldValidate: true })}
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
                  <p className="text-[11px] text-muted-foreground">Menentukan akses di dashboard</p>
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
                  <div className="flex gap-2">
                    <Input {...register("kode_karyawan")} readOnly className="bg-slate-50 font-mono" />
                    <Button type="button" variant="outline" size="icon" onClick={generateCode}>
                      <RefreshCw className="size-4" />
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Otomatis dari tanggal lahir + random</p>
                  {errors.kode_karyawan && <p className="text-destructive text-sm">{errors.kode_karyawan.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Kategori Karyawan</Label>
                  <Select
                    value={watch("kategori_karyawan")}
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
                  <p className="text-[11px] text-muted-foreground">Hubungan kerja utama</p>
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
                  <p className="text-[11px] text-muted-foreground">Wajib untuk pengajar (Coding/Non-Coding)</p>
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
                  <p className="text-[11px] text-muted-foreground">Metode perhitungan gaji</p>
                </div>
                <div className="space-y-2">
                  <Label>Gaji Pokok</Label>
                  <Input type="number" {...register("gaji_pokok")} placeholder="0" />
                  <p className="text-[11px] text-muted-foreground">Nominal IDR per bulan/sesi</p>
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
                    date={(() => {
                      const tanggalLahir = watch("tanggal_lahir");
                      return tanggalLahir ? new Date(tanggalLahir) : null;
                    })()}
                    setDate={(d) => setValue("tanggal_lahir", d ? format(d, "yyyy-MM-dd") : "")}
                    placeholder="Pilih tanggal lahir"
                  />
                  <p className="text-[11px] text-muted-foreground">Otomatis merubah Kode Karyawan</p>
                </div>
                <div className="col-span-full space-y-2">
                  <Label>Alamat</Label>
                  <Input {...register("alamat")} placeholder="Alamat lengkap" />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex gap-3 pt-6">
          <Button type="submit" size="lg" disabled={isSubmitting} className="px-8 font-bold">
            {isSubmitting ? "Menyimpan…" : "Simpan Karyawan & User"}
          </Button>
          <Button type="button" variant="outline" size="lg" asChild>
            <Link href="/employees">Batal</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
