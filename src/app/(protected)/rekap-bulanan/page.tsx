"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { rekapService, RekapBulananItem } from "@/modules/hr/infrastructure/rekap.service";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { RekapListTable } from "@/modules/hr/presentation/components/rekap-list-table";
import { Card, CardContent } from "@/components/ui/card";
import { MonthYearSelect } from "@/modules/hr/presentation/components/month-year-select";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { toast } from "sonner";
import { ForbiddenError } from "@/shared/infrastructure/api/errors";
import { DataTableToolbar } from "@/shared/presentation/components/table/DataTableToolbar";
import { DataTablePagination } from "@/shared/presentation/components/table/DataTablePagination";
import { useDebouncedValue } from "@/shared/presentation/hooks/useDebouncedValue";
import { Label } from "@/components/ui/label";
import { StatsCard } from "@/shared/presentation/components/StatsCard";
import { Users, CheckCircle, CalendarClock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function RekapBulananPage() {
  const { allowed } = usePermissionGuard("rekap_bulanan.view");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setItems } = useBreadcrumbStore();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RekapBulananItem[]>([]);
  
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [search, setSearch] = useState("");
  const debouncedQ = useDebouncedValue(search, 400);
  const prevDebouncedQ = useRef(debouncedQ);

  const [meta, setMeta] = useState({
    current_page: 1,
    per_page: 15,
    total: 0,
    last_page: 1,
    from: null as number | null,
    to: null as number | null,
  });

  const [sortKey, setSortKey] = useState("nama");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const now = new Date();
  const bulan = parseInt(searchParams.get("bulan") || String(now.getMonth() + 1));
  const tahun = parseInt(searchParams.get("tahun") || String(now.getFullYear()));

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Payroll" },
    ]);
  }, [setItems]);

  useEffect(() => {
    if (!allowed) return;

    async function loadData() {
      setLoading(true);
      
      const searchJustChanged = prevDebouncedQ.current !== debouncedQ;
      if (searchJustChanged) {
        prevDebouncedQ.current = debouncedQ;
        setPage(1);
      }
      const pageToUse = searchJustChanged ? 1 : page;

      try {
        const result = await rekapService.getRekapList({
          bulan,
          tahun,
          q: debouncedQ || undefined,
          page: pageToUse,
          per_page: perPage,
        });
        setData(result.data);
        setMeta(result.meta);
      } catch (error) {
        if (error instanceof ForbiddenError) {
          toast.error("Anda tidak memiliki akses");
          router.replace("/dashboard");
        } else {
          toast.error("Gagal memuat data payroll");
        }
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [allowed, bulan, tahun, debouncedQ, page, perPage, router]);

  if (!allowed) return null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Payroll"
        description={`Rekapitulasi kehadiran dan estimasi gaji periode ${bulan}/${tahun}`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard
          label="Total Karyawan"
          value={meta.total}
          icon={Users}
          variant="primary"
          description="Terdaftar bulan ini"
        />
        <StatsCard
          label="Sesi Terlaksana"
          value={data.reduce((acc, item) => acc + (item.jadwal?.sesi_terlaksana || 0), 0)}
          icon={CheckCircle}
          variant="success"
          description="Total akumulasi sesi"
        />
         <StatsCard
          label="Sesi Pengganti"
          value={data.reduce((acc, item) => acc + (item.jadwal?.sesi_menggantikan || 0), 0)}
          icon={CalendarClock}
          variant="info"
          description="Akumulasi guru pengganti"
        />
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="space-y-4 pt-6">
          <DataTableToolbar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Cari nama atau kode karyawan…"
            filters={[]}
            sort={{
              value: sortKey,
              options: [{ label: "Nama", value: "nama" }],
              onChange: (v) => setSortKey(v),
              direction: sortDir,
              onToggleDirection: () => setSortDir((d) => (d === "asc" ? "desc" : "asc")),
              defaultValue: "nama",
              defaultDirection: "asc",
              onDirectionChange: (d) => setSortDir(d),
            }}
            rightSlot={
                <div className="ml-2">
                    <MonthYearSelect 
                        defaultMonth={bulan} 
                        defaultYear={tahun} 
                        className="w-full md:w-auto"
                    />
                </div>
            }
          />

          <div className="flex items-center gap-2">
            <Label className="text-muted-foreground text-sm whitespace-nowrap font-medium">
              Per halaman
            </Label>
            <Select
              value={String(perPage)}
              onValueChange={(v) => {
                setPerPage(Number(v));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[100px] rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[15, 30, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <RekapListTable 
            data={data} 
            meta={meta} 
            params={{ q: debouncedQ, bulan, tahun }}
            loading={loading}
          />

          <DataTablePagination meta={meta} onPageChange={(p) => setPage(p)} />
        </CardContent>
      </Card>
    </div>
  );
}
