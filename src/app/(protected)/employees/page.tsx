"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppBreadcrumbs } from "@/shared/presentation/components/AppBreadcrumbs";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { DataTableToolbar } from "@/shared/presentation/components/table/DataTableToolbar";
import { DataTablePagination } from "@/shared/presentation/components/table/DataTablePagination";
import { useDebouncedValue } from "@/shared/presentation/hooks/useDebouncedValue";
import { authStore } from "@/modules/auth/infrastructure/auth.store";
import { getEmployeesUsecase } from "@/modules/employees/application/usecases/getEmployees.usecase";
import { deleteEmployeeUsecase } from "@/modules/employees/application/usecases/deleteEmployee.usecase";
import { EmployeeTable } from "@/modules/employees/presentation/components/EmployeeTable";
import { ConfirmDialog } from "@/modules/identity/presentation/components/shared/ConfirmDialog";
import {
  ForbiddenError,
  NotFoundError,
  AppError,
} from "@/shared/infrastructure/api/errors";
import type { Employee } from "@/modules/employees/domain/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";

const SORT_OPTIONS = [
  { label: "Kode", value: "kode_karyawan" },
  { label: "Status", value: "status" },
  { label: "Kategori", value: "kategori_karyawan" },
  { label: "Tipe Gaji", value: "tipe_gaji" },
  { label: "Gaji Pokok", value: "gaji_pokok" },
  { label: "Dibuat", value: "created_at" },
  { label: "Diubah", value: "updated_at" },
] as const;

type SortKey = (typeof SORT_OPTIONS)[number]["value"];

const KATEGORI_OPTIONS = [
  { label: "Tetap", value: "tetap" },
  { label: "Kontrak", value: "kontrak" },
  { label: "Freelance", value: "freelance" },
];

const TIPE_GAJI_OPTIONS = [
  { label: "Bulanan", value: "bulanan" },
  { label: "Per Sesi", value: "per_sesi" },
];

const PER_PAGE_OPTIONS = [15, 30, 50, 100];

