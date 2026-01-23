
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
import { Plus, CheckSquare, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { ExportDropdown } from "@/shared/presentation/components/ExportDropdown";
import { exportCutiUsecase } from "@/modules/cuti/application/usecases/exportCuti.usecase";
import {
  listCuti,
  deleteCuti,
  approveCuti,
  rejectCuti,
} from "@/modules/cuti/infrastructure/cuti.repository";
import { CutiTable } from "@/modules/cuti/presentation/components/CutiTable";
import { getEmployeesUsecase } from "@/modules/employees/application/usecases/getEmployees.usecase";
import type { Cuti } from "@/modules/cuti/domain/entities";
import type { Employee } from "@/modules/employees/domain/entities";
import type { DateRange } from "react-day-picker";

const JENIS_OPTIONS = [
  { label: "Cuti", value: "cuti" },
  { label: "Izin", value: "izin" },
  { label: "Sakit", value: "sakit" },
];

const STATUS_OPTIONS = [
  { label: "Diajukan", value: "diajukan" },
  { label: "Disetujui", value: "disetujui" },
  { label: "Ditolak", value: "ditolak" },
  { label: "Dibatalkan", value: "dibatalkan" },
];

const SORT_OPTIONS = [
  { label: "Tanggal", value: "tanggal" },
  { label: "Status", value: "status" },
  { label: "Jenis", value: "jenis" },
] as const;

export default function CutiPage() {
  const { allowed } = usePermissionGuard("cuti.view");
  const router = useRouter();
  const { setItems } = useBreadcrumbStore();

  const [items, setTableItems] = useState<Cuti[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({
    current_page: 1,
    per_page: 15,
    total: 0,
    last_page: 1,
    from: null as number | null,
    to: null as number | null,
  });

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [search, setSearch] = useState("");
  const debouncedQ = useDebouncedValue(search, 400);

  const [karyawanFilter, setKaryawanFilter] = useState<string | null>(null);
  const [jenisFilter, setJenisFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  
  const [sortKey, setSortKey] = useState<string>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [stats, setStats] = useState({ total: 0, diajukan: 0, disetujui: 0, ditolak: 0 });
  const [employeeOptions, setEmployeeOptions] = useState<Employee[]>([]);

  const canCreate = authStore.hasPermission("cuti.create");
  const canUpdate = authStore.hasPermission("cuti.update");
  const canDelete = authStore.hasPermission("cuti.delete");
  const canApprove = authStore.hasPermission("cuti.approve");

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Hr" },
      { label: "Cuti" },
    ]);
  }, [setItems]);

  useEffect(() => {
    if (allowed) {
      getEmployeesUsecase({ per_page: 100, status: "aktif" }).then(res => setEmployeeOptions(res.items)).catch(() => {});
    }
  }, [allowed]);

  useEffect(() => {
    if (!allowed) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed, page, perPage, debouncedQ, karyawanFilter, jenisFilter, statusFilter, dateRange, sortKey, sortDir]);

  async function loadData() {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: perPage,
        q: debouncedQ || undefined,
        karyawan_id: karyawanFilter || undefined,
        jenis: jenisFilter || undefined,
        status: statusFilter || undefined,
        start_date: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
        end_date: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
        sort_by: sortKey,
        sort_dir: sortDir,
      };

      const { items: resItems, meta: resMeta } = await listCuti(params);
      setTableItems(resItems);
      setMeta(resMeta);

      const [totalRes, diajukanRes, disetujuiRes, ditolakRes] = await Promise.all([
        listCuti({ per_page: 1 }),
        listCuti({ per_page: 1, status: "diajukan" }),
        listCuti({ per_page: 1, status: "disetujui" }),
        listCuti({ per_page: 1, status: "ditolak" }),
      ]);
      setStats({
         total: totalRes.meta.total,
         diajukan: diajukanRes.meta.total,
         disetujui: disetujuiRes.meta.total,
         ditolak: ditolakRes.meta.total,
      });

    } catch (e) {
      toast.error("Gagal memuat data cuti");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(item: Cuti) {
    try {
      await deleteCuti(item.id);
      toast.success("Data cuti dihapus");
      loadData();
    } catch (e) {
      toast.error("Gagal menghapus data cuti");
    }
  }

  async function handleApprove(item: Cuti) {
     try {
       await approveCuti(item.id);
       toast.success("Cuti disetujui");
       loadData();
     } catch (e) {
       toast.error("Gagal menyetujui cuti");
     }
  }

  async function handleReject(item: Cuti) {
     try {
       await rejectCuti(item.id);
       toast.success("Cuti ditolak");
       loadData();
     } catch (e) {
       toast.error("Gagal menolak cuti");
     }
  }

  const handleExport = async (exportFormat: string) => {
    const params = {
      q: debouncedQ || undefined,
      karyawan_id: karyawanFilter || undefined,
      jenis: jenisFilter || undefined,
      status: statusFilter || undefined,
      start_date: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
      end_date: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
      sort_by: sortKey,
      sort_dir: sortDir,
    };
    await exportCutiUsecase(exportFormat, params);
  };

  if (!allowed) return null;

  return (
    <div>
      <PageHeader
        title="Pengajuan Cuti"
        description="Daftar pengajuan cuti dan izin karyawan"
        actions={
          <div className="flex gap-2">
            <ExportDropdown onExport={handleExport} />
            {canCreate && (
              <Button asChild>
                <Link href="/cuti/new">
                  <Plus className="mr-2 size-4" /> Ajukan Cuti
                </Link>
              </Button>
            )}
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatsCard
            label="Total"
            value={stats.total}
            icon={CheckSquare}
            variant="primary"
            description="Total Pengajuan"
            />
        <StatsCard
            label="Diajukan"
            value={stats.diajukan}
            icon={Clock}
            variant="warning"
            description="Menunggu persetujuan"
            />
        <StatsCard
            label="Disetujui"
            value={stats.disetujui}
            icon={CheckSquare}
            variant="success"
            description="Disetujui"
            />
        <StatsCard
            label="Ditolak"
            value={stats.ditolak}
            icon={XCircle}
            variant="danger"
            description="Ditolak"
            />
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="space-y-4 pt-6">
          <DataTableToolbar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Cari pengajuan..."
            filters={[
              {
                key: "karyawan",
                label: "Karyawan",
                options: [{ label: "Semua", value: "__all__" }, ...employeeOptions.map(e => ({ label: e.user?.name || e.kode_karyawan, value: String(e.id) }))],
                value: karyawanFilter,
                onChange: (v) => { setKaryawanFilter(v); setPage(1); }
              },
              {
                key: "jenis",
                label: "Jenis",
                options: [{ label: "Semua", value: "__all__" }, ...JENIS_OPTIONS],
                value: jenisFilter,
                onChange: (v) => { setJenisFilter(v); setPage(1); }
              },
              {
                key: "status",
                label: "Status",
                options: [{ label: "Semua", value: "__all__" }, ...STATUS_OPTIONS],
                value: statusFilter,
                onChange: (v) => { setStatusFilter(v); setPage(1); }
              },
            ]}
            sort={{
              value: sortKey,
              options: [...SORT_OPTIONS],
              onChange: (v) => setSortKey(v),
              direction: sortDir,
              onToggleDirection: () => setSortDir(d => d === "asc" ? "desc" : "asc"),
              defaultValue: "created_at",
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

          <CutiTable
            items={items}
            loading={loading}
            onEdit={(item) => router.push(`/cuti/${item.id}/edit`)}
            onView={(item) => router.push(`/cuti/${item.id}`)}
            onDelete={handleDelete}
            onApprove={handleApprove}
            onReject={handleReject}
            canUpdate={canUpdate}
            canDelete={canDelete}
            canApprove={canApprove}
          />

          <DataTablePagination meta={meta} onPageChange={setPage} />
        </CardContent>
      </Card>
    </div>
  );
}
