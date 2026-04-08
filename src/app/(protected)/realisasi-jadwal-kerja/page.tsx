"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { DataTableToolbar } from "@/shared/presentation/components/table/DataTableToolbar";
import { DataTablePagination } from "@/shared/presentation/components/table/DataTablePagination";
import { useDebouncedValue } from "@/shared/presentation/hooks/useDebouncedValue";
import { authStore } from "@/modules/auth/infrastructure/auth.store";
import { getRealisasiJadwalListUsecase } from "@/modules/realisasi-jadwal-kerja/application/usecases/getRealisasiJadwalList.usecase";
import { deleteRealisasiJadwalUsecase } from "@/modules/realisasi-jadwal-kerja/application/usecases/deleteRealisasiJadwal.usecase";
import { syncRealisasiJadwal } from "@/modules/realisasi-jadwal-kerja/infrastructure/realisasi-jadwal-kerja.repository";
import { getEmployeesUsecase } from "@/modules/employees/application/usecases/getEmployees.usecase";
import { getJadwalKerjaListUsecase } from "@/modules/jadwal-kerja/application/usecases/getJadwalKerjaList.usecase";
import { StatsCard } from "@/shared/presentation/components/StatsCard";
import { RealisasiJadwalTable } from "@/modules/realisasi-jadwal-kerja/presentation/components/RealisasiJadwalTable";
import { RealisasiJadwalBoard } from "@/modules/realisasi-jadwal-kerja/presentation/components/RealisasiJadwalBoard";
import { cn } from "@/lib/utils";
import { ExportDropdown } from "@/shared/presentation/components/ExportDropdown";
import { exportRealisasiJadwalKerjaUsecase } from "@/modules/realisasi-jadwal-kerja/application/usecases/exportRealisasiJadwalKerja.usecase";
import { updateRealisasiJadwalUsecase } from "@/modules/realisasi-jadwal-kerja/application/usecases/updateRealisasiJadwal.usecase";
import {
  ForbiddenError,
} from "@/shared/infrastructure/api/errors";
import type { RealisasiJadwal } from "@/modules/realisasi-jadwal-kerja/domain/entities";
import type { Employee } from "@/modules/employees/domain/entities";
import type { JadwalKerja } from "@/modules/jadwal-kerja/domain/entities";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RefreshCw, ClipboardCheck, Clock, CheckCircle2, XCircle, LayoutList, Kanban } from "lucide-react";
import { toast } from "sonner";

const SORT_OPTIONS = [
  { label: "Tanggal", value: "tanggal" },
  { label: "Status", value: "status" },
  { label: "Dibuat", value: "created_at" },
] as const;

type SortKey = (typeof SORT_OPTIONS)[number]["value"];

const PER_PAGE_OPTIONS = [15, 30, 50, 100];

