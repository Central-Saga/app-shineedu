"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { DataTableToolbar } from "@/shared/presentation/components/table/DataTableToolbar";
import { DataTablePagination } from "@/shared/presentation/components/table/DataTablePagination";
import { useAuthStore } from "@/modules/auth/infrastructure/auth.store";
import { checkPermission } from "@/shared/presentation/hooks/usePermissionGuard";
import { 
    listPaketHarga, 
    deletePaketHarga,
    listProgram,
    listJenjang,
    listPaket,
    exportPaketHarga
} from "@/modules/catalog/infrastructure/catalog.repository";
import { PaketHargaTable } from "@/modules/catalog/presentation/components/PaketHargaTable";
import { ExportDropdown } from "@/shared/presentation/components/ExportDropdown";
import { StatsCard } from "@/shared/presentation/components/StatsCard";
import { ConfirmDeleteDialog } from "@/shared/presentation/components/ConfirmDeleteDialog";
import type { PaketHarga } from "@/modules/catalog/domain/entities";
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
import { Plus, Banknote, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useDebouncedValue } from "@/shared/presentation/hooks/useDebouncedValue";
import type { PaginatedMeta } from "@/shared/domain/types";

const PER_PAGE_OPTIONS = [15, 30, 50, 100];

export default function PaketHargaPage() {
  const { allowed } = usePermissionGuard("catalog.pricing.view");
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PaketHarga[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta>({
    current_page: 1,
    per_page: 15,
    total: 0,
    last_page: 1,
    from: null,
    to: null,
  });

  // Filter state
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const debouncedQ = useDebouncedValue(search, 500);
  
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [perPage, setPerPage] = useState(Number(searchParams.get("per_page")) || 15);
  const [status, setStatus] = useState<string | null>(searchParams.get("status") || null);
  const [programId, setProgramId] = useState<string>(searchParams.get("program_id") || "all");
  const [jenjangId, setJenjangId] = useState<string>(searchParams.get("jenjang_id") || "all");
  const [paketId, setPaketId] = useState<string>(searchParams.get("paket_id") || "all");
  const [sortBy, setSortBy] = useState<string>(searchParams.get("sort_by") || "created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">((searchParams.get("sort_dir") as "asc" | "desc") || "desc");

  // State for delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PaketHarga | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Options state
  const [programOptions, setProgramOptions] = useState<{label: string, value: string}[]>([]);
  const [jenjangOptions, setJenjangOptions] = useState<{label: string, value: string}[]>([]);
  const [paketOptions, setPaketOptions] = useState<{label: string, value: string}[]>([]);

  const { setItems } = useBreadcrumbStore();
  const canCreate = useAuthStore((s) => checkPermission(s, "catalog.pricing.create"));
  const canUpdate = useAuthStore((s) => checkPermission(s, "catalog.pricing.update"));
  const canDelete = useAuthStore((s) => checkPermission(s, "catalog.pricing.delete"));

  const [stats, setStats] = useState({
    total: 0,
    aktif: 0,
    nonAktif: 0,
  });

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Catalog" },
      { label: "Harga Paket" },
    ]);

    // Fetch filters options
    if (allowed) {
        listProgram({ per_page: 999 }).then(res => setProgramOptions(res.items.map(i => ({ label: i.nama, value: String(i.id) }))));
        listJenjang({ per_page: 999 }).then(res => setJenjangOptions(res.items.map(i => ({ label: i.nama, value: String(i.id) }))));
        listPaket({ per_page: 999 }).then(res => setPaketOptions(res.items.map(i => ({ label: i.nama, value: String(i.id) }))));
    }
  }, [setItems, allowed]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [listRes, allRes, aktifRes, nonAktifRes] = await Promise.all([
        listPaketHarga({
          page,
          per_page: perPage,
          q: debouncedQ,
          status: status === "all" ? undefined : (status as "Aktif" | "Non Aktif" | undefined),
          program_id: programId !== "all" ? Number(programId) : undefined,
          jenjang_id: jenjangId !== "all" ? Number(jenjangId) : undefined,
          paket_id: paketId !== "all" ? Number(paketId) : undefined,
          sort_by: sortBy,
          sort_dir: sortDir,
        }),
        listPaketHarga({ per_page: 1 }),
        listPaketHarga({ per_page: 1, status: "Aktif" }),
        listPaketHarga({ per_page: 1, status: "Non Aktif" }),
      ]);

      setData(listRes.items);
      setMeta(listRes.meta);
      setStats({
        total: allRes.meta.total,
        aktif: aktifRes.meta.total,
        nonAktif: nonAktifRes.meta.total,
      });
    } catch (error: any) {
      toast.error(error.message || "Gagal memuat data harga");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (allowed) {
        fetchData();
        const params = new URLSearchParams();
        if (page > 1) params.set("page", String(page));
        if (perPage !== 15) params.set("per_page", String(perPage));
        if (debouncedQ) params.set("q", debouncedQ);
        if (status && status !== "all") params.set("status", status);
        if (programId && programId !== "all") params.set("program_id", programId);
        if (jenjangId && jenjangId !== "all") params.set("jenjang_id", jenjangId);
        if (paketId && paketId !== "all") params.set("paket_id", paketId);
        params.set("sort_by", sortBy);
        params.set("sort_dir", sortDir);
        router.replace(`/dashboard/catalog/harga?${params.toString()}`);
    }
  }, [allowed, page, perPage, debouncedQ, status, programId, jenjangId, paketId, sortBy, sortDir]);

  const handleDelete = (item: PaketHarga) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await deletePaketHarga(itemToDelete.id);
      toast.success("Harga berhasil dihapus");
      setDeleteDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus harga");
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  const handleExport = async (format: string) => {
    try {
      await exportPaketHarga(format, {
        q: debouncedQ,
        status: status === "all" ? undefined : (status as any),
        program_id: programId !== "all" ? Number(programId) : undefined,
        jenjang_id: jenjangId !== "all" ? Number(jenjangId) : undefined,
        paket_id: paketId !== "all" ? Number(paketId) : undefined,
        sort_by: sortBy,
        sort_dir: sortDir,
      });
    } catch (error: any) {
      toast.error(error.message || "Gagal melakukan export");
    }
  };

  if (!allowed) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daftar Harga Paket"
        description="Kelola harga paket berdasarkan program dan jenjang"
        actions={
          <div className="flex items-center gap-2">
            <ExportDropdown onExport={handleExport} />
            {canCreate && (
              <Button asChild>
                <Link href="/dashboard/catalog/harga/create">
                  <Plus className="mr-2 size-4" />
                  Tambah Harga
                </Link>
              </Button>
            )}
          </div>
        }
      />

       <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          label="Total Rule Harga"
          value={stats.total}
          icon={Banknote}
          variant="primary"
          description="Semua aturan harga"
        />
        <StatsCard
          label="Harga Aktif"
          value={stats.aktif}
          icon={CheckCircle}
          variant="success"
          description="Aturan harga aktif"
        />
        <StatsCard
          label="Harga Non Aktif"
          value={stats.nonAktif}
          icon={XCircle}
          variant="danger"
          description="Aturan harga tidak aktif"
        />
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <DataTableToolbar
            searchValue={search}
            onSearchChange={(val) => {
                setSearch(val);
                setPage(1);
            }}
            searchPlaceholder="Cari..."
            filters={[
              {
                key: "program_id",
                label: "Program",
                value: programId,
                options: [{ label: "Semua", value: "all" }, ...programOptions],
                onChange: (val) => {
                  setProgramId(val || "all");
                  setPage(1);
                },
              },
              {
                key: "jenjang_id",
                label: "Jenjang",
                value: jenjangId,
                options: [{ label: "Semua", value: "all" }, ...jenjangOptions],
                onChange: (val) => {
                  setJenjangId(val || "all");
                  setPage(1);
                },
              },
              {
                key: "paket_id",
                label: "Paket",
                value: paketId,
                options: [{ label: "Semua", value: "all" }, ...paketOptions],
                onChange: (val) => {
                  setPaketId(val || "all");
                  setPage(1);
                },
              },
              {
                key: "status",
                label: "Status",
                value: status,
                options: [
                  { label: "Semua", value: "all" },
                  { label: "Aktif", value: "Aktif" },
                  { label: "Non Aktif", value: "Non Aktif" },
                ],
                onChange: (val) => {
                  setStatus(val);
                  setPage(1);
                },
              },
            ]}
            sort={{
              value: sortBy,
              options: [
                { label: "Harga", value: "harga" },
                { label: "Status", value: "status" },
                { label: "Dibuat", value: "created_at" },
                { label: "Diubah", value: "updated_at" },
              ],
              onChange: (v) => setSortBy(v),
              direction: sortDir,
              onToggleDirection: () => setSortDir(prev => prev === "asc" ? "desc" : "asc"),
              defaultValue: "created_at",
              defaultDirection: "desc",
              onDirectionChange: (d) => setSortDir(d),
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

          <PaketHargaTable
            data={data}
            loading={loading}
            canEdit={!!canUpdate}
            canDelete={!!canDelete}
            onEdit={(item) => router.push(`/dashboard/catalog/harga/${item.id}/edit`)}
            onDelete={handleDelete}
          />

          <DataTablePagination
            meta={meta}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="Hapus Aturan Harga?"
        description="Apakah Anda yakin ingin menghapus aturan harga ini? Tindakan ini dapat memengaruhi perhitungan biaya pada pendaftaran siswa baru."
      />
    </div>
  );
}
