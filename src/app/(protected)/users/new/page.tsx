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
    <div className="w-full">
      <PageHeader title="Tambah User" description="Buat user baru dengan akses spesifik" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Accordion defaultValue="data-user" className="w-full">
          {/* Panel 1: Data User */}
          <AccordionItem value="data-user">
            <AccordionTrigger description="Informasi dasar akun pengguna">
              Data User
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <Input id="name" {...register("name")} placeholder="Contoh: Budi Santoso" />
                  <p className="text-[11px] text-muted-foreground">Nama lengkap sesuai identitas</p>
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
                  <p className="text-[11px] text-muted-foreground">Digunakan untuk login ke sistem</p>
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
                    placeholder="Minimal 8 karakter"
                  />
                  <p className="text-[11px] text-muted-foreground">Minimal 8 karakter unik</p>
                  {errors.password && (
                    <p className="text-destructive text-sm">
                      {errors.password.message}
                    </p>
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Panel 2: Role Assignment */}
          <AccordionItem value="role-assignment">
            <AccordionTrigger description="Tentukan hak akses dan modul yang dapat dibuka">
              Role Assignment
            </AccordionTrigger>
            <AccordionContent>
              <div className="max-w-md space-y-2">
                <Label>Pilih Role</Label>
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
                <p className="text-[11px] text-muted-foreground">Menentukan hak akses user di dashboard</p>
                {errors.role && (
                  <p className="text-destructive text-sm">{errors.role.message}</p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Panel 3: Status */}
          <AccordionItem value="status-panel">
            <AccordionTrigger description="Aktifkan atau nonaktifkan akun ini">
              Status
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 rounded-xl border px-4 py-3 bg-slate-50/50 cursor-not-allowed opacity-70">
                  <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-medium">Status: Aktif</span>
                </div>
                <p className="text-xs text-muted-foreground max-w-xs">
                  User baru secara otomatis berstatus <strong>Aktif</strong>. Gunakan halaman edit untuk merubah status di masa mendatang.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex items-center gap-3 pt-4">
          <Button type="submit" size="lg" disabled={isSubmitting} className="px-8">
            {isSubmitting ? "Menyimpan…" : "Buat User Baru"}
          </Button>
          <Button type="button" variant="outline" size="lg" asChild>
            <Link href="/users">Batal</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
