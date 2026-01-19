"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/modules/identity/presentation/components/shared/PageHeader";
import { UserTable } from "@/modules/identity/presentation/components/users/UserTable";
import { UserFormDialog } from "@/modules/identity/presentation/components/users/UserFormDialog";
import { UserRoleDialog } from "@/modules/identity/presentation/components/users/UserRoleDialog";
import { ConfirmDialog } from "@/modules/identity/presentation/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { authStore } from "@/modules/auth/infrastructure/auth.store";
import * as usersUsecase from "@/modules/identity/application/usecases/users.usecase";
import * as rolesUsecase from "@/modules/identity/application/usecases/roles.usecase";
import type { IdentityUser } from "@/modules/identity/domain/entities";
import type { Role } from "@/modules/identity/domain/entities";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<IdentityUser[]>([]);
  const [meta, setMeta] = useState({
    current_page: 1,
    per_page: 15,
    total: 0,
    last_page: 1,
    from: null as number | null,
    to: null as number | null,
  });
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [formUser, setFormUser] = useState<IdentityUser | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [roleUser, setRoleUser] = useState<IdentityUser | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState<IdentityUser | null>(null);

  const canUpdate = authStore.hasAnyPermission(["users.update"]);
  const canDelete = authStore.hasAnyPermission(["users.delete"]);
  const canCreate = authStore.hasAnyPermission(["users.create"]);

  async function loadUsers(p: number) {
    try {
      const { users: u, meta: m } = await usersUsecase.getUsersUsecase(p);
      setUsers(u);
      setMeta(m);
    } catch {
      toast.error("Gagal memuat user");
    }
  }

  async function loadRoles() {
    try {
      const r = await rolesUsecase.getRolesUsecase();
      setRoles(r);
    } catch {
      toast.error("Gagal memuat roles");
    }
  }

  useEffect(() => {
    setLoading(true);
    Promise.all([loadUsers(page), loadRoles()]).finally(() => setLoading(false));
  }, [page]);

  function openCreate() {
    setFormUser(null);
    setFormOpen(true);
  }

  function openEdit(u: IdentityUser) {
    setFormUser(u);
    setFormOpen(true);
  }

  async function handleCreate(p: {
    name: string;
    email: string;
    password: string;
    status: string;
    role: string;
  }) {
    await usersUsecase.createUserUsecase(p);
    toast.success("User berhasil dibuat");
    setFormOpen(false);
    loadUsers(page);
  }

  async function handleUpdate(
    id: number,
    p: { name: string; email: string; status: string; password?: string }
  ) {
    await usersUsecase.updateUserUsecase(id, p);
    toast.success("User berhasil diupdate");
    setFormOpen(false);
    loadUsers(page);
  }

  async function handleChangeRole(userId: number, roleName: string) {
    await usersUsecase.updateUserRoleUsecase(userId, roleName);
    toast.success("Role berhasil diupdate");
    setRoleDialogOpen(false);
    setRoleUser(null);
    loadUsers(page);
  }

  async function handleDelete() {
    if (!deleteUser) return;
    await usersUsecase.deleteUserUsecase(deleteUser.id);
    toast.success("User berhasil dihapus");
    setDeleteOpen(false);
    setDeleteUser(null);
    loadUsers(page);
  }

  if (loading && users.length === 0) {
    return <div className="p-4">Memuat…</div>;
  }

  return (
    <div>
      <PageHeader
        title="Users"
        description="Kelola user dan role"
        actions={
          canCreate ? (
            <Button onClick={openCreate}>
              <Plus className="mr-2 size-4" />
              Tambah User
            </Button>
          ) : undefined
        }
      />

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="pt-6">
          <UserTable
            users={users}
            meta={meta}
            onPageChange={setPage}
            onEdit={openEdit}
            onChangeRole={(u) => {
              setRoleUser(u);
              setRoleDialogOpen(true);
            }}
            onDelete={(u) => {
              setDeleteUser(u);
              setDeleteOpen(true);
            }}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />
        </CardContent>
      </Card>

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        roles={roles}
        user={formUser}
        onSubmitCreate={handleCreate}
        onSubmitUpdate={handleUpdate}
      />

      <UserRoleDialog
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        user={roleUser}
        roles={roles}
        onSubmit={handleChangeRole}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Hapus User"
        description={`Anda yakin ingin menghapus "${deleteUser?.name}"? Data akan dihapus secara soft delete.`}
        confirmLabel="Hapus"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
