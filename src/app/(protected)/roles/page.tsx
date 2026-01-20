"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { RoleList } from "@/modules/identity/presentation/components/roles/RoleList";
import { RoleFormDialog } from "@/modules/identity/presentation/components/roles/RoleFormDialog";
import { PermissionMatrix } from "@/modules/identity/presentation/components/roles/PermissionMatrix";
import { ConfirmDialog } from "@/modules/identity/presentation/components/shared/ConfirmDialog";
import { useDebouncedValue } from "@/shared/presentation/hooks/useDebouncedValue";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authStore } from "@/modules/auth/infrastructure/auth.store";
import * as rolesUsecase from "@/modules/identity/application/usecases/roles.usecase";
import * as permissionsUsecase from "@/modules/identity/application/usecases/permissions.usecase";
import { ForbiddenError } from "@/shared/infrastructure/api/errors";
import type { Role, Permission } from "@/modules/identity/domain/entities";
import { Plus, Trash2, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";

const canManage = () =>
  authStore.hasAnyPermission(["roles.manage", "roles.update"]);

export default function RolesPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [editName, setEditName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [savingPerms, setSavingPerms] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [roleSearch, setRoleSearch] = useState("");
  const debouncedRoleSearch = useDebouncedValue(roleSearch, 350);
  const [roleSort, setRoleSort] = useState<"asc" | "desc">("asc");

  const selected = roles.find((r) => r.id === selectedId);

  async function load() {
    if (!authStore.hasPermission("roles.view")) return;
    setLoading(true);
    try {
      const [r, p] = await Promise.all([
        rolesUsecase.getRolesUsecase({
          page: 1,
          per_page: 100,
          q: debouncedRoleSearch || undefined,
          sort_by: "name",
          sort_dir: roleSort,
        }),
        permissionsUsecase.getPermissionsUsecase(),
      ]);
      setRoles(r.items);
      setPermissions(p);
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
    if (!authStore.hasPermission("roles.view")) {
      toast.error("Tidak punya akses");
      router.replace("/dashboard");
      return;
    }
    load();
  }, [debouncedRoleSearch, roleSort, router]);

  useEffect(() => {
    if (selected) {
      setEditName(selected.name);
      setSelectedPermissions(
        (selected.permissions ?? []).map((x) => x.name)
      );
    } else {
      setEditName("");
      setSelectedPermissions([]);
    }
  }, [selected?.id, selected?.name, selected?.permissions]);

  async function handleCreate(p: { name: string; permissions?: string[] }) {
    await rolesUsecase.createRoleUsecase(p);
    toast.success("Role berhasil dibuat");
    load();
    setCreateOpen(false);
  }

  async function handleSaveName() {
    if (!selected || !canManage() || editName === selected.name) return;
    setSavingName(true);
    try {
      await rolesUsecase.updateRoleUsecase(selected.id, { name: editName });
      toast.success("Nama role berhasil diupdate");
      load();
    } catch {
      // toast by httpClient
    } finally {
      setSavingName(false);
    }
  }

  async function handleSavePermissions() {
    if (!selected || !canManage()) return;
    setSavingPerms(true);
    try {
      await rolesUsecase.syncRolePermissionsUsecase(selected.id, selectedPermissions);
      toast.success("Permissions berhasil disinkronkan");
      load();
    } catch {
      // toast by httpClient
    } finally {
      setSavingPerms(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    try {
      await rolesUsecase.deleteRoleUsecase(selected.id);
      toast.success("Role berhasil dihapus");
      setDeleteOpen(false);
      setSelectedId(null);
      load();
    } catch {
      // toast by httpClient
    }
  }

  if (loading) {
    return <div className="p-4">Memuat…</div>;
  }

  return (
    <div>
      <PageHeader
        title="Roles"
        description="Kelola role dan permission"
        actions={
          canManage() ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 size-4" />
              Tambah Role
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-4 lg:flex-row">
        <Card className="w-full shrink-0 rounded-2xl shadow-sm lg:w-56">
          <CardContent className="p-4 space-y-3">
            <h2 className="text-sm font-medium">Daftar Role</h2>
            <Input
              placeholder="Cari role…"
              value={roleSearch}
              onChange={(e) => setRoleSearch(e.target.value)}
              className="h-9"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full justify-between gap-2"
              onClick={() => setRoleSort((d) => (d === "asc" ? "desc" : "asc"))}
            >
              <span>{roleSort === "asc" ? "A–Z" : "Z–A"}</span>
              <ArrowUpDown className="size-4 shrink-0" />
            </Button>
            <RoleList
              roles={roles}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </CardContent>
        </Card>

        <Card className="min-w-0 flex-1 rounded-2xl shadow-sm">
          <CardContent className="p-4 space-y-4">
          {selected ? (
            <>
              <div className="space-y-2">
                <Label>Nama Role</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={handleSaveName}
                    disabled={!canManage()}
                    className="min-w-[200px] flex-1"
                  />
                  {canManage() && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleSaveName}
                      disabled={savingName || editName === selected.name}
                    >
                      {savingName ? "…" : "Simpan"}
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>Permission Matrix</Label>
                  {canManage() && (
                    <Button
                      size="sm"
                      onClick={handleSavePermissions}
                      disabled={savingPerms}
                    >
                      {savingPerms ? "Menyimpan…" : "Save Permissions"}
                    </Button>
                  )}
                </div>
                <PermissionMatrix
                  masterPermissions={permissions}
                  selectedPermissions={selectedPermissions}
                  onChange={setSelectedPermissions}
                  disabled={!canManage()}
                />
              </div>

              {canManage() && (
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
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              Pilih role di samping untuk mengedit.
            </p>
          )}
          </CardContent>
        </Card>
      </div>

      <RoleFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        permissions={permissions}
        onSubmit={handleCreate}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Hapus Role"
        description={`Anda yakin ingin menghapus role "${selected?.name}"?`}
        confirmLabel="Hapus"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
