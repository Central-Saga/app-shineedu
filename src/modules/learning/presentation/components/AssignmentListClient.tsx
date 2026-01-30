"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, ClipboardList, CheckCircle2, Clock } from "lucide-react";

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
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye } from "lucide-react";
import { StatusBadge, DueBadge } from "./StatusBadge";
import type { Assignment } from "@/modules/learning/domain/entities";
import type { PaginatedMeta } from "@/shared/domain/types";

interface AssignmentListClientProps {
  data: Assignment[];
  meta: PaginatedMeta;
  stats: {
    total: number;
    assigned: number;
    submitted: number;
    reviewed: number;
  };
  loading?: boolean;
}

const SORT_OPTIONS = [
  { label: "Tanggal Dibuat", value: "created_at" },
  { label: "Judul", value: "title" },
  { label: "Tenggat Waktu", value: "due_at" },
] as const;

const PER_PAGE_OPTIONS = [15, 30, 50, 100];

export function AssignmentListClient({
  data,
  meta,
  stats,
  loading = false,
}: AssignmentListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setItems } = useBreadcrumbStore();

  // Set Breadcrumbs
  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Tugas" },
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tugas"
        description="Kelola tugas untuk murid"
        actions={
          <Button asChild>
            <Link href="/dashboard/assignments/create">
              <Plus className="mr-2 h-4 w-4" />
              Buat Tugas
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          label="Total Tugas"
          value={stats.total}
          icon={ClipboardList}
          variant="primary"
          description="Semua tugas terdaftar"
        />
        <StatsCard
          label="Ditugaskan"
          value={stats.assigned}
          icon={Clock}
          variant="warning"
          description="Menunggu pengerjaan"
        />
        <StatsCard
          label="Dikirim"
          value={stats.submitted}
          icon={CheckCircle2}
          variant="success"
          description="Sudah dikerjakan"
        />
        <StatsCard
          label="Direview"
          value={stats.reviewed}
          icon={CheckCircle2}
          variant="primary"
          description="Sudah dinilai"
        />
      </div>

      <Card className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <CardContent className="space-y-4 pt-6">
          <DataTableToolbar
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            searchPlaceholder="Cari judul tugas..."
            filters={[
              {
                key: "status",
                label: "Status",
                options: [
                  { label: "Semua", value: "__all__" },
                  { label: "Ditugaskan", value: "ASSIGNED" },
                  { label: "Dikirim", value: "SUBMITTED" },
                  { label: "Direview", value: "REVIEWED" },
                  { label: "Ditutup", value: "CLOSED" },
                ],
                value: searchParams.get("status"),
                onChange: (v) =>
                  updateUrl({ status: v === "__all__" ? null : v, page: "1" }),
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
                  <TableHead>Murid</TableHead>
                  <TableHead>Sesi</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Submissions</TableHead>
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
                        <ClipboardList className="h-8 w-8" />
                        <p>Belum ada tugas</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell>
                        {item.enrollment?.murid?.nama_lengkap || "-"}
                      </TableCell>
                      <TableCell>
                        {item.sesi?.tanggal
                          ? new Date(item.sesi.tanggal).toLocaleDateString("id-ID")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <DueBadge dueAt={item.due_at} isOverdue={item.is_overdue} />
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge status={item.status} />
                      </TableCell>
                      <TableCell className="text-center">
                        {item.submissions_count ?? 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            router.push(`/dashboard/assignments/${item.id}`)
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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
    </div>
  );
}
