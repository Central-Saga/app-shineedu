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
import { listPaket, deletePaket, exportPaket } from "@/modules/catalog/infrastructure/catalog.repository";
import { PaketTable } from "@/modules/catalog/presentation/components/PaketTable";
import { ExportDropdown } from "@/shared/presentation/components/ExportDropdown";
import { StatsCard } from "@/shared/presentation/components/StatsCard";
import { ConfirmDeleteDialog } from "@/shared/presentation/components/ConfirmDeleteDialog";
import type { Paket } from "@/modules/catalog/domain/entities";
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
import { Plus, Package, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useDebouncedValue } from "@/shared/presentation/hooks/useDebouncedValue";
import type { PaginatedMeta } from "@/shared/domain/types";

const PER_PAGE_OPTIONS = [15, 30, 50, 100];

export default function PaketPage() {
  const { allowed } = usePermissionGuard("catalog.paket.view");
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Paket[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta>({
    current_page: 1,
    per_page: 15,
    total: 0,
    last_page: 1,
    from: null,
    to: null,
  });

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const debouncedQ = useDebouncedValue(search, 500);
  
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [perPage, setPerPage] = useState(Number(searchParams.get("per_page")) || 15);
  const [status, setStatus] = useState<string | null>(searchParams.get("status") || null);
  const [sortBy, setSortBy] = useState<string>(searchParams.get("sort_by") || "created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">((searchParams.get("sort_dir") as "asc" | "desc") || "desc");

  // State for delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Paket | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { setItems } = useBreadcrumbStore();
  const canCreate = useAuthStore((s) => s.permissionsSet.has("catalog.paket.create"));
  const canUpdate = useAuthStore((s) => s.permissionsSet.has("catalog.paket.update"));
  const canDelete = useAuthStore((s) => s.permissionsSet.has("catalog.paket.delete"));

  const [stats, setStats] = useState({
    total: 0,
    aktif: 0,
    nonAktif: 0,
  });

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Catalog" },
      { label: "Paket" },
    ]);
  }, [setItems]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [listRes, allRes, aktifRes, nonAktifRes] = await Promise.all([
        listPaket({
          page,
          per_page: perPage,
          q: debouncedQ,
          status: status === "all" ? undefined : (status as "Aktif" | "Non Aktif" | undefined),
          sort_by: sortBy,
          sort_dir: sortDir,
        }),
        listPaket({ per_page: 1 }),
        listPaket({ per_page: 1, status: "Aktif" }),
        listPaket({ per_page: 1, status: "Non Aktif" }),
      ]);

      setData(listRes.items);
      setMeta(listRes.meta);
      setStats({
        total: allRes.meta.total,
        aktif: aktifRes.meta.total,
        nonAktif: nonAktifRes.meta.total,
      });
    } catch (error: any) {
      toast.error(error.message || "Gagal memuat data paket");
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
        params.set("sort_by", sortBy);
        params.set("sort_dir", sortDir);
        router.replace(`/dashboard/catalog/paket?${params.toString()}`);
    }
  }, [allowed, page, perPage, debouncedQ, status, sortBy, sortDir]);

  const handleDelete = (item: Paket) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await deletePaket(itemToDelete.id);
      toast.success("Paket berhasil dihapus");
      setDeleteDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus paket");
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  const handleExport = async (format: string) => {
    try {
      await exportPaket(format, {
        q: debouncedQ,
        status: status === "all" ? undefined : (status as any),
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
        title="Paket Bimbingan"
        description="Kelola paket bimbingan (Reguler 4x, Private, dll)"
        actions={
          <div className="flex items-center gap-2">
            <ExportDropdown onExport={handleExport} />
            {canCreate && (
              <Button asChild>
                <Link href="/dashboard/catalog/paket/create">
                  <Plus className="mr-2 size-4" />
                  Tambah Paket
                </Link>
              </Button>
            )}
          </div>
        }
      />

       <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          label="Total Paket"
          value={stats.total}
          icon={Package}
          variant="primary"
          description="Semua paket terdaftar"
        />
        <StatsCard
          label="Paket Aktif"
          value={stats.aktif}
          icon={CheckCircle}
          variant="success"
          description="Paket yang sedang aktif"
        />
        <StatsCard
          label="Paket Non Aktif"
          value={stats.nonAktif}
          icon={XCircle}
          variant="danger"
          description="Paket tidak aktif"
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
            searchPlaceholder="Cari kode atau nama..."
            filters={[
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
                { label: "Kode", value: "kode" },
                { label: "Nama", value: "nama" },
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

          <PaketTable
            data={data}
            loading={loading}
            canEdit={!!canUpdate}
            canDelete={!!canDelete}
            onEdit={(item) => router.push(`/dashboard/catalog/paket/${item.id}/edit`)}
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
        title="Hapus Paket Bimbingan?"
        description={`Apakah Anda yakin ingin menghapus paket "${itemToDelete?.nama}"? Seluruh data yang berkaitan dengan paket ini mungkin akan terpengaruh.`}
      />
    </div>
  );
}
