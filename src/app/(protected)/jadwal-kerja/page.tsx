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
import { getJadwalKerjaListUsecase } from "@/modules/jadwal-kerja/application/usecases/getJadwalKerjaList.usecase";
import { updateJadwalKerjaUsecase } from "@/modules/jadwal-kerja/application/usecases/updateJadwalKerja.usecase";
import { deleteJadwalKerjaUsecase } from "@/modules/jadwal-kerja/application/usecases/deleteJadwalKerja.usecase";
import { getEmployeesUsecase } from "@/modules/employees/application/usecases/getEmployees.usecase";
import { StatsCard } from "@/shared/presentation/components/StatsCard";
import { JadwalKerjaTable } from "@/modules/jadwal-kerja/presentation/components/JadwalKerjaTable";
import { JadwalKerjaBoard } from "@/modules/jadwal-kerja/presentation/components/JadwalKerjaBoard";
import { ExportDropdown } from "@/shared/presentation/components/ExportDropdown";
import { cn } from "@/lib/utils";
import { ConfirmDeleteDialog } from "@/shared/presentation/components/ConfirmDeleteDialog";
import { exportJadwalKerjaUsecase } from "@/modules/jadwal-kerja/application/usecases/exportJadwalKerja.usecase";
import {
  ForbiddenError,
} from "@/shared/infrastructure/api/errors";
import type { JadwalKerja } from "@/modules/jadwal-kerja/domain/entities";
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
import { Plus, CheckCircle2, XCircle, Code, BookOpen, Upload, LayoutList, Kanban } from "lucide-react";
import { toast } from "sonner";

const SORT_OPTIONS = [
  { label: "Kategori", value: "kategori" },
  { label: "Mata Pelajaran", value: "mata_pelajaran" },
  { label: "Hari", value: "hari" },
  { label: "Dibuat", value: "created_at" },
  { label: "Diubah", value: "updated_at" },
] as const;

type SortKey = (typeof SORT_OPTIONS)[number]["value"];

const HARI_OPTIONS = [
  { label: "Senin", value: "Senin" },
  { label: "Selasa", value: "Selasa" },
  { label: "Rabu", value: "Rabu" },
  { label: "Kamis", value: "Kamis" },
  { label: "Jumat", value: "Jumat" },
  { label: "Sabtu", value: "Sabtu" },
  { label: "Minggu", value: "Minggu" },
];

const PER_PAGE_OPTIONS = [15, 30, 50, 100];

