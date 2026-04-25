"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { MonthYearSelect } from "@/modules/hr/presentation/components/month-year-select";
import { PayrollTable } from "@/modules/hr/presentation/components/payroll-table";
import { payrollService, Payroll } from "@/modules/hr/infrastructure/payroll.service";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { DataTableToolbar } from "@/shared/presentation/components/table/DataTableToolbar";
import { DataTablePagination } from "@/shared/presentation/components/table/DataTablePagination";
import { useDebouncedValue } from "@/shared/presentation/hooks/useDebouncedValue";
import { StatsCard } from "@/shared/presentation/components/StatsCard";
import { Button } from "@/components/ui/button";
import { RefreshCw, Users, CheckSquare, Clock, DollarSign, FileText } from "lucide-react";
import { toast } from "sonner";
import { authStore, useAuthStore } from "@/modules/auth/infrastructure/auth.store";
import { getEmployeesUsecase } from "@/modules/employees/application/usecases/getEmployees.usecase";
import type { Employee } from "@/modules/employees/domain/entities";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const STATUS_OPTIONS = [
  { label: "Draft", value: "draft" },
  { label: "Generated", value: "generated" },
  { label: "Disetujui", value: "approved" },
  { label: "Lunas", value: "paid" },
  { label: "Ditransfer", value: "transferred" },
];

const SORT_OPTIONS = [
  { label: "Nama Karyawan", value: "employee_name" },
  { label: "Gaji Bersih", value: "gaji_bersih" },
  { label: "Status", value: "status" },
] as const;

