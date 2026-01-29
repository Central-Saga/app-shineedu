"use client";

import { useEffect, useState } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Briefcase, Clock, CheckSquare, XCircle, UserCheck } from "lucide-react";
import { toast } from "sonner";
import {
  listJobApplications,
  deleteJobApplication,
} from "@/modules/job-application/infrastructure/job-application.repository";
import { JobApplicationTable } from "@/modules/job-application/presentation/components/JobApplicationTable";
import type { JobApplication } from "@/modules/job-application/domain/entities";

const STATUS_OPTIONS = [
  { label: "Pending", value: "pending" },
  { label: "Reviewed", value: "reviewed" },
  { label: "Shortlisted", value: "shortlisted" },
  { label: "Rejected", value: "rejected" },
  { label: "Hired", value: "hired" },
];

const SORT_OPTIONS = [
  { label: "Tanggal", value: "created_at" },
  { label: "Status", value: "status" },
  { label: "Nama", value: "first_name" },
] as const;

export default function JobApplicationsPage() {
  const { allowed } = usePermissionGuard("job_application.view");
  const router = useRouter();
  const { setItems } = useBreadcrumbStore();

  const [items, setTableItems] = useState<JobApplication[]>([]);
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
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<string>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    shortlisted: 0,
    hired: 0,
  });

  const canUpdate = authStore.hasPermission("job_application.update");
  const canDelete = authStore.hasPermission("job_application.delete");

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Job Applications" },
    ]);
  }, [setItems]);

  useEffect(() => {
    if (!allowed) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    allowed,
    page,
    perPage,
    debouncedQ,
    statusFilter,
    sortKey,
    sortDir,
  ]);

  async function loadData() {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: perPage,
        q: debouncedQ || undefined,
        status: statusFilter || undefined,
        sort_by: sortKey,
        sort_dir: sortDir,
      };
      const { items: resItems, meta: resMeta } =
        await listJobApplications(params);
      setTableItems(resItems);
      setMeta(resMeta);

      const [totalRes, pendingRes, shortlistedRes, hiredRes] = await Promise.all(
        [
          listJobApplications({ per_page: 1 }),
          listJobApplications({ per_page: 1, status: "pending" }),
          listJobApplications({ per_page: 1, status: "shortlisted" }),
          listJobApplications({ per_page: 1, status: "hired" }),
        ]
      );
      setStats({
        total: totalRes.meta.total,
        pending: pendingRes.meta.total,
        shortlisted: shortlistedRes.meta.total,
        hired: hiredRes.meta.total,
      });
    } catch (e) {
      toast.error("Gagal memuat data lamaran");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(item: JobApplication) {
    try {
      await deleteJobApplication(item.id);
      toast.success("Lamaran dihapus");
      loadData();
    } catch (e) {
      toast.error("Gagal menghapus lamaran");
    }
  }

  if (!allowed) return null;

  return (
    <div>
      <PageHeader
        title="Lamaran Kerja"
        description="Daftar lamaran kerja dari kandidat (landing job-applications)"
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatsCard
          label="Total"
          value={stats.total}
          icon={Briefcase}
          variant="primary"
          description="Total lamaran"
        />
        <StatsCard
          label="Pending"
          value={stats.pending}
          icon={Clock}
          variant="warning"
          description="Menunggu review"
        />
        <StatsCard
          label="Shortlisted"
          value={stats.shortlisted}
          icon={UserCheck}
          variant="warning"
          description="Shortlist"
        />
        <StatsCard
          label="Hired"
          value={stats.hired}
          icon={CheckSquare}
          variant="success"
          description="Diterima"
        />
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="space-y-4 pt-6">
          <DataTableToolbar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Cari nama, email..."
            filters={[
              {
                key: "status",
                label: "Status",
                options: [
                  { label: "Semua", value: "__all__" },
                  ...STATUS_OPTIONS,
                ],
                value: statusFilter,
                onChange: (v) => {
                  setStatusFilter(v);
                  setPage(1);
                },
              },
            ]}
            sort={{
              value: sortKey,
              options: [...SORT_OPTIONS],
              onChange: (v) => setSortKey(v),
              direction: sortDir,
              onToggleDirection: () =>
                setSortDir((d) => (d === "asc" ? "desc" : "asc")),
              defaultValue: "created_at",
              defaultDirection: "desc",
              onDirectionChange: setSortDir,
            }}
          />

          <div className="flex items-center gap-2">
            <Label className="text-muted-foreground whitespace-nowrap text-sm">
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
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <JobApplicationTable
            items={items}
            loading={loading}
            onView={(item) => router.push(`/job-applications/${item.id}`)}
            onEdit={(item) =>
              router.push(`/job-applications/${item.id}/edit`)
            }
            onDelete={handleDelete}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />

          <DataTablePagination meta={meta} onPageChange={setPage} />
        </CardContent>
      </Card>
    </div>
  );
}
