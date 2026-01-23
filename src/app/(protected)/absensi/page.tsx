
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { DataTableToolbar } from "@/shared/presentation/components/table/DataTableToolbar";
import { DataTablePagination } from "@/shared/presentation/components/table/DataTablePagination";
import { useDebouncedValue } from "@/shared/presentation/hooks/useDebouncedValue";
import { authStore } from "@/modules/auth/infrastructure/auth.store";
import { StatsCard } from "@/shared/presentation/components/StatsCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, BarChart2, CheckCircle, Clock, Camera } from "lucide-react";
import { toast } from "sonner";
import {
  listAbsensi,
  deleteAbsensi,
} from "@/modules/absensi/infrastructure/absensi.repository";
import { AbsensiTable } from "@/modules/absensi/presentation/components/AbsensiTable";
import { getEmployeesUsecase } from "@/modules/employees/application/usecases/getEmployees.usecase";
import type { Absensi } from "@/modules/absensi/domain/entities";
import type { Employee } from "@/modules/employees/domain/entities";
import type { DateRange } from "react-day-picker";

const STATUS_OPTIONS = [
  { label: "Hadir", value: "hadir" },
  { label: "Izin", value: "izin" },
  { label: "Cuti", value: "cuti" },
  { label: "Sakit", value: "sakit" },
  { label: "Alpha", value: "alpha" },
];

const SUMBER_OPTIONS = [
  { label: "Mesin", value: "mesin" },
  { label: "Web", value: "web" },
  { label: "Mobile", value: "mobile" },
  { label: "Manual", value: "manual" },
];

// Reusing Employee Table Sort Options style or similar
const SORT_OPTIONS = [
  { label: "Tanggal", value: "tanggal" },
  { label: "Status", value: "status_kehadiran" },
  { label: "Jam Masuk", value: "jam_masuk" },
  { label: "Durasi", value: "durasi_menit" },
] as const;

