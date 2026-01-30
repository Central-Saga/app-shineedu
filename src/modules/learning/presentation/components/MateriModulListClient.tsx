"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, BookOpen, CheckCircle2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { StatsCard } from "@/shared/presentation/components/StatsCard";
import { DataTableToolbar } from "@/shared/presentation/components/table/DataTableToolbar";
import { DataTablePagination } from "@/shared/presentation/components/table/DataTablePagination";
import { useDebouncedValue } from "@/shared/presentation/hooks/useDebouncedValue";
import { ConfirmDeleteDialog } from "@/shared/presentation/components/ConfirmDeleteDialog";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";
import { ActiveBadge } from "./StatusBadge";
import { materiRepository } from "@/modules/learning/infrastructure/materi.repository";
import type { MateriModul } from "@/modules/learning/domain/entities";
import type { PaginatedMeta } from "@/shared/domain/types";

interface Option {
  id: number;
  nama: string;
}

interface MateriModulListClientProps {
  data: MateriModul[];
  meta: PaginatedMeta;
  stats: {
    total: number;
    active: number;
    inactive: number;
  };
  programs: Option[];
  jenjangs: Option[];
  loading?: boolean;
}

const SORT_OPTIONS = [
  { label: "Tanggal Dibuat", value: "created_at" },
  { label: "Judul", value: "title" },
] as const;

const PER_PAGE_OPTIONS = [15, 30, 50, 100];

export function MateriModulListClient({
  data,
  meta,
  stats,
  programs,
  jenjangs,
  loading = false,
}: MateriModulListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setItems } = useBreadcrumbStore();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Set Breadcrumbs
  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Materi Modul" },
    ]);
  }, [setItems]);

  // Initial state from URL
  const initialQ = searchParams.get("q") || "";
  const [searchValue, setSearchValue] = useState(initialQ);
  const debouncedQ = useDebouncedValue(searchValue, 400);

  // URL Update Helper
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

  // Sync state with URL if it changes externally
  useEffect(() => {
    const q = searchParams.get("q") || "";
    if (q !== searchValue) {
      setSearchValue(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Handle Debounced Search
  useEffect(() => {
    const currentQ = searchParams.get("q") || "";
    if (debouncedQ !== currentQ) {
      updateUrl({ q: debouncedQ || null, page: "1" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await materiRepository.delete(deleteId);
      toast.success("Materi modul berhasil dihapus");
      router.refresh();
    } catch {
      toast.error("Gagal menghapus materi modul");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Materi Modul"
        description="Kelola materi pembelajaran untuk murid"
        actions={
          <Button asChild>
            <Link href="/dashboard/materi-modul/create">
              <Plus className="mr-2 h-4 w-4" />
              Buat Modul
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          label="Total Modul"
          value={stats.total}
          icon={BookOpen}
          variant="primary"
          description="Semua modul terdaftar"
        />
        <StatsCard
          label="Modul Aktif"
          value={stats.active}
          icon={CheckCircle2}
          variant="success"
          description="Dapat diakses murid"
        />
        <StatsCard
          label="Modul Nonaktif"
          value={stats.inactive}
          icon={XCircle}
          variant="warning"
          description="Tidak ditampilkan"
        />
      </div>

      <Card className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <CardContent className="space-y-4 pt-6">
          <DataTableToolbar
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            searchPlaceholder="Cari judul modul..."
            filters={[
              {
                key: "is_active",
                label: "Status",
                options: [
                  { label: "Semua", value: "__all__" },
                  { label: "Aktif", value: "true" },
                  { label: "Nonaktif", value: "false" },
                ],
                value: searchParams.get("is_active"),
                onChange: (v) =>
                  updateUrl({ is_active: v === "__all__" ? null : v, page: "1" }),
              },
              {
                key: "program_id",
                label: "Program",
                options: [
                  { label: "Semua", value: "__all__" },
                  ...programs.map((p) => ({ label: p.nama, value: String(p.id) })),
                ],
                value: searchParams.get("program_id"),
                onChange: (v) =>
                  updateUrl({ program_id: v === "__all__" ? null : v, page: "1" }),
              },
              {
                key: "jenjang_id",
                label: "Jenjang",
                options: [
                  { label: "Semua", value: "__all__" },
                  ...jenjangs.map((j) => ({ label: j.nama, value: String(j.id) })),
                ],
                value: searchParams.get("jenjang_id"),
                onChange: (v) =>
                  updateUrl({ jenjang_id: v === "__all__" ? null : v, page: "1" }),
              },
            ]}
            sort={{
              value: searchParams.get("sort_by") || "created_at",
              options: SORT_OPTIONS,
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

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Jenjang</TableHead>
                  <TableHead className="text-center">Items</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <BookOpen className="h-8 w-8" />
                        <p>Belum ada materi modul</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell>{item.program?.nama || "-"}</TableCell>
                      <TableCell>{item.jenjang?.nama || "-"}</TableCell>
                      <TableCell className="text-center">
                        {item.items_count ?? item.items?.length ?? 0}
                      </TableCell>
                      <TableCell className="text-center">
                        <ActiveBadge isActive={item.is_active} />
                      </TableCell>
                      <TableCell>
                        {item.updated_at
                          ? new Date(item.updated_at).toLocaleDateString("id-ID")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              router.push(`/dashboard/materi-modul/${item.id}/edit`)
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <DataTablePagination
            meta={meta}
            onPageChange={(p) => updateUrl({ page: String(p) })}
          />
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        isOpen={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Materi Modul"
        description="Yakin ingin menghapus materi modul ini? Semua item di dalamnya juga akan dihapus."
      />
    </div>
  );
}
