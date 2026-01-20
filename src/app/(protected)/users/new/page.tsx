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
import * as usersUsecase from "@/modules/identity/application/usecases/users.usecase";
import * as rolesUsecase from "@/modules/identity/application/usecases/roles.usecase";
import type { Role } from "@/modules/identity/domain/entities";
import { toast } from "sonner";

const STATUS = ["Aktif", "Non Aktif"] as const;

const schema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  status: z.enum(STATUS),
  role: z.string().min(1, "Role wajib dipilih"),
});

type Form = z.infer<typeof schema>;

export default function UsersNewPage() {
  const { allowed } = usePermissionGuard("users.create");
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", status: "Aktif", role: "" },
  });

  useEffect(() => {
    if (!allowed) return;
    rolesUsecase
      .getRolesUsecase({ page: 1, per_page: 100 })
      .then((r) => setRoles(r.items))
      .catch(() => toast.error("Gagal memuat roles"));
  }, [allowed]);

  async function onSubmit(values: Form) {
    try {
      await usersUsecase.createUserUsecase({
        name: values.name,
        email: values.email,
        password: values.password,
        status: values.status,
        role: values.role,
      });
      toast.success("User berhasil dibuat");
      router.replace("/users");
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
          { label: "Users", href: "/users" },
          { label: "New" },
        ]}
      />
      <PageHeader title="Tambah User" description="Buat user baru" />

      <Card className="max-w-lg rounded-2xl shadow-sm">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama</Label>
              <Input id="name" {...register("name")} placeholder="Nama lengkap" />
              {errors.name && (
                <p className="text-destructive text-sm">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="email@contoh.com"
              />
              {errors.email && (
                <p className="text-destructive text-sm">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                placeholder="Min. 8 karakter"
              />
              {errors.password && (
                <p className="text-destructive text-sm">
                  {errors.password.message}
                </p>
              )}
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
                  {STATUS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={watch("role")}
                onValueChange={(v) => setValue("role", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.name}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-destructive text-sm">{errors.role.message}</p>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan…" : "Simpan"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/users">Batal</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