export default function AbsensiPage() {
  const { allowed } = usePermissionGuard("absensi.view");
  const router = useRouter();
  const { setItems } = useBreadcrumbStore();

  const [items, setTableItems] = useState<Absensi[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({
    current_page: 1,
    per_page: 15,
    total: 0,
    last_page: 1,
    from: null as number | null,
    to: null as number | null,
  });

  // State
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [search, setSearch] = useState("");
  const debouncedQ = useDebouncedValue(search, 400);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [karyawanFilter, setKaryawanFilter] = useState<string | null>(null);
  const [sumberFilter, setSumberFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Sort
  const [sortKey, setSortKey] = useState<string>("tanggal");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Stats
  const [stats, setStats] = useState({ total: 0, hadir: 0, izin: 0 });

  // Employee Options
  const [employeeOptions, setEmployeeOptions] = useState<Employee[]>([]);

  const canCreate = authStore.hasPermission("absensi.create");
  const canManage = authStore.hasPermission("absensi.manage");
  const canUpdate = authStore.hasPermission("absensi.update");
  const canDelete = authStore.hasPermission("absensi.delete");

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Hr" },
      { label: "Absensi" },
    ]);
  }, [setItems]);

  useEffect(() => {
    if (allowed) {
      loadEmployees();
    }
   
  }, [allowed]);

  async function loadEmployees() {
    try {
      const { items } = await getEmployeesUsecase({ per_page: 100, status: "aktif" });
      setEmployeeOptions(items);
    } catch {
      // silent fail
    }
  }

  useEffect(() => {
    if (!allowed) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed, page, perPage, debouncedQ, statusFilter, karyawanFilter, sumberFilter, dateRange, sortKey, sortDir]);

  async function loadData() {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: perPage,
        q: debouncedQ || undefined,
        status_kehadiran: statusFilter || undefined,
        karyawan_id: karyawanFilter || undefined,
        sumber_absen: sumberFilter || undefined,
        start_date: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
        end_date: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
        sort_by: sortKey,
        sort_dir: sortDir,
      };

      const { items: resItems, meta: resMeta } = await listAbsensi(params);
      setTableItems(resItems);
      setMeta(resMeta);

      // Simple stats aggregation (in real app, use dedicated stats endpoint)
      // For now, we rely on filtering just counts if endpoint supports it, otherwise mock or simple count from current view (which is inaccurate)
      // I will assume for "Premium" stats we want total data not just current page.
      // Since specific stats endpoint is not defined in plan, I'll just use meta.total for "Total Data"
      // and maybe do separate requests for status counts if critical.
      // To mimic "Premium", I'll fetch stats separately.
      
      const [totalRes, hadirRes, izinRes] = await Promise.all([
        listAbsensi({ per_page: 1 }),
        listAbsensi({ per_page: 1, status_kehadiran: "hadir" }),
        listAbsensi({ per_page: 1, status_kehadiran: "izin" })
      ]);
      setStats({
        total: totalRes.meta.total,
        hadir: hadirRes.meta.total,
        izin: izinRes.meta.total,
      });

    } catch {
      toast.error("Gagal memuat data absensi");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(item: Absensi) {
    try {
      await deleteAbsensi(item.id);
      toast.success("Absensi berhasil dihapus");
      loadData();
    } catch (error: unknown) {
      const e = error as any;
      if (e?.response?.status === 403) {
        toast.error("Anda tidak memiliki akses menghapus data ini");
      } else {
        toast.error("Gagal menghapus absensi");
      }
    }
  }

  if (!allowed) return null;

  return (
    <div>
      <PageHeader
        title="Absensi"
        description="Data kehadiran karyawan"
        actions={
          <div className="flex gap-2">
            {canCreate && (
              <Button asChild variant="secondary">
                <Link href="/absensi/scan">
                  <Camera className="mr-2 size-4" /> Scan
                </Link>
              </Button>
            )}
            {canManage && (
              <Button asChild>
                <Link href="/absensi/new">
                  <Plus className="mr-2 size-4" /> Tambah Absensi
                </Link>
              </Button>
            )}
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard
          label="Total Absensi"
          value={stats.total}
          icon={BarChart2}
          variant="primary"
          description="Semua catatan"
        />
        <StatsCard
          label="Hadir"
          value={stats.hadir}
          icon={CheckCircle}
          variant="success"
          description="Kehadiran tercatat"
        />
        <StatsCard
          label="Izin / Sakit"
          value={stats.izin}
          icon={Clock}
          variant="warning"
          description="Ketidakhadiran"
        />
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="space-y-4 pt-6">
          <DataTableToolbar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Cari catatan..."
            filters={[
              {
                key: "karyawan",
                label: "Karyawan",
                options: [
                  { label: "Semua", value: "__all__" },
                  ...employeeOptions.map(e => ({ label: e.user?.name || e.kode_karyawan, value: String(e.id) })),
                ],
                value: karyawanFilter,
                onChange: (v) => {
                  setKaryawanFilter(v);
                  setPage(1);
                },
              },
              {
                key: "status",
                label: "Status",
                options: [{ label: "Semua", value: "__all__" }, ...STATUS_OPTIONS],
                value: statusFilter,
                onChange: (v) => {
                  setStatusFilter(v);
                  setPage(1);
                },
              },
              {
                key: "sumber",
                label: "Sumber",
                options: [{ label: "Semua", value: "__all__" }, ...SUMBER_OPTIONS],
                value: sumberFilter,
                onChange: (v) => {
                  setSumberFilter(v);
                  setPage(1);
                },
              },
            ]}
            sort={{
              value: sortKey,
              options: [...SORT_OPTIONS],
              onChange: (v) => setSortKey(v),
              direction: sortDir,
              onToggleDirection: () => setSortDir(d => d === "asc" ? "desc" : "asc"),
              defaultValue: "tanggal",
              defaultDirection: "desc",
              onDirectionChange: setSortDir,
            }}
            rightSlot={
              <div className="ml-2">
                <DatePickerWithRange date={dateRange} setDate={setDateRange} />
              </div>
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
                <SelectItem value="15">15</SelectItem>
                <SelectItem value="30">30</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <AbsensiTable
            items={items}
            loading={loading}
            onEdit={(item) => router.push(`/absensi/${item.id}/edit`)}
            onDelete={handleDelete}
            onView={(item) => router.push(`/absensi/${item.id}`)}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />

          <DataTablePagination meta={meta} onPageChange={setPage} />
        </CardContent>
      </Card>
    </div>
  );
}
