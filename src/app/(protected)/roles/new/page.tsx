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
import { PermissionMatrix } from "@/modules/identity/presentation/components/roles/PermissionMatrix";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ValidationError } from "@/shared/infrastructure/api/errors";
import { applyValidationErrors } from "@/shared/lib/applyValidationErrors";
import * as rolesUsecase from "@/modules/identity/application/usecases/roles.usecase";
import * as permissionsUsecase from "@/modules/identity/application/usecases/permissions.usecase";
import type { Permission } from "@/modules/identity/domain/entities";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(50, "Maksimal 50 karakter"),
});

type Form = z.infer<typeof schema>;

export default function RolesNewPage() {
  const { allowed } = usePermissionGuard("roles.create");
  const router = useRouter();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (!allowed) return;
    permissionsUsecase
      .getPermissionsUsecase()
      .then(setPermissions)
      .catch(() => toast.error("Gagal memuat permissions"));
  }, [allowed]);

  async function onSubmit(values: Form) {
    try {
      const role = await rolesUsecase.createRoleUsecase({ name: values.name });
      if (selectedPermissions.length > 0) {
        await rolesUsecase.syncRolePermissionsUsecase(role.id, selectedPermissions);
      }
      toast.success("Role berhasil dibuat");
      router.replace("/roles");
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
          { label: "Roles", href: "/roles" },
          { label: "New" },
        ]}
      />
      <PageHeader title="Tambah Role" description="Buat role baru dengan Permission Matrix" />

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="space-y-6 pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Role</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Contoh: Staff"
                className="max-w-xs"
              />
              {errors.name && (
                <p className="text-destructive text-sm">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Permission Matrix</Label>
              <PermissionMatrix
                masterPermissions={permissions}
                selectedPermissions={selectedPermissions}
                onChange={setSelectedPermissions}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan…" : "Simpan"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/roles">Batal</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
