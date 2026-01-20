"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppBreadcrumbs } from "@/shared/presentation/components/AppBreadcrumbs";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { authStore } from "@/modules/auth/infrastructure/auth.store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { createUserUsecase, getUsersUsecase } from "@/modules/identity/application/usecases/users.usecase";
import { getRolesUsecase } from "@/modules/identity/application/usecases/roles.usecase";
import type { IdentityUser } from "@/modules/identity/domain/entities";
import type { Role } from "@/modules/identity/domain/entities";
import { toast } from "sonner";
import { EmployeeForm } from "./EmployeeForm";
import { UserInlineCreateForm, type UserInlineCreateFormRef } from "./UserInlineCreateForm";

type UserMode = "existing" | "create";

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
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

function toNum(v: string | number | undefined): number | null {
  if (v === "" || v === undefined || v === null) return null;
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isNaN(n) ? null : n;
}

function toEmployeePayload(
  v: EmployeeFormValues
): Omit<Parameters<typeof createEmployeeUsecase>[0], "user_id"> {
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
  };
}

export default function EmployeesNewPage() {
  const { allowed } = usePermissionGuard("employees.create");
  const router = useRouter();
  const [userMode, setUserMode] = useState<UserMode>("existing");
  const [users, setUsers] = useState<IdentityUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const userFormRef = useRef<UserInlineCreateFormRef | null>(null);

  const canCreateUser = authStore.hasPermission("users.create");

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
    },
  });

  useEffect(() => {
    if (!allowed) return;
    getUsersUsecase({ page: 1, per_page: 100 })
      .then((r) => setUsers(r.users))
      .catch(() => toast.error("Gagal memuat users"));
    getRolesUsecase({ page: 1, per_page: 100 })
      .then((r) => setRoles(r.items))
      .catch(() => toast.error("Gagal memuat roles"));
  }, [allowed]);

  async function onSubmit(values: EmployeeFormValues) {
    if (userMode === "existing") {
      if (!values.user_id || values.user_id < 1) {
        setError("user_id", { message: "User wajib dipilih" });
        return;
      }
      try {
        await createEmployeeUsecase({
          ...toEmployeePayload(values),
          user_id: values.user_id,
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
      return;
    }

    // userMode === "create"
    const ok = await userFormRef.current?.trigger();
    if (!ok || !userFormRef.current) return;
    const userValues = userFormRef.current.getValues();

    try {
      const created = await createUserUsecase(userValues);
      try {
        await createEmployeeUsecase({
          ...toEmployeePayload(values),
          user_id: created.id,
        });
        toast.success("User dan Karyawan berhasil dibuat");
        router.replace("/employees");
      } catch (empErr) {
        toast.error("User berhasil dibuat, tetapi karyawan gagal disimpan.");
        if (empErr instanceof ValidationError && empErr.validationErrors) {
          applyValidationErrors(
            setError as (a: string, b: { type?: string; message: string }) => void,
            empErr.validationErrors
          );
        }
      }
    } catch (userErr) {
      if (userErr instanceof ValidationError && userErr.validationErrors && userFormRef.current) {
        applyValidationErrors(userFormRef.current.setError, userErr.validationErrors);
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
            {/* Section: Informasi Akun User */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Informasi Akun User</h3>
              {userMode === "existing" ? (
                <>
                  <div className="space-y-2">
                    <Label>Pilih user yang akan dikaitkan dengan karyawan ini</Label>
                    <Select
                      value={watch("user_id") && Number(watch("user_id")) >= 1 ? String(watch("user_id")) : ""}
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
                  {canCreateUser && (
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0 text-sm"
                      onClick={() => setUserMode("create")}
                    >
                      Buat User Baru
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <UserInlineCreateForm
                    ref={userFormRef}
                    roles={roles}
                    onCancel={() => {
                      setUserMode("existing");
                      userFormRef.current?.reset();
                    }}
                  />
                </>
              )}
            </div>

            {/* Form Karyawan */}
            <div className="space-y-4">
              <EmployeeForm
                register={register}
                setValue={setValue}
                watch={watch}
                errors={errors}
              />
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