export default function JadwalKerjaPage() {
  const { allowed } = usePermissionGuard("jadwal_kerja.view");
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [search, setSearch] = useState("");
  const debouncedQ = useDebouncedValue(search, 400);
  
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterKategori, setFilterKategori] = useState<string | null>(null);
  const [filterHari, setFilterHari] = useState<string | null>(null);
  const [filterGuru, setFilterGuru] = useState<string | null>(null);
  
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  
  const [items, setItems] = useState<JadwalKerja[]>([]);
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
    aktif: 0,
    nonaktif: 0,
    coding: 0,
    non_coding: 0,
  });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "board">("table");
  const [boardGroupBy, setBoardGroupBy] = useState<"hari" | "ruangan">("hari");
  
  const [deleteItem, setDeleteItem] = useState<JadwalKerja | null>(null);

  const prevDebouncedQ = useRef(debouncedQ);
  const { setItems: setBreadcrumbs } = useBreadcrumbStore();

  useEffect(() => {
    setBreadcrumbs([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Jadwal Kerja" },
    ]);
  }, [setBreadcrumbs]);

  const canCreate = authStore.hasPermission("jadwal_kerja.create");
  const canUpdate = authStore.hasPermission("jadwal_kerja.update");
  const canDelete = authStore.hasPermission("jadwal_kerja.delete");

  useEffect(() => {
    if (!allowed) return;
    getEmployeesUsecase({ per_page: 100 })
      .then(res => setEmployees(res.items))
      .catch(console.error);
  }, [allowed]);

  function buildParams(overridePage?: number) {
    // If in board mode, fetch all items on one page essentially, or just rely on regular pagination?
    // User probably wants to see *all* items for the week in board view.
    // So we might force per_page high if viewMode is board.
    const effectivePerPage = viewMode === 'board' ? 100 : perPage;
    
    return {
      page: overridePage ?? page,
      per_page: effectivePerPage,
      q: debouncedQ || undefined,
      status: filterStatus as any || undefined,
      kategori: filterKategori as any || undefined,
      hari: filterHari || undefined,
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
    const { items: fetchedItems, meta: m } = await getJadwalKerjaListUsecase(params);
    setItems(fetchedItems);
    setMeta(m);
  }

  useEffect(() => {
    if (!allowed) return;
    setLoading(true);
    
    // Reset page if view mode changes to board to see all items
    if (viewMode === 'board' && page !== 1) {
        setPage(1);
    }
    
    const searchJustChanged = prevDebouncedQ.current !== debouncedQ;
    if (searchJustChanged) {
      prevDebouncedQ.current = debouncedQ;
      setPage(1);
    }
    const pageToUse = searchJustChanged ? 1 : page;
    const params = buildParams(pageToUse);

    Promise.all([
      loadData(params),
      (async () => {
        const [all, a, n, c, nc] = await Promise.all([
          getJadwalKerjaListUsecase({ per_page: 1 }),
          getJadwalKerjaListUsecase({ per_page: 1, status: "Aktif" }),
          getJadwalKerjaListUsecase({ per_page: 1, status: "Non Aktif" }),
          getJadwalKerjaListUsecase({ per_page: 1, kategori: "coding" }),
          getJadwalKerjaListUsecase({ per_page: 1, kategori: "non_coding" }),
        ]);
        setStats({
          total: all.meta.total,
          aktif: a.meta.total,
          nonaktif: n.meta.total,
          coding: c.meta.total,
          non_coding: nc.meta.total,
        });
      })(),
    ]).catch(handleError).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    allowed,
    page,
    perPage,
    debouncedQ,
    filterStatus,
    filterKategori,
    filterHari,
    filterGuru,
    sortKey,
    sortDir,
    viewMode, // reload when view mode changes
  ]);

  function handleStatusChange(item: JadwalKerja, newStatus: "Aktif" | "Non Aktif") {
    const prev = item.status;
    setItems((prevI) =>
      prevI.map((i) => (i.id === item.id ? { ...i, status: newStatus } : i))
    );
    updateJadwalKerjaUsecase(item.id, { status: newStatus })
      .then(() => toast.success("Status berhasil diubah"))
      .catch((e) => {
        setItems((prevI) =>
          prevI.map((i) => (i.id === item.id ? { ...i, status: prev } : i))
        );
        toast.error(e instanceof Error ? e.message : "Gagal mengubah status");
      });
  }

  async function confirmDelete() {
    if (!deleteItem) return;
    try {
      await deleteJadwalKerjaUsecase(deleteItem.id);
      toast.success("Jadwal berhasil dihapus");
      loadData(buildParams());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menghapus jadwal");
    } finally {
      setDeleteItem(null);
    }
  }

  const handleExport = async (format: string) => {
    const params = buildParams();
    await exportJadwalKerjaUsecase(format, params);
  };

  if (!allowed) return null;

  return (
    <div>
      <PageHeader
        title="Jadwal Kerja"
        description="Pengelolaan jadwal kerja guru"
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
                        variant={boardGroupBy === 'hari' ? 'secondary' : 'ghost'} 
                        size="sm" 
                        onClick={() => setBoardGroupBy('hari')}
                        className={cn(
                            "text-[10px] uppercase tracking-wider font-bold px-3 h-7 transition-all duration-200 rounded-lg", 
                            boardGroupBy === 'hari' ? "bg-white shadow-sm text-indigo-700" : "text-indigo-400 hover:text-indigo-600"
                        )}
                    >
                        Hari
                    </Button>
                    <Button 
                        variant={boardGroupBy === 'ruangan' ? 'secondary' : 'ghost'} 
                        size="sm" 
                        onClick={() => setBoardGroupBy('ruangan')}
                        className={cn(
                            "text-[10px] uppercase tracking-wider font-bold px-3 h-7 transition-all duration-200 rounded-lg", 
                            boardGroupBy === 'ruangan' ? "bg-white shadow-sm text-indigo-700" : "text-indigo-400 hover:text-indigo-600"
                        )}
                    >
                        Ruangan
                    </Button>
                </div>
            )}

            <ExportDropdown onExport={handleExport} />
            {canCreate && (
              <Button variant="outline" asChild className="rounded-xl">
                <Link href="/jadwal-kerja/bulk-import">
                  <Upload className="mr-2 size-4 text-emerald-600" />
                  Bulk Import
                </Link>
              </Button>
            )}
            {canCreate && (
              <Button asChild className="rounded-xl shadow-md">
                <Link href="/jadwal-kerja/new">
                  <Plus className="mr-2 size-4" />
                  Tambah Jadwal
                </Link>
              </Button>
            )}
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatsCard
          label="Total Jadwal"
          value={stats.total}
          icon={LayoutList}
          variant="primary"
        />
        <StatsCard
          label="Aktif"
          value={stats.aktif}
          icon={CheckCircle2}
          variant="success"
        />
        <StatsCard
          label="Non Aktif"
          value={stats.nonaktif}
          icon={XCircle}
          variant="danger"
        />
        <StatsCard
          label="Coding"
          value={stats.coding}
          icon={Code}
          variant="info"
        />
        <StatsCard
          label="Non Coding"
          value={stats.non_coding}
          icon={BookOpen}
          variant="warning"
        />
      </div>

      <Card className="rounded-2xl bg-transparent border-none shadow-none">
        <CardContent className="space-y-4 pt-0 px-0">
           <DataTableToolbar
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Cari mata pelajaran…"
              filters={[
                {
                  key: "status",
                  label: "Status",
                  options: [
                    { label: "Semua Status", value: "__all__" },
                    { label: "Aktif", value: "Aktif" },
                    { label: "Non Aktif", value: "Non Aktif" },
                  ],
                  value: filterStatus,
                  onChange: setFilterStatus,
                },
                {
                  key: "kategori",
                  label: "Kategori",
                  options: [
                    { label: "Semua Kategori", value: "__all__" },
                    { label: "Coding", value: "coding" },
                    { label: "Non Coding", value: "non_coding" },
                  ],
                  value: filterKategori,
                  onChange: setFilterKategori,
                },
                {
                  key: "hari",
                  label: "Hari",
                  options: [
                    { label: "Semua Hari", value: "__all__" },
                    ...HARI_OPTIONS,
                  ],
                  value: filterHari,
                  onChange: setFilterHari,
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
              sort={viewMode === 'table' ? {
                value: sortKey,
                options: SORT_OPTIONS.map((o) => ({ label: o.label, value: o.value })),
                onChange: (v) => setSortKey(v as SortKey),
                direction: sortDir,
                onToggleDirection: () => setSortDir((d) => (d === "asc" ? "desc" : "asc")),
                defaultValue: "created_at",
                defaultDirection: "desc",
                onDirectionChange: setSortDir,
              } : undefined}
            />
          

          {viewMode === 'table' ? (
              <div className="bg-white rounded-xl border shadow-sm p-4">
                <div className="flex items-center gap-2 mb-4">
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

                <JadwalKerjaTable
                    items={items}
                    loading={loading}
                    onView={(item) => router.push(`/jadwal-kerja/${item.id}`)}
                    onEdit={(item) => router.push(`/jadwal-kerja/${item.id}/edit`)}
                    onDelete={(item) => setDeleteItem(item)}
                    onStatusChange={handleStatusChange}
                    canUpdate={canUpdate}
                    canDelete={canDelete}
                />

                <DataTablePagination meta={meta} onPageChange={(p) => setPage(p)} />
              </div>
          ) : (
             <JadwalKerjaBoard
                items={items} 
                groupBy={boardGroupBy}
                onSelectEvent={(item) => router.push(`/jadwal-kerja/${item.id}`)}
             />
          )}

        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        isOpen={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
        onConfirm={confirmDelete}
        title="Hapus Jadwal Kerja?"
        description={`Tindakan ini tidak dapat dibatalkan. Jadwal "${deleteItem?.mata_pelajaran}" akan dihapus permanen.`}
      />
    </div>
  );
}