export default function RealisasiJadwalPage() {
  const { allowed } = usePermissionGuard("realisasi_jadwal_kerja.view");
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [search, setSearch] = useState("");
  const debouncedQ = useDebouncedValue(search, 400);
  
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterTanggal, setFilterTanggal] = useState<string | null>(null);
  const [filterJadwal, setFilterJadwal] = useState<string | null>(null);
  const [filterGuru, setFilterGuru] = useState<string | null>(null);
  
  const [sortKey, setSortKey] = useState<SortKey>("tanggal");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  
  const [items, setItems] = useState<RealisasiJadwal[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [jadwalList, setJadwalList] = useState<JadwalKerja[]>([]);
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
    diajukan: 0,
    disetujui: 0,
    ditolak: 0,
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "board">("table");
  const [boardGroupBy, setBoardGroupBy] = useState<"tanggal" | "status">("tanggal");
  
  const [deleteItem, setDeleteItem] = useState<RealisasiJadwal | null>(null);

  const prevDebouncedQ = useRef(debouncedQ);
  const { setItems: setBreadcrumbs } = useBreadcrumbStore();

  useEffect(() => {
    setBreadcrumbs([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Realisasi Jadwal Kerja" },
    ]);
  }, [setBreadcrumbs]);

  const canCreate = authStore.hasPermission("realisasi_jadwal_kerja.create");
  const canUpdate = authStore.hasPermission("realisasi_jadwal_kerja.update");
  const canDelete = authStore.hasPermission("realisasi_jadwal_kerja.delete");

  useEffect(() => {
    if (!allowed) return;
    Promise.all([
      getEmployeesUsecase({ per_page: 100 }),
      getJadwalKerjaListUsecase({ per_page: 100 }),
    ]).then(([empRes, jadwalRes]) => {
      setEmployees(empRes.items);
      setJadwalList(jadwalRes.items);
    }).catch(console.error);
  }, [allowed]);

  function buildParams(overridePage?: number) {
    const effectivePerPage = viewMode === 'board' ? 1000 : perPage;
    return {
      page: overridePage ?? page,
      per_page: effectivePerPage,
      q: debouncedQ || undefined,
      status: filterStatus as any || undefined,
      tanggal: filterTanggal || undefined,
      jadwal_kerja_id: filterJadwal || undefined,
      guru_pengajar_id: filterGuru || undefined,
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
    toast.error(e instanceof Error ? e.message : "Gagal memuat data");
  }

  async function loadData(params: ReturnType<typeof buildParams>) {
    const { items: fetchedItems, meta: m } = await getRealisasiJadwalListUsecase(params);
    setItems(fetchedItems);
    setMeta(m);
  }

  const refreshStats = async () => {
    const [all, a, s, d] = await Promise.all([
      getRealisasiJadwalListUsecase({ per_page: 1 }),
      getRealisasiJadwalListUsecase({ per_page: 1, status: "diajukan" }),
      getRealisasiJadwalListUsecase({ per_page: 1, status: "disetujui" }),
      getRealisasiJadwalListUsecase({ per_page: 1, status: "ditolak" }),
    ]);
    setStats({
      total: all.meta.total,
      diajukan: a.meta.total,
      disetujui: s.meta.total,
      ditolak: d.meta.total,
    });
  };

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
      loadData(params),
      refreshStats(),
    ]).catch(handleError).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    allowed,
    page,
    perPage,
    debouncedQ,
    filterStatus,
    filterTanggal,
    filterJadwal,
    filterGuru,
    sortKey,
    sortDir,
  ]);

  async function handleStatusChange(item: RealisasiJadwal, newStatus: string) {
    setUpdatingId(item.id);
    try {
      await updateRealisasiJadwalUsecase(item.id, { status: newStatus as any });
      toast.success(`Status berhasil diubah ke ${newStatus}`);
      await Promise.all([
        loadData(buildParams()),
        refreshStats()
      ]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mengubah status");
    } finally {
      setUpdatingId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteItem) return;
    try {
      await deleteRealisasiJadwalUsecase(deleteItem.id);
      toast.success("Realisasi berhasil dihapus");
      await Promise.all([
        loadData(buildParams()),
        refreshStats()
      ]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menghapus realisasi");
    } finally {
      setDeleteItem(null);
    }
  }

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await syncRealisasiJadwal();
      toast.success(`Berhasil sinkronisasi ${res.created_count} jadwal untuk hari ${res.day}`);
      await Promise.all([
        loadData(buildParams()),
        refreshStats()
      ]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal sinkronisasi jadwal");
    } finally {
      setSyncing(false);
    }
  }

  const handleExport = async (format: string) => {
    const params = buildParams();
    await exportRealisasiJadwalKerjaUsecase(format, params);
  };

  if (!allowed) return null;

  return (
    <div>
      <PageHeader
        title="Realisasi Jadwal Kerja"
        description="Pencatatan realisasi jadwal kerja guru"
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl mr-2 border border-slate-200 shadow-inner">
                <Button 
                    variant={viewMode === 'table' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    onClick={() => setViewMode('table')}
                    className={cn(
                        "text-xs px-4 h-8 transition-all duration-200 rounded-lg", 
                        viewMode === 'table' ? "bg-white shadow-sm border border-slate-200 text-slate-900" : "text-slate-500 hover:text-slate-700"
                    )}
                >
                    <LayoutList className="size-3.5 mr-2" />
                    Tabel
                </Button>
                <Button 
                    variant={viewMode === 'board' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    onClick={() => setViewMode('board')}
                    className={cn(
                        "text-xs px-4 h-8 transition-all duration-200 rounded-lg", 
                        viewMode === 'board' ? "bg-white shadow-sm border border-slate-200 text-slate-900" : "text-slate-500 hover:text-slate-700"
                    )}
                >
                    <Kanban className="size-3.5 mr-2" />
                    Board
                </Button>
            </div>

            {viewMode === 'board' && (
                <div className="flex items-center gap-1 bg-indigo-100/50 p-1 rounded-xl mr-2 border border-indigo-200/60 shadow-inner">
                    <Button 
                        variant={boardGroupBy === 'tanggal' ? 'secondary' : 'ghost'} 
                        size="sm" 
                        onClick={() => setBoardGroupBy('tanggal')}
                        className={cn(
                            "text-[10px] uppercase tracking-wider font-bold px-3 h-7 transition-all duration-200 rounded-lg", 
                            boardGroupBy === 'tanggal' ? "bg-white shadow-sm text-indigo-700" : "text-indigo-400 hover:text-indigo-600"
                        )}
                    >
                        Tanggal
                    </Button>
                    <Button 
                        variant={boardGroupBy === 'status' ? 'secondary' : 'ghost'} 
                        size="sm" 
                        onClick={() => setBoardGroupBy('status')}
                        className={cn(
                            "text-[10px] uppercase tracking-wider font-bold px-3 h-7 transition-all duration-200 rounded-lg", 
                            boardGroupBy === 'status' ? "bg-white shadow-sm text-indigo-700" : "text-indigo-400 hover:text-indigo-600"
                        )}
                    >
                        Status
                    </Button>
                </div>
            )}

            <ExportDropdown onExport={handleExport} />
            {canCreate && (
              <Button onClick={handleSync} disabled={syncing}>
                <RefreshCw className={`mr-2 size-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Sinkronisasi…' : 'Sinkronisasi Hari Ini'}
              </Button>
            )}
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label="Total Realisasi"
          value={stats.total}
          icon={ClipboardCheck}
          variant="primary"
        />
        <StatsCard
          label="Diajukan"
          value={stats.diajukan}
          icon={Clock}
          variant="warning"
        />
        <StatsCard
          label="Disetujui"
          value={stats.disetujui}
          icon={CheckCircle2}
          variant="success"
        />
        <StatsCard
          label="Ditolak"
          value={stats.ditolak}
          icon={XCircle}
          variant="danger"
        />
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="space-y-4 pt-6">
          <DataTableToolbar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Cari catatan atau sumber…"
            filters={[
              {
                key: "status",
                label: "Status",
                options: [
                  { label: "Semua Status", value: "__all__" },
                  { label: "Diajukan", value: "diajukan" },
                  { label: "Disetujui", value: "disetujui" },
                  { label: "Ditolak", value: "ditolak" },
                ],
                value: filterStatus,
                onChange: setFilterStatus,
              },
              {
                key: "jadwal",
                label: "Jadwal",
                options: [
                  { label: "Semua Jadwal", value: "__all__" },
                  ...jadwalList.map(j => ({ label: j.mata_pelajaran, value: String(j.id) })),
                ],
                value: filterJadwal,
                onChange: setFilterJadwal,
              },
              {
                key: "guru",
                label: "Guru",
                options: [
                  { label: "Semua Guru", value: "__all__" },
                  ...employees.map(e => ({ label: e.user?.name || e.kode_karyawan, value: String(e.id) })),
                ],
                value: filterGuru,
                onChange: setFilterGuru,
              },
            ]}
            sort={{
              value: sortKey,
              options: SORT_OPTIONS.map((o) => ({ label: o.label, value: o.value })),
              onChange: (v) => setSortKey(v as SortKey),
              direction: sortDir,
              onToggleDirection: () => setSortDir((d) => (d === "asc" ? "desc" : "asc")),
              defaultValue: "tanggal",
              defaultDirection: "desc",
              onDirectionChange: setSortDir,
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

          {viewMode === 'table' ? (
            <>
              <RealisasiJadwalTable
                items={items}
                loading={loading}
                onView={(item) => router.push(`/realisasi-jadwal-kerja/${item.id}`)}
                onEdit={(item) => router.push(`/realisasi-jadwal-kerja/${item.id}/edit`)}
                onDelete={(item) => setDeleteItem(item)}
                onStatusChange={handleStatusChange}
                updatingId={updatingId}
                canUpdate={canUpdate}
                canDelete={canDelete}
              />
              <DataTablePagination meta={meta} onPageChange={(p) => setPage(p)} />
            </>
          ) : (
            <RealisasiJadwalBoard
              items={items}
              groupBy={boardGroupBy}
              onSelectEvent={(item) => router.push(`/realisasi-jadwal-kerja/${item.id}`)}
            />
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Realisasi Jadwal?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Realisasi untuk tanggal <strong>{deleteItem?.tanggal}</strong> akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
