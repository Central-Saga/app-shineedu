"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/modules/identity/presentation/components/shared/PageHeader";
import { UserTable } from "@/modules/identity/presentation/components/users/UserTable";
import { UserFormDialog } from "@/modules/identity/presentation/components/users/UserFormDialog";
import { UserRoleDialog } from "@/modules/identity/presentation/components/users/UserRoleDialog";
import { ConfirmDialog } from "@/modules/identity/presentation/components/shared/ConfirmDialog";
import { DataTableToolbar } from "@/shared/presentation/components/table/DataTableToolbar";
import { DataTablePagination } from "@/shared/presentation/components/table/DataTablePagination";
import { useDebouncedValue } from "@/shared/presentation/hooks/useDebouncedValue";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { authStore } from "@/modules/auth/infrastructure/auth.store";
import * as usersUsecase from "@/modules/identity/application/usecases/users.usecase";
import * as rolesUsecase from "@/modules/identity/application/usecases/roles.usecase";
import { ForbiddenError } from "@/shared/infrastructure/api/errors";
import type { IdentityUser } from "@/modules/identity/domain/entities";
import type { Role } from "@/modules/identity/domain/entities";
import { Plus } from "lucide-react";
import { toast } from "sonner";

const SORT_OPTIONS = [
  { label: "Nama", value: "name" },
  { label: "Email", value: "email" },
  { label: "Status", value: "status" },
  { label: "Dibuat", value: "created_at" },
  { label: "Diubah", value: "updated_at" },
] as const;

type SortKey = (typeof SORT_OPTIONS)[number]["value"];

const ROLE_FALLBACK = ["Admin", "Teacher", "Student", "Superadmin"];
const PER_PAGE_OPTIONS = [15, 30, 50];

export default function UsersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
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

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const prevDebouncedQ = useRef(debouncedSearch);

  const canUpdate = authStore.hasAnyPermission(["users.update"]);
  const canDelete = authStore.hasAnyPermission(["users.delete"]);
  const canCreate = authStore.hasAnyPermission(["users.create"]);

  function buildUserParams(overridePage?: number) {
    return {
      page: overridePage ?? page,
      per_page: perPage,
      q: debouncedSearch || undefined,
      status:
        filterStatus === "Aktif" || filterStatus === "Non Aktif"
          ? (filterStatus as "Aktif" | "Non Aktif")
          : undefined,
      role: filterRole || undefined,
      sort_by: sortKey,
      sort_dir: sortDir,
    };
  }

  async function loadUsers(params: ReturnType<typeof buildUserParams>) {
    const { users: u, meta: m } = await usersUsecase.getUsersUsecase(params);
    setUsers(u);
    setMeta(m);
  }

  async function loadRoles() {
    const { roles: r } = await rolesUsecase.getRolesUsecase({
      page: 1,
      per_page: 100,
    });
    setRoles(r);
  }

  function handleLoadError(e: unknown) {
    if (e instanceof ForbiddenError) {
      router.push("/dashboard");
      return;
    }
    toast.error("Gagal memuat user");
  }

  useEffect(() => {
    setLoading(true);
    const searchJustChanged = prevDebouncedQ.current !== debouncedSearch;
    if (searchJustChanged) {
      prevDebouncedQ.current = debouncedSearch;
      setPage(1);
    }
    const pageToUse = searchJustChanged ? 1 : page;
    const params = buildUserParams(pageToUse);

    Promise.all([loadUsers(params), loadRoles()])
      .catch(handleLoadError)
      .finally(() => setLoading(false));
  }, [page, perPage, debouncedSearch, filterStatus, filterRole, sortKey, sortDir]);

  const roleOptions = useMemo(() => {
    const names = roles.map((r) => r.name);
    if (names.length === 0)
      return ROLE_FALLBACK.map((n) => ({ label: n, value: n }));
    return [...new Set(names)].map((n) => ({ label: n, value: n }));
  }, [roles]);

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
    loadUsers(buildUserParams()).catch(handleLoadError);
  }

  async function handleUpdate(
    id: number,
    p: { name: string; email: string; status: string; password?: string }
  ) {
    await usersUsecase.updateUserUsecase(id, p);
    toast.success("User berhasil diupdate");
    setFormOpen(false);
    loadUsers(buildUserParams()).catch(handleLoadError);
  }

  async function handleChangeRole(userId: number, roleName: string) {
    await usersUsecase.updateUserRoleUsecase(userId, roleName);
    toast.success("Role berhasil diupdate");
    setRoleDialogOpen(false);
    setRoleUser(null);
    loadUsers(buildUserParams()).catch(handleLoadError);
  }

  async function handleDelete() {
    if (!deleteUser) return;
    await usersUsecase.deleteUserUsecase(deleteUser.id);
    toast.success("User berhasil dihapus");
    setDeleteOpen(false);
    setDeleteUser(null);
    loadUsers(buildUserParams()).catch(handleLoadError);
  }

  function handlePageChange(p: number) {
    setPage(p);
  }

  if (loading && users.length === 0) {
    return <div className="p-4">Memuat…</div>;
  }

  return (
    <div>
      <PageHeader title="Users" description="Kelola user dan role" />

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="space-y-4 pt-6">
          <DataTableToolbar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Cari nama atau email…"
            filters={[
              {
                key: "status",
                label: "Status",
                options: [
                  { label: "Semua", value: "__all__" },
                  { label: "Aktif", value: "Aktif" },
                  { label: "Non Aktif", value: "Non Aktif" },
                ],
                value: filterStatus,
                onChange: (v) => {
                  setFilterStatus(v);
                  setPage(1);
                },
              },
              {
                key: "role",
                label: "Role",
                options: [{ label: "Semua", value: "__all__" }, ...roleOptions],
                value: filterRole,
                onChange: (v) => {
                  setFilterRole(v);
                  setPage(1);
                },
              },
            ]}
            sort={{
              value: sortKey,
              options: SORT_OPTIONS.map((o) => ({ label: o.label, value: o.value })),
              onChange: (v) => {
                setSortKey(v as SortKey);
                setPage(1);
              },
              direction: sortDir,
              onToggleDirection: () => {
                setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                setPage(1);
              },
              defaultValue: "created_at",
              defaultDirection: "desc",
              onDirectionChange: (d) => {
                setSortDir(d);
                setPage(1);
              },
            }}
            rightSlot={
              canCreate ? (
                <Button onClick={openCreate}>
                  <Plus className="mr-2 size-4" />
                  Tambah User
                </Button>
              ) : undefined
            }
          />

          <div className="flex items-center gap-2">
            <Label className="text-muted-foreground text-sm whitespace-nowrap">
              Per halaman
            </Label>
            <Select
              value={String(perPage)}
              onValueChange={(v) => {
                setPerPage(Number(v));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PER_PAGE_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <UserTable
            users={users}
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

          <DataTablePagination meta={meta} onPageChange={handlePageChange} />
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
