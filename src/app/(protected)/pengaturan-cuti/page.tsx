
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Settings, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  listPengaturanCuti,
  deletePengaturanCuti,
} from "@/modules/pengaturan-cuti/infrastructure/pengaturan-cuti.repository";
import { PengaturanCutiTable } from "@/modules/pengaturan-cuti/presentation/components/PengaturanCutiTable";
import type { PengaturanCuti } from "@/modules/pengaturan-cuti/domain/entities";

const CATEGORY_OPTIONS = [
  { label: "Tetap", value: "tetap" },
  { label: "Kontrak", value: "kontrak" },
  { label: "Freelance", value: "freelance" },
];

const TYPE_OPTIONS = [
  { label: "Cuti", value: "cuti" },
  { label: "Izin", value: "izin" },
  { label: "Sakit", value: "sakit" },
];

const PERIODE_OPTIONS = [
  { label: "Tahunan", value: "tahunan" },
  { label: "Bulanan", value: "bulanan" },
];

export default function PengaturanCutiPage() {
  const { allowed } = usePermissionGuard("pengaturan_cuti.view");
  const router = useRouter();
  const { setItems } = useBreadcrumbStore();

  const [items, setTableItems] = useState<PengaturanCuti[]>([]);
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

  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [periodeFilter, setPeriodeFilter] = useState<string | null>(null);

  const [stats, setStats] = useState({ total: 0, aktif: 0, nonaktif: 0 });

  const canCreate = authStore.hasPermission("pengaturan_cuti.create");
  const canUpdate = authStore.hasPermission("pengaturan_cuti.update");
  const canDelete = authStore.hasPermission("pengaturan_cuti.delete");

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Hr" },
      { label: "Pengaturan Cuti" },
    ]);
  }, [setItems]);

  useEffect(() => {
    if (!allowed) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed, page, perPage, debouncedQ, categoryFilter, typeFilter, periodeFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: perPage,
        q: debouncedQ || undefined,
        kategori_karyawan: categoryFilter || undefined,
        jenis: typeFilter || undefined,
        periode: periodeFilter || undefined,
      };

      const { items: resItems, meta: resMeta } = await listPengaturanCuti(params);
      setTableItems(resItems);
      setMeta(resMeta);

       const [totalRes, aktifRes, nonaktifRes] = await Promise.all([
        listPengaturanCuti({ per_page: 1 }),
        listPengaturanCuti({ per_page: 1, aktif: true }),
        listPengaturanCuti({ per_page: 1, aktif: false }),
      ]);
      setStats({
         total: totalRes.meta.total,
         aktif: aktifRes.meta.total,
         nonaktif: nonaktifRes.meta.total,
      });

    } catch (e) {
      toast.error("Gagal memuat aturan cuti");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(item: PengaturanCuti) {
    try {
      await deletePengaturanCuti(item.id);
      toast.success("Aturan berhasil dihapus");
      loadData();
    } catch (e) {
      toast.error("Gagal menghapus aturan");
    }
  }

  if (!allowed) return null;

  return (
    <div>
      <PageHeader
        title="Pengaturan Cuti"
        description="Kelola aturan kuota, minimal hari pengajuan, dan potongan"
        actions={
          canCreate && (
            <Button asChild>
              <Link href="/pengaturan-cuti/new">
                <Plus className="mr-2 size-4" /> Tambah Aturan
              </Link>
            </Button>
          )
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
         <StatsCard
            label="Total Aturan"
            value={stats.total}
            icon={Settings}
            variant="primary"
            description="Rule terdaftar"
            />
        <StatsCard
            label="Aktif"
            value={stats.aktif}
            icon={CheckCircle}
            variant="success"
            description="Rule diterapkan"
            />
        <StatsCard
            label="Nonaktif"
            value={stats.nonaktif}
            icon={XCircle}
            variant="info"
            description="Rule tidak aktif"
            />
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="space-y-4 pt-6">
          <DataTableToolbar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Cari aturan..."
            filters={[
              {
                key: "kategori",
                label: "Kategori",
                options: [{ label: "Semua", value: "__all__" }, ...CATEGORY_OPTIONS],
                value: categoryFilter,
                onChange: (v) => { setCategoryFilter(v); setPage(1); }
              },
              {
                key: "jenis",
                label: "Jenis",
                options: [{ label: "Semua", value: "__all__" }, ...TYPE_OPTIONS],
                value: typeFilter,
                onChange: (v) => { setTypeFilter(v); setPage(1); }
              },
              {
                key: "periode",
                label: "Periode",
                options: [{ label: "Semua", value: "__all__" }, ...PERIODE_OPTIONS],
                value: periodeFilter,
                onChange: (v) => { setPeriodeFilter(v); setPage(1); }
              },
            ]}
            sort={{
              value: "created_at",
              options: [{ label: "Tanggal", value: "created_at" }],
              onChange: () => {},
              direction: "desc",
              onToggleDirection: () => {},
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
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

          <PengaturanCutiTable
            items={items}
            loading={loading}
            onEdit={(item) => router.push(`/pengaturan-cuti/${item.id}/edit`)}
            onDelete={handleDelete}
            onView={(item) => router.push(`/pengaturan-cuti/${item.id}`)}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />

          <DataTablePagination meta={meta} onPageChange={setPage} />
        </CardContent>
      </Card>
    </div>
  );
}
