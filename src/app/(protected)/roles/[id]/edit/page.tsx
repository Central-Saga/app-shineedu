"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppBreadcrumbs } from "@/shared/presentation/components/AppBreadcrumbs";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { PermissionMatrix } from "@/modules/identity/presentation/components/roles/PermissionMatrix";
import { ConfirmDialog } from "@/modules/identity/presentation/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authStore } from "@/modules/auth/infrastructure/auth.store";
import * as rolesUsecase from "@/modules/identity/application/usecases/roles.usecase";
import * as permissionsUsecase from "@/modules/identity/application/usecases/permissions.usecase";
import type { Role, Permission } from "@/modules/identity/domain/entities";
import { ForbiddenError, NotFoundError } from "@/shared/infrastructure/api/errors";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function RolesEditPage() {
  const { allowed } = usePermissionGuard("roles.update");
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [editName, setEditName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [savingName, setSavingName] = useState(false);
  const [savingPerms, setSavingPerms] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  const canSaveName = authStore.hasPermission("roles.update");
  const canSavePerms = authStore.hasPermission("roles.manage");
  const canDelete = authStore.hasPermission("roles.delete");

  useEffect(() => {
    if (!allowed || !id || Number.isNaN(id)) return;
    Promise.all([
      rolesUsecase.getRoleUsecase(id),
      permissionsUsecase.getPermissionsUsecase(),
    ])
      .then(([r, p]) => {
        setRole(r);
        setPermissions(p);
        setEditName(r.name);
        setSelectedPermissions((r.permissions ?? []).map((x) => x.name));
      })
      .catch((e) => {
        if (e instanceof ForbiddenError) {
          setForbidden(true);
          toast.error("Role ini tidak dapat diedit");
        } else if (e instanceof NotFoundError) {
          toast.error("Role tidak ditemukan");
          router.replace("/roles");
        } else {
          toast.error("Gagal memuat role");
        }
      })
      .finally(() => setLoading(false));
  }, [allowed, id, router]);

  async function handleSaveName() {
    if (!role || !canSaveName || editName === role.name) return;
    setSavingName(true);
    try {
      await rolesUsecase.updateRoleUsecase(id, { name: editName });
      toast.success("Nama role berhasil diupdate");
      setRole((prev) => (prev ? { ...prev, name: editName } : null));
    } finally {
      setSavingName(false);
    }
  }

  async function handleSavePermissions() {
    if (!role || !canSavePerms) return;
    setSavingPerms(true);
    try {
      await rolesUsecase.syncRolePermissionsUsecase(id, selectedPermissions);
      toast.success("Permissions berhasil disinkronkan");
      setRole((prev) =>
        prev
          ? {
              ...prev,
              permissions: selectedPermissions.map((name) => ({ id: 0, name })),
            }
          : null
      );
    } finally {
      setSavingPerms(false);
    }
  }

  async function handleDelete() {
    if (!role) return;
    try {
      await rolesUsecase.deleteRoleUsecase(id);
      toast.success("Role berhasil dihapus");
      router.replace("/roles");
    } finally {
      setDeleteOpen(false);
    }
  }

  if (!allowed) return null;
  if (loading) return <div className="p-4">Memuat…</div>;

  if (forbidden) {
    return (
      <div>
        <AppBreadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Roles", href: "/roles" },
            { label: "Edit" },
          ]}
        />
        <PageHeader title="Edit Role" description="Role ini tidak dapat diedit (mis. Superadmin)." />
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">Anda tidak memiliki akses untuk mengedit role ini.</p>
            <Button variant="outline" asChild>
              <Link href="/roles">Kembali</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const disabled = !role;

  return (
    <div>
      <AppBreadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Roles", href: "/roles" },
          { label: "Edit" },
        ]}
      />
      <PageHeader title="Edit Role" description="Ubah nama dan permission role." />

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
            <Label>Nama Role</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleSaveName}
                disabled={disabled}
                className="min-w-[200px] max-w-xs"
              />
              {canSaveName && !disabled && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSaveName}
                  disabled={savingName || editName === role?.name}
                >
                  {savingName ? "…" : "Simpan Nama"}
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Permission Matrix</Label>
              {canSavePerms && !disabled && (
                <Button
                  size="sm"
                  onClick={handleSavePermissions}
                  disabled={savingPerms}
                >
                  {savingPerms ? "Menyimpan…" : "Simpan Permissions"}
                </Button>
              )}
            </div>
            <PermissionMatrix
              masterPermissions={permissions}
              selectedPermissions={selectedPermissions}
              onChange={setSelectedPermissions}
              disabled={disabled}
            />
          </div>

          {canDelete && !disabled && (
            <div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="mr-2 size-4" />
                Hapus Role
              </Button>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" asChild>
              <Link href="/roles">Kembali</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Hapus Role"
        description={`Anda yakin ingin menghapus role "${role?.name}"?`}
        confirmLabel="Hapus"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
