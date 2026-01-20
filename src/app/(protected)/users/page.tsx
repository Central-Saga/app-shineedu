"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { UserTable } from "@/modules/identity/presentation/components/users/UserTable";

import { DataTableToolbar } from "@/shared/presentation/components/table/DataTableToolbar";
import { DataTablePagination } from "@/shared/presentation/components/table/DataTablePagination";
import { useDebouncedValue } from "@/shared/presentation/hooks/useDebouncedValue";
import { StatsCard } from "@/shared/presentation/components/StatsCard";
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
import { Plus, Users, UserCheck, UserMinus } from "lucide-react";
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
const PER_PAGE_OPTIONS = [15, 30, 50, 100];

export default function UsersPage() {
  const { allowed } = usePermissionGuard("users.view");
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
  const [stats, setStats] = useState({ total: 0, aktif: 0, nonAktif: 0 });
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const prevDebouncedQ = useRef(debouncedSearch);

  const canUpdate = authStore.hasAnyPermission(["users.update"]);
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
    const { items } = await rolesUsecase.getRolesUsecase({
      page: 1,
      per_page: 100,
    });
    setRoles(items);
  }

  function handleLoadError(e: unknown) {
    if (e instanceof ForbiddenError) {
      toast.error(e.message || "Tidak punya akses");
      router.replace("/dashboard");
      return;
    }
    toast.error("Gagal memuat user");
  }

  const { setItems } = useBreadcrumbStore();

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Users" },
    ]);
  }, [setItems]);

  useEffect(() => {
    if (!allowed) return;
    // Loading state for fetch-in-effect pattern
    setLoading(true);
    const searchJustChanged = prevDebouncedQ.current !== debouncedSearch;
    if (searchJustChanged) {
      prevDebouncedQ.current = debouncedSearch;
      setPage(1);
    }
    const pageToUse = searchJustChanged ? 1 : page;
    const params = buildUserParams(pageToUse);

    Promise.all([
      loadUsers(params),
      loadRoles(),
      (async () => {
        const [a, b, c] = await Promise.all([
          usersUsecase.getUsersUsecase({ per_page: 1 }),
          usersUsecase.getUsersUsecase({ per_page: 1, status: "Aktif" }),
          usersUsecase.getUsersUsecase({ per_page: 1, status: "Non Aktif" }),
        ]);
        setStats({
          total: a.meta.total,
          aktif: b.meta.total,
          nonAktif: c.meta.total,
        });
      })(),
    ]).catch(handleLoadError).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- buildUserParams, loadUsers, handleLoadError are stable
  }, [allowed, page, perPage, debouncedSearch, filterStatus, filterRole, sortKey, sortDir]);

  const roleOptions = useMemo(() => {
    const names = roles.map((r) => r.name);
    if (names.length === 0)
      return ROLE_FALLBACK.map((n) => ({ label: n, value: n }));
    return [...new Set(names)].map((n) => ({ label: n, value: n }));
  }, [roles]);



  function handleStatusChange(user: IdentityUser, newStatus: "Aktif" | "Non Aktif") {
    const prev = user.status;
    setUsers((prevU) =>
      prevU.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
    );
    usersUsecase
      .updateUserUsecase(user.id, { status: newStatus })
      .then(() => toast.success("Status berhasil diubah"))
      .catch((e) => {
        setUsers((prevU) =>
          prevU.map((u) => (u.id === user.id ? { ...u, status: prev } : u))
        );
        toast.error(e instanceof Error ? e.message : "Gagal mengubah status");
      });
  }

  if (!allowed) return null;

  return (
    <div>
      <PageHeader
        title="Users"
        description="Kelola user dan role"
        actions={
          canCreate ? (
            <Button asChild>
              <Link href="/users/new">
                <Plus className="mr-2 size-4" />
                Tambah User
              </Link>
            </Button>
          ) : undefined
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          label="Total Users"
          value={stats.total}
          icon={Users}
          variant="primary"
          description="Total pengguna terdaftar"
        />
        <StatsCard
          label="Aktif"
          value={stats.aktif}
          icon={UserCheck}
          variant="success"
          description="Pengguna dengan status aktif"
        />
        <StatsCard
          label="Non Aktif"
          value={stats.nonAktif}
          icon={UserMinus}
          variant="danger"
          description="Pengguna yang dinonaktifkan"
        />
      </div>

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
            loading={loading}
            onEdit={(u) => router.push(`/users/${u.id}/edit`)}
            onStatusChange={handleStatusChange}
            canUpdate={canUpdate}
          />

          <DataTablePagination meta={meta} onPageChange={(p) => setPage(p)} />
        </CardContent>
      </Card>


    </div>
  );
}
