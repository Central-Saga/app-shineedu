"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { DataTableToolbar } from "@/shared/presentation/components/table/DataTableToolbar";
import { StatsCard } from "@/shared/presentation/components/StatsCard";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, ListChecks, CheckCircle2, Clock } from "lucide-react";
import { useDebouncedValue } from "@/shared/presentation/hooks/useDebouncedValue";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { authStore } from "@/modules/auth/infrastructure/auth.store";
import { enrollmentRepository } from "@/modules/enrollment/infrastructure/enrollment.repository";
import { Enrollment } from "@/modules/enrollment/domain/entities";
import { toast } from "sonner";
import { EnrollmentTable } from "./EnrollmentTable";
import { DataTablePagination } from "@/shared/presentation/components/table/DataTablePagination";

const SORT_OPTIONS = [
  { label: "Kode", value: "kode_enrollment" },
  { label: "Dibuat", value: "created_at" },
  { label: "Tanggal Mulai", value: "tanggal_mulai" },
] as const;

const PER_PAGE_OPTIONS = [15, 30, 50, 100];

interface EnrollmentListClientProps {
  data: Enrollment[];
  meta: any;
  stats: { total: number; aktif: number; selesai: number };
}

export function EnrollmentListClient({ data, meta, stats }: EnrollmentListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setItems } = useBreadcrumbStore();
  
  const canCreate = authStore.hasPermission("enrollment.create");
  const canDelete = authStore.hasPermission("enrollment.delete");
  const canUpdate = authStore.hasPermission("enrollment.update");

  // Local state for search
  const initialQ = searchParams.get("q") || "";
  const [searchValue, setSearchValue] = useState(initialQ);
  const debouncedQ = useDebouncedValue(searchValue, 400);

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Enrollment" },
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

  const handleStatusChange = async (id: number, status: string) => {
    try {
        const payload: any = { status };
        if (status === "Selesai") {
            payload.tanggal_selesai = new Date().toISOString().split("T")[0];
        } else if (status === "Aktif") {
            payload.tanggal_selesai = null;
        }

        await enrollmentRepository.updateEnrollment(id, payload);
        toast.success(`Enrollment ${status === 'Aktif' ? 'diaktifkan' : 'diselesaikan'}`);
        router.refresh();
    } catch (e: any) {
        toast.error(e.message || "Gagal memperbarui status");
    }
  };

  const handleDelete = async (id: number) => {
    try {
        await enrollmentRepository.deleteEnrollment(id);
        toast.success("Enrollment berhasil dihapus");
        router.refresh();
    } catch (e: any) {
        toast.error(e.message || "Gagal menghapus enrollment");
    }
  };

  return (
    <div>
      <PageHeader
        title="Enrollment"
        description="Manajemen pendaftaran siswa"
        actions={
          canCreate && (
             <Button asChild>
                <Link href="/dashboard/enrollment/create">
                   <Plus className="mr-2 size-4" />
                   Tambah Enrollment
                </Link>
             </Button>
          )
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard
          label="Total Enrollment"
          value={stats.total}
          icon={ListChecks}
          variant="primary"
          description="Seluruh pendaftaran"
        />
        <StatsCard
          label="Aktif"
          value={stats.aktif}
          icon={Clock}
          variant="success"
          description="Pendaftaran masih aktif"
        />
        <StatsCard
          label="Selesai"
          value={stats.selesai}
          icon={CheckCircle2}
          variant="info"
          description="Pendaftaran telah selesai"
        />
      </div>

       <Card className="rounded-2xl shadow-sm">
        <CardContent className="space-y-4 pt-6">
          <DataTableToolbar
            searchValue={searchValue}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Cari kode atau nama murid..."
            filters={[
              {
                key: "status",
                label: "Status",
                options: [
                  { label: "Semua", value: "__all__" },
                  { label: "Aktif", value: "Aktif" },
                  { label: "Pause", value: "Pause" },
                  { label: "Selesai", value: "Selesai" },
                  { label: "Cancel", value: "Cancel" },
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
           
           <EnrollmentTable
             data={data}
             loading={false}
             onDelete={handleDelete}
             onStatusChange={handleStatusChange}
             onEdit={(item: Enrollment) => router.push(`/dashboard/enrollment/${item.id}/edit`)}
             onView={(item: Enrollment) => router.push(`/dashboard/enrollment/${item.id}`)}
             canDelete={canDelete}
             canUpdate={canUpdate}
           />

           <DataTablePagination 
            meta={meta} 
            onPageChange={(p) => updateUrl({ page: String(p) })} 
          />
        </CardContent>
      </Card>
    </div>
  );
}
