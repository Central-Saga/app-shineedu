"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { DataTableToolbar } from "@/shared/presentation/components/table/DataTableToolbar";
import { DataTablePagination } from "@/shared/presentation/components/table/DataTablePagination";
import { authStore } from "@/modules/auth/infrastructure/auth.store";
import { MuridTable } from "@/modules/murid/presentation/components/MuridTable";
import { StatsCard } from "@/shared/presentation/components/StatsCard";
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
import { Plus, Users, UserCheck, UserX, FileUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { deleteMurid, updateMurid, exportMurids } from "@/modules/murid/infrastructure/murid.repository";
import { toast } from "sonner";
import { ExportDropdown } from "@/shared/presentation/components/ExportDropdown";
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
import type { Murid } from "@/modules/murid/domain/entities";
// Removed use-debounce import
import { useDebouncedValue } from "@/shared/presentation/hooks/useDebouncedValue";

const SORT_OPTIONS = [
  { label: "Nama", value: "nama_lengkap" },
  { label: "Kode", value: "kode_murid" },
  { label: "Dibuat", value: "created_at" },
] as const;

const PER_PAGE_OPTIONS = [15, 30, 50, 100];

interface MuridListClientProps {
  data: Murid[];
  meta: any; // Keep any for now as PaginatedMeta might be complex
  stats: { total: number; aktif: number; nonaktif: number };
}

export function MuridListClient({ data, meta, stats }: MuridListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setItems } = useBreadcrumbStore();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const canCreate = authStore.hasPermission("student.create");
  const canUpdate = authStore.hasPermission("student.update");
  // const canDelete = authStore.hasPermission("student.delete");

  // Local state for search to allow typing without immediate URL push
  const initialQ = searchParams.get("q") || "";
  const [searchValue, setSearchValue] = useState(initialQ);
  const debouncedQ = useDebouncedValue(searchValue, 400);

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Murid" },
    ]);
  }, [setItems]);

  // Sync search input if URL changes externally
  useEffect(() => {
    const q = searchParams.get("q") || "";
    if (q !== searchValue) {
        setSearchValue(q);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const updateUrl = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.push(`?${params.toString()}`);
  };

  // Trigger URL update on debounced change
  useEffect(() => {
    const currentQ = searchParams.get("q") || "";
    if (debouncedQ !== currentQ) {
       updateUrl({ q: debouncedQ || null, page: "1" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  const handleSearchChange = (val: string) => {
    setSearchValue(val);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
        await deleteMurid(deletingId);
        toast.success("Murid berhasil dihapus");
        setDeletingId(null);
        router.refresh();
    } catch (e: any) {
        toast.error(e.message || "Gagal menghapus murid");
    }
  };

  const handleStatusChange = async (item: Murid, newStatus: "Aktif" | "Non Aktif") => {
    try {
      await updateMurid(item.id, { status: newStatus });
      toast.success(`Status ${item.nama_lengkap} berhasil diubah menjadi ${newStatus}`);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Gagal mengubah status murid");
    }
  };

  const handleExport = async (format: string) => {
    const params: any = {};
    searchParams.forEach((val, key) => {
      params[key] = val;
    });
    try {
      await exportMurids(format, params);
      toast.success(`Export ${format.toUpperCase()} berhasil dimulai`);
    } catch (e: any) {
      toast.error(e.message || "Gagal melakukan export");
    }
  };

  return (
    <div>
      <PageHeader
        title="Murid"
        description="Daftar murid terdaftar"
        actions={
          <div className="flex items-center gap-2">
            <ExportDropdown onExport={handleExport} />
            {canCreate && (
              <Button variant="outline" asChild>
                <Link href="/dashboard/murid/bulk-import">
                  <FileUp className="mr-2 size-4" />
                  Import Bulk
                </Link>
              </Button>
            )}
            {canCreate && (
               <Button asChild>
                  <Link href="/dashboard/murid/create">
                     <Plus className="mr-2 size-4" />
                     Tambah Murid
                  </Link>
               </Button>
            )}
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard
          label="Total Murid"
          value={stats.total}
          icon={Users}
          variant="primary"
          description="Total seluruh murid"
        />
        <StatsCard
          label="Aktif"
          value={stats.aktif}
          icon={UserCheck}
          variant="success"
          description="Murid status aktif"
        />
        <StatsCard
          label="Non Aktif"
          value={stats.nonaktif}
          icon={UserX}
          variant="danger"
          description="Murid tidak aktif"
        />
      </div>

       <Card className="rounded-2xl shadow-sm">
        <CardContent className="space-y-4 pt-6">
          <DataTableToolbar
            searchValue={searchValue}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Cari nama, kode, atau no hp..."
            filters={[
              {
                key: "status",
                label: "Status",
                options: [
                  { label: "Semua", value: "__all__" },
                  { label: "Aktif", value: "Aktif" },
                  { label: "Non Aktif", value: "Non Aktif" },
                ],
                value: searchParams.get("status"),
                onChange: (v) => updateUrl({ status: v === "__all__" ? null : v, page: "1" }),
              },
            ]}
            sort={{
              value: searchParams.get("sort_by") || "created_at",
              options: SORT_OPTIONS.map((o) => ({ label: o.label, value: o.value })),
              onChange: (v) => updateUrl({ sort_by: v, page: "1" }),
              direction: (searchParams.get("sort_dir") as "asc" | "desc") || "desc",
              onToggleDirection: () => {
                const current = searchParams.get("sort_dir") || "desc";
                updateUrl({ sort_dir: current === "asc" ? "desc" : "asc" });
              },
              defaultValue: "created_at",
              defaultDirection: "desc",
              onDirectionChange: (d) => updateUrl({ sort_dir: d }),
            }}
          />

          <div className="flex items-center gap-2">
            <Label className="text-muted-foreground text-sm whitespace-nowrap">
              Per halaman
            </Label>
            <Select
              value={searchParams.get("per_page") || "15"}
              onValueChange={(v) => updateUrl({ per_page: v, page: "1" })}
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

          <MuridTable
            data={data}
            loading={false}
            onView={(item) => router.push(`/dashboard/murid/${item.id}`)}
            onEdit={(item) => router.push(`/dashboard/murid/${item.id}/edit`)}
            onStatusChange={handleStatusChange}
            canUpdate={canUpdate}
          />
          {/* We might add a delete button in table if needed, passing setDeletingId */}

          <DataTablePagination 
            meta={meta} 
            onPageChange={(p) => updateUrl({ page: String(p) })} 
          />
        </CardContent>
      </Card>
      
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Murid?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus data murid secara soft delete.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