export default function GajiPage() {
  const { allowed } = usePermissionGuard("gaji.view");
  const canManage = useAuthStore((state) => authStore.hasPermission("gaji.manage"));
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setItems } = useBreadcrumbStore();

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [data, setData] = useState<Payroll[]>([]);
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
    draft: 0,
    approved: 0,
    paid: 0,
    totalKaryawan: 0,
    generatedPayroll: 0,
  });
  const [employeeOptions, setEmployeeOptions] = useState<Employee[]>([]);

  const now = new Date();
  const bulan = parseInt(searchParams.get("bulan") || String(now.getMonth() + 1));
  const tahun = parseInt(searchParams.get("tahun") || String(now.getFullYear()));
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = parseInt(searchParams.get("per_page") || "15");

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const debouncedQ = useDebouncedValue(search, 400);
  const [statusFilter, setStatusFilter] = useState<string | null>(searchParams.get("status"));
  const [karyawanFilter, setKaryawanFilter] = useState<string | null>(searchParams.get("karyawan_id"));
  const [sortKey, setSortKey] = useState<string>("employee_name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Payroll" },
    ]);
  }, [setItems]);

  useEffect(() => {
    if (allowed) {
      getEmployeesUsecase({ per_page: 100, status: "aktif" })
        .then((res) => setEmployeeOptions(res.items))
        .catch(() => {});
    }
  }, [allowed]);

  async function loadStats() {
    try {
      const [draftRes, approvedRes, paidRes, allRes] = await Promise.all([
        payrollService.getPayrolls({ bulan, tahun, status: "draft", per_page: 1 }),
        payrollService.getPayrolls({ bulan, tahun, status: "approved", per_page: 1 }),
        payrollService.getPayrolls({ bulan, tahun, status: "paid", per_page: 1 }),
        payrollService.getPayrolls({ bulan, tahun, per_page: 1 }),
      ]);

      setStats({
        total: allRes.meta.total,
        draft: draftRes.meta.total,
        approved: approvedRes.meta.total,
        paid: paidRes.meta.total,
        totalKaryawan: employeeOptions.length,
        generatedPayroll: allRes.meta.total,
      });
    } catch {
    }
  }

  async function loadData() {
    if (!allowed) return;
    setLoading(true);
    try {
      const result = await payrollService.getPayrolls({
        bulan,
        tahun,
        q: debouncedQ || undefined,
        status: statusFilter || undefined,
        karyawan_id: karyawanFilter || undefined,
        page,
        per_page: perPage,
        sort_by: sortKey,
        sort_dir: sortDir,
      });
      setData(result.data);
      setMeta(result.meta);
      loadStats();
    } catch (error) {
      toast.error("Gagal memuat data payroll");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed, bulan, tahun, debouncedQ, statusFilter, karyawanFilter, page, perPage, sortKey, sortDir]);

  async function handleSync() {
    setGenerating(true);
    try {
      await payrollService.generatePayroll(bulan, tahun);
      toast.success("Sinkronisasi payroll berhasil!");
      loadData();
    } catch (error: any) {
      toast.error(error?.message || "Gagal melakukan sinkronisasi");
    } finally {
      setGenerating(false);
    }
  }

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`?${params.toString()}`);
  }

  function handlePerPageChange(newPerPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("per_page", String(newPerPage));
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  }

  if (!allowed) return null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Payroll"
        description={`Data pengupahan karyawan periode ${bulan}/${tahun}`}
        actions={
          canManage && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={generating || loading}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${generating ? "animate-spin" : ""}`} />
                  {generating ? "Memproses..." : "Sinkronisasi / Generate"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Generate Ulang Payroll?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Apakah Anda yakin ingin men-generate ulang data payroll untuk periode <b>{bulan}/{tahun}</b>? 
                    <br/><br/>
                    Data draft yang belum dibayar akan diperbarui berdasarkan data absensi terbaru. Data yang sudah dibayar tidak akan berubah.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSync} className="bg-indigo-600 hover:bg-indigo-700">
                    Ya, Sinkronkan Data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label="Total Karyawan"
          value={stats.totalKaryawan}
          icon={Users}
          variant="primary"
          description="Karyawan aktif"
        />
        <StatsCard
          label="Payroll Generated"
          value={stats.generatedPayroll}
          icon={FileText}
          variant="info"
          description={`Periode ${bulan}/${tahun}`}
        />
        <StatsCard
          label="Draft / Generated"
          value={stats.draft}
          icon={Clock}
          variant="warning"
          description="Menunggu persetujuan"
        />
        <StatsCard
          label="Sudah Dibayar"
          value={stats.paid}
          icon={DollarSign}
          variant="success"
          description="Lunas / Ditransfer"
        />
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-end">
          <MonthYearSelect defaultMonth={bulan} defaultYear={tahun} className="w-full md:w-auto" />
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="space-y-4 pt-6">
          <DataTableToolbar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Cari nama/kode karyawan..."
            filters={[
              {
                key: "karyawan",
                label: "Karyawan",
                options: [
                  { label: "Semua", value: "__all__" },
                  ...employeeOptions.map((e) => ({
                    label: e.user?.name || e.kode_karyawan,
                    value: String(e.id),
                  })),
                ],
                value: karyawanFilter,
                onChange: (v) => {
                  setKaryawanFilter(v);
                  const params = new URLSearchParams(searchParams.toString());
                  if (v) params.set("karyawan_id", v);
                  else params.delete("karyawan_id");
                  params.set("page", "1");
                  router.push(`?${params.toString()}`);
                },
              },
              {
                key: "status",
                label: "Status",
                options: [{ label: "Semua", value: "__all__" }, ...STATUS_OPTIONS],
                value: statusFilter,
                onChange: (v) => {
                  setStatusFilter(v);
                  const params = new URLSearchParams(searchParams.toString());
                  if (v) params.set("status", v);
                  else params.delete("status");
                  params.set("page", "1");
                  router.push(`?${params.toString()}`);
                },
              },
            ]}
            sort={{
              value: sortKey,
              options: [...SORT_OPTIONS],
              onChange: setSortKey,
              direction: sortDir,
              onToggleDirection: () => setSortDir((d) => (d === "asc" ? "desc" : "asc")),
              defaultValue: "employee_name",
              defaultDirection: "asc",
              onDirectionChange: setSortDir,
            }}
          />

          <div className="flex items-center gap-2">
            <Label className="text-muted-foreground text-sm whitespace-nowrap">
              Per halaman
            </Label>
            <Select
              value={String(perPage)}
              onValueChange={(v) => handlePerPageChange(Number(v))}
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

          <PayrollTable
            data={data}
            meta={meta}
            params={{ q: debouncedQ, bulan, tahun, status: statusFilter }}
            loading={loading}
          />

          <DataTablePagination meta={meta} onPageChange={handlePageChange} />
        </CardContent>
      </Card>
    </div>
  );
}
