"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { DataTablePagination } from "@/shared/presentation/components/table/DataTablePagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { authStore } from "@/modules/auth/infrastructure/auth.store";
import { PermissionMatrix } from "@/modules/identity/presentation/components/roles/PermissionMatrix";
import { ConfirmDialog } from "@/modules/identity/presentation/components/shared/ConfirmDialog";
import * as rolesUsecase from "@/modules/identity/application/usecases/roles.usecase";
import * as permissionsUsecase from "@/modules/identity/application/usecases/permissions.usecase";
import { ForbiddenError, NotFoundError } from "@/shared/infrastructure/api/errors";
import type { Role, Permission } from "@/modules/identity/domain/entities";
import { Plus, Save, Trash2, AlertCircle, Shield, Key } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { StatsCard } from "@/shared/presentation/components/StatsCard";

export default function RolesPage() {
  const { allowed } = usePermissionGuard("roles.view");
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [roles, setRoles] = useState<Role[]>([]);
  const [meta, setMeta] = useState({
    current_page: 1,
    per_page: 15,
    total: 0,
    last_page: 1,
    from: null as number | null,
    to: null as number | null,
  });
  const [loading, setLoading] = useState(true);
  const [masterPermissions, setMasterPermissions] = useState<Permission[]>([]);
  const [permissionsCount, setPermissionsCount] = useState(0);

  // Selection & Edit State
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [editName, setEditName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);

  const canCreate = authStore.hasPermission("roles.create");
  const canUpdate = authStore.hasPermission("roles.update");
  const canManagePerms = authStore.hasPermission("roles.manage");
  const canDelete = authStore.hasPermission("roles.delete");

  const { setItems } = useBreadcrumbStore();

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Roles" },
    ]);
  }, [setItems]);

  async function loadData() {
    if (!allowed) return;
    setLoading(true);
    try {
      const [r, perms] = await Promise.all([
        rolesUsecase.getRolesUsecase({
          page,
          per_page: 15,
          sort_by: "name",
          sort_dir: "asc",
        }),
        permissionsUsecase.getPermissionsUsecase(),
      ]);
      setRoles(r.items);
      setMeta(r.meta);
      setMasterPermissions(perms);
      setPermissionsCount(perms.length);
    } catch (e) {
      if (e instanceof ForbiddenError) {
        toast.error(e.message || "Tidak punya akses");
        router.replace("/dashboard");
        return;
      }
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!allowed) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed, page]);

  // Load detailed role when selected
  async function handleSelectRole(role: Role) {
    if (selectedRole?.id === role.id) return;
    setLoading(true);
    setIsReadOnly(false);
    try {
      const detailed = await rolesUsecase.getRoleUsecase(role.id);
      setSelectedRole(detailed);
      setEditName(detailed.name);
      setSelectedPermissions((detailed.permissions ?? []).map((p) => p.name));
    } catch (e) {
      if (e instanceof ForbiddenError) {
        // Protected role (Superadmin etc)
        const detailed = await rolesUsecase.getRoleUsecase(role.id).catch(() => role);
        setSelectedRole(detailed);
        setEditName(detailed.name);
        setSelectedPermissions((detailed.permissions ?? []).map((p) => p.name));
        setIsReadOnly(true);
      } else if (e instanceof NotFoundError) {
        toast.error("Role tidak ditemukan");
        loadData();
      } else {
        toast.error("Gagal memuat detail role");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!selectedRole || isReadOnly) return;
    setIsSaving(true);
    try {
      // 1. Update Name if changed
      if (editName !== selectedRole.name && canUpdate) {
        await rolesUsecase.updateRoleUsecase(selectedRole.id, { name: editName });
      }
      // 2. Sync Permissions if managed
      if (canManagePerms) {
        await rolesUsecase.syncRolePermissionsUsecase(selectedRole.id, selectedPermissions);
      }
      
      toast.success("Perubahan berhasil disimpan");
      loadData(); // Refresh list
      // Refresh current detail
      const updated = await rolesUsecase.getRoleUsecase(selectedRole.id);
      setSelectedRole(updated);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan perubahan");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedRole || isReadOnly) return;
    setIsDeleting(true);
    try {
      await rolesUsecase.deleteRoleUsecase(selectedRole.id);
      toast.success("Role berhasil dihapus");
      setSelectedRole(null);
      loadData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menghapus role");
    } finally {
      setIsDeleting(false);
      setDeleteOpen(false);
    }
  }

  if (!allowed) return null;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Roles"
        description="Kelola role dan permission"
        actions={
          canCreate ? (
            <Button asChild>
              <Link href="/roles/new">
                <Plus className="mr-2 size-4" />
                Tambah Role
              </Link>
            </Button>
          ) : undefined
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <StatsCard
          label="Total Roles"
          value={meta.total}
          icon={Shield}
          variant="primary"
        />
        <StatsCard
          label="Module Permissions"
          value={permissionsCount}
          icon={Key}
          variant="info"
        />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Panel: Role List */}
        <div className="lg:col-span-4 xl:col-span-3">
          <Card className="rounded-2xl shadow-sm border-none bg-slate-50/50">
            <CardHeader className="px-4 py-3 border-b bg-white rounded-t-2xl">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">
                  Daftar Role
                </CardTitle>
                <div className="text-[10px] font-medium bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                  {meta.total} Total
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-2 bg-white rounded-b-2xl">
              <div className="space-y-1">
                {loading && roles.length === 0 ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full rounded-lg" />
                  ))
                ) : roles.length === 0 ? (
                  <p className="p-4 text-center text-sm text-muted-foreground">Tidak ada data.</p>
                ) : (
                  roles.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleSelectRole(r)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-all",
                        selectedRole?.id === r.id
                          ? "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Shield className={cn("size-4", selectedRole?.id === r.id ? "text-indigo-500" : "text-slate-400")} />
                        <span className="font-medium">{r.name}</span>
                      </div>
                      <span className="text-[10px] opacity-70">
                        {(r.permissions ?? []).length} perms
                      </span>
                    </button>
                  ))
                )}
              </div>
              <div className="mt-4 px-2">
                <DataTablePagination meta={meta} onPageChange={setPage} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Edit Role */}
        <div className="lg:col-span-8 xl:col-span-9">
          {selectedRole ? (
            <Card className="rounded-2xl shadow-sm border-none">
              <CardHeader className="px-6 py-4 border-b flex flex-row items-center justify-between space-y-0 bg-slate-50/30 rounded-t-2xl">
                <div>
                  <CardTitle className="text-lg font-bold">Detail Role: {selectedRole.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">Ubah nama dan sinkronkan permission matrix.</p>
                </div>
                <div className="flex items-center gap-2">
                  {canDelete && !isReadOnly && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      onClick={() => setDeleteOpen(true)}
                    >
                      <Trash2 className="mr-2 size-4" />
                      Hapus
                    </Button>
                  )}
                  {!isReadOnly && (
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={isSaving || (editName === selectedRole.name && JSON.stringify(selectedPermissions) === JSON.stringify(selectedRole.permissions?.map(p => p.name)))}
                    >
                      <Save className="mr-2 size-4" />
                      {isSaving ? "Menyimpan…" : "Simpan Perubahan"}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {isReadOnly && (
                  <div className="flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 border border-amber-200">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>Role ini bersifat sistem (seperti Superadmin) dan tidak dapat diubah namanya atau permissionnya.</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="role-name">Nama Role</Label>
                  <Input
                    id="role-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    disabled={isReadOnly || !canUpdate || isSaving}
                    placeholder="Contoh: Admin Akademik"
                    className="max-w-md"
                  />
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Permission Matrix</Label>
                    <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
                      Akses Modul & Fitur
                    </span>
                  </div>
                  <PermissionMatrix
                    masterPermissions={masterPermissions}
                    selectedPermissions={selectedPermissions}
                    onChange={setSelectedPermissions}
                    disabled={isReadOnly || !canManagePerms || isSaving}
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex h-full min-h-[400px] items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
              <div className="max-w-xs space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Shield className="size-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Pilih Role</h3>
                <p className="text-xs text-slate-500">
                  Pilih salah satu role di sebelah kiri untuk melihat detail nama dan permission yang tersedia.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Hapus Role"
        description={`Apakah Anda yakin ingin menghapus role "${selectedRole?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus Role"
        variant="destructive"
        onConfirm={handleDelete}
        loading={isDeleting}
      />
    </div>
  );
}