export default function EmployeesPage() {
  const { allowed } = usePermissionGuard("employees.view");
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [search, setSearch] = useState("");
  const debouncedQ = useDebouncedValue(search, 400);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterKategori, setFilterKategori] = useState<string | null>(null);
  const [filterTipeGaji, setFilterTipeGaji] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [meta, setMeta] = useState({
    current_page: 1,
    per_page: 15,
    total: 0,
    last_page: 1,
    from: null as number | null,
    to: null as number | null,
  });
  const [stats, setStats] = useState({
    total: 0,
    tetap: 0,
    kontrak: 0,
    freelance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteEmployee, setDeleteEmployee] = useState<Employee | null>(null);

  const prevDebouncedQ = useRef(debouncedQ);

  const canCreate = authStore.hasPermission("employees.create");
  const canUpdate = authStore.hasPermission("employees.update");
  const canDelete = authStore.hasPermission("employees.delete");

  function buildParams(overridePage?: number) {
    return {
      page: overridePage ?? page,
      per_page: perPage,
      q: debouncedQ || undefined,
      status:
        filterStatus === "aktif" || filterStatus === "nonaktif"
          ? (filterStatus as "aktif" | "nonaktif")
          : undefined,
      kategori_karyawan: filterKategori || undefined,
      tipe_gaji: filterTipeGaji || undefined,
      sort_by: sortKey,
      sort_dir: sortDir,
    };
  }

  function handleError(e: unknown) {
    if (e instanceof ForbiddenError) {
      toast.error(e.message || "Tidak punya akses");
      router.replace("/dashboard");
      return;
    }
    if (
      e instanceof NotFoundError ||
      (e instanceof AppError && e.status != null && e.status >= 500)
    ) {
      toast.error("Gagal memuat data karyawan");
      return;
    }
    toast.error(e instanceof Error ? e.message : "Gagal memuat karyawan");
  }

  async function loadEmployees(params: ReturnType<typeof buildParams>) {
    const { items, meta: m } = await getEmployeesUsecase(params);
    setEmployees(items);
    setMeta(m);
  }

  useEffect(() => {
    if (!allowed) return;
    setLoading(true);
    const searchJustChanged = prevDebouncedQ.current !== debouncedQ;
    if (searchJustChanged) {
      prevDebouncedQ.current = debouncedQ;
      setPage(1);
    }
    const pageToUse = searchJustChanged ? 1 : page;
    const params = buildParams(pageToUse);

    Promise.all([
      loadEmployees(params),
      (async () => {
        const [all, t, k, f] = await Promise.all([
          getEmployeesUsecase({ per_page: 1 }),
          getEmployeesUsecase({ per_page: 1, kategori_karyawan: "tetap" }),
          getEmployeesUsecase({ per_page: 1, kategori_karyawan: "kontrak" }),
          getEmployeesUsecase({ per_page: 1, kategori_karyawan: "freelance" }),
        ]);
        setStats({
          total: all.meta.total,
          tetap: t.meta.total,
          kontrak: k.meta.total,
          freelance: f.meta.total,
        });
      })(),
    ]).catch(handleError).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps -- buildParams, loadEmployees, handleError are stable
  }, [
    allowed,
    page,
    perPage,
    debouncedQ,
    filterStatus,
    filterKategori,
    filterTipeGaji,
    sortKey,
    sortDir,
  ]);

  async function handleDelete() {
    if (!deleteEmployee) return;
    await deleteEmployeeUsecase(deleteEmployee.id);
    toast.success("Karyawan berhasil dihapus");
    setDeleteOpen(false);
    setDeleteEmployee(null);
    loadEmployees(buildParams()).catch(handleError);
  }

  if (!allowed) return null;

  return (
    <div>
      <AppBreadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Karyawan" },
        ]}
      />
      <PageHeader
        title="Karyawan"
        description="Daftar karyawan"
        actions={
          canCreate ? (
            <Button asChild>
              <Link href="/employees/new">
                <Plus className="mr-2 size-4" />
                Tambah Karyawan
              </Link>
            </Button>
          ) : undefined
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="rounded-xl">
          <CardContent className="pt-4">
            <p className="text-muted-foreground text-sm">Total Karyawan</p>
            <p className="text-2xl font-semibold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="pt-4">
            <p className="text-muted-foreground text-sm">Tetap</p>
            <p className="text-2xl font-semibold">{stats.tetap}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="pt-4">
            <p className="text-muted-foreground text-sm">Kontrak</p>
            <p className="text-2xl font-semibold">{stats.kontrak}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="pt-4">
            <p className="text-muted-foreground text-sm">Freelance</p>
            <p className="text-2xl font-semibold">{stats.freelance}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="space-y-4 pt-6">
          <DataTableToolbar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Cari kode atau nama…"
            filters={[
              {
                key: "status",
                label: "Status",
                options: [
                  { label: "Semua", value: "__all__" },
                  { label: "Aktif", value: "aktif" },
                  { label: "Nonaktif", value: "nonaktif" },
                ],
                value: filterStatus,
                onChange: (v) => {
                  setFilterStatus(v);
                  setPage(1);
                },
              },
              {
                key: "kategori_karyawan",
                label: "Kategori",
                options: [{ label: "Semua", value: "__all__" }, ...KATEGORI_OPTIONS],
                value: filterKategori,
                onChange: (v) => {
                  setFilterKategori(v);
                  setPage(1);
                },
              },
              {
                key: "tipe_gaji",
                label: "Tipe Gaji",
                options: [
                  { label: "Semua", value: "__all__" },
                  ...TIPE_GAJI_OPTIONS,
                ],
                value: filterTipeGaji,
                onChange: (v) => {
                  setFilterTipeGaji(v);
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

          <EmployeeTable
            employees={employees}
            loading={loading}
            onEdit={(em) => router.push(`/employees/${em.id}/edit`)}
            onDelete={(em) => {
              setDeleteEmployee(em);
              setDeleteOpen(true);
            }}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />

          <DataTablePagination meta={meta} onPageChange={(p) => setPage(p)} />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Hapus Karyawan"
        description={`Anda yakin ingin menghapus "${deleteEmployee?.kode_karyawan}" (${deleteEmployee?.user?.name ?? "-"})?`}
        confirmLabel="Hapus"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
