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

  const { setItems } = useBreadcrumbStore();

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Users", href: "/users" },
      { label: "Tambah User" },
    ]);
  }, [setItems]);

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
      } else {
        toast.error(e instanceof Error ? e.message : "Gagal membuat user");
      }
    }
  }

  if (!allowed) return null;

  return (
    <div>
      <PageHeader title="Tambah User" description="Buat user baru" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Main Panel: User Data */}
          <Card className="rounded-2xl shadow-sm overflow-hidden">
            <div className="border-b bg-slate-50/50 px-4 py-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Data Pengguna</h3>
            </div>
            <CardContent className="space-y-3 pt-4">
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
            </CardContent>
          </Card>

          {/* Side Panel: Role & Access */}
          <Card className="rounded-2xl shadow-sm overflow-hidden">
            <div className="border-b bg-slate-50/50 px-4 py-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Role & Akses</h3>
            </div>
            <CardContent className="space-y-3 pt-4">
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
              <div className="pt-2">
                <p className="text-xs text-muted-foreground italic">
                  * Status pengguna akan otomatis disetel sebagai <strong>Aktif</strong>.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" size="lg" disabled={isSubmitting} className="px-8">
            {isSubmitting ? "Menyimpan…" : "Simpan"}
          </Button>
          <Button type="button" variant="outline" size="lg" asChild>
            <Link href="/users">Batal</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
