"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, BookOpen, CheckCircle2, Archive } from "lucide-react";

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
import { DataTablePagination, DataTablePaginationMeta } from "@/shared/presentation/components/table/DataTablePagination";
import { useDebouncedValue } from "@/shared/presentation/hooks/useDebouncedValue";
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

import { Kelas } from "@/modules/academic/domain/types";
import { academicApi } from "@/modules/academic/infrastructure/api";
import { DataTable } from "./DataTable";
import { getColumns } from "./KelasData";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";

interface Option {
    id: number;
    nama: string;
}

interface KelasListClientProps {
    data: Kelas[];
    meta: DataTablePaginationMeta;
    stats: {
        total: number;
        active: number;
        finished: number;
    };
    programs: Option[];
    jenjangs: Option[];
    loading?: boolean;
}

const SORT_OPTIONS = [
  { label: "Tanggal Dibuat", value: "created_at" },
  { label: "Nama Kelas", value: "nama_kelas" },
] as const;

const PER_PAGE_OPTIONS = [15, 30, 50, 100];

export function KelasListClient({ 
    data, 
    meta, 
    stats,
    programs,
    jenjangs,
    loading = false
}: KelasListClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setItems } = useBreadcrumbStore();
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // Set Breadcrumbs
    useEffect(() => {
        setItems([
            { label: "Dashboard", href: "/dashboard" },
            { label: "Kelas" },
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
            await academicApi.deleteKelas(deleteId);
            toast.success("Kelas berhasil dihapus");
            router.refresh();
        } catch (e: any) {
            toast.error(e.message || "Gagal menghapus kelas");
        } finally {
            setDeleteId(null);
        }
    };

    const handleStatusChange = async (item: Kelas, newStatus: string) => {
        try {
            // Using updateKelas for status toggle
            await academicApi.updateKelas(item.id, { 
                nama_kelas: item.nama_kelas,
                program_id: item.program?.id,
                jenjang_id: item.jenjang?.id,
                status: newStatus 
            } as any);
            toast.success(`Status ${item.nama_kelas} berhasil diubah menjadi ${newStatus}`);
            router.refresh();
        } catch (e: any) {
            toast.error(e.message || "Gagal mengubah status kelas");
        }
    };

    const columns = getColumns({
        onDelete: (id) => setDeleteId(id),
        onStatusChange: handleStatusChange
    });

    return (
        <div className="space-y-6">
             <PageHeader
                title="Kelas"
                description="Manajemen kelas akademik"
                actions={
                    <Button asChild>
                        <Link href="/dashboard/kelas/create">
                             <Plus className="mr-2 h-4 w-4" />
                             Buat Kelas
                        </Link>
                    </Button>
                }
             />

             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <StatsCard
                    label="Total Kelas"
                    value={stats.total}
                    icon={BookOpen}
                    variant="primary"
                    description="Semua kelas terdaftar"
                 />
                 <StatsCard
                    label="Kelas Aktif"
                    value={stats.active}
                    icon={CheckCircle2}
                    variant="success"
                    description="Sedang berjalan"
                 />
                 <StatsCard
                    label="Kelas Selesai"
                    value={stats.finished}
                    icon={Archive}
                    variant="warning"
                    description="Sudah berakhir"
                 />
             </div>

             <Card className="rounded-lg border bg-card text-card-foreground shadow-sm">
                 <CardContent className="space-y-4 pt-6">
                     <DataTableToolbar
                        searchValue={searchValue}
                        onSearchChange={setSearchValue}
                        searchPlaceholder="Cari kelas..."
                        filters={[
                            {
                                key: "status",
                                label: "Status",
                                options: [
                                    { label: "Semua", value: "__all__" },
                                    { label: "Aktif", value: "Aktif" },
                                    { label: "Selesai", value: "Selesai" },
                                    { label: "Draft", value: "Draft" },
                                    { label: "Non Aktif", value: "Non Aktif" },
                                ],
                                value: searchParams.get("status"),
                                onChange: (v) => updateUrl({ status: v === "__all__" ? null : v, page: "1" }),
                            },
                            {
                                key: "tipe_kelas",
                                label: "Tipe",
                                options: [
                                    { label: "Semua", value: "__all__" },
                                    { label: "Reguler", value: "REGULER" },
                                    { label: "Private", value: "PRIVATE" },
                                ],
                                value: searchParams.get("tipe_kelas"),
                                onChange: (v) => updateUrl({ tipe_kelas: v === "__all__" ? null : v, page: "1" }),
                            },
                            {
                                key: "program_id",
                                label: "Program",
                                options: [
                                    { label: "Semua", value: "__all__" },
                                    ...programs.map(p => ({ label: p.nama, value: String(p.id) }))
                                ],
                                value: searchParams.get("program_id"),
                                onChange: (v) => updateUrl({ program_id: v === "__all__" ? null : v, page: "1" }),
                            },
                            {
                                key: "jenjang_id",
                                label: "Jenjang",
                                options: [
                                    { label: "Semua", value: "__all__" },
                                    ...jenjangs.map(j => ({ label: j.nama, value: String(j.id) }))
                                ],
                                value: searchParams.get("jenjang_id"),
                                onChange: (v) => updateUrl({ jenjang_id: v === "__all__" ? null : v, page: "1" }),
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
                        <DataTable columns={columns} data={data} loading={loading} />
                     </div>

                     <DataTablePagination 
                        meta={meta} 
                        onPageChange={(p) => updateUrl({ page: String(p) })} 
                     />
                 </CardContent>
             </Card>

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Kelas?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini tidak dapat dibatalkan. Data kelas dan seluruh riwayat pengajaran di dalamnya akan hilang secara permanen.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
