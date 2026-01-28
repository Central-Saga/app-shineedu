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
import { Plus, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { useDebouncedValue } from "@/shared/presentation/hooks/useDebouncedValue";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { KasTransaksi } from "@/lib/api/kas";
import type { PaginatedMeta } from "@/shared/domain/types";
import { KasTransaksiTable } from "./KasTransaksiTable";
import { DataTablePagination } from "@/shared/presentation/components/table/DataTablePagination";
import { ExportDropdown } from "@/shared/presentation/components/ExportDropdown";
import { download } from "@/shared/infrastructure/api/httpClient";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

const SORT_OPTIONS = [
  { label: "Tanggal", value: "tanggal" },
  { label: "Jumlah", value: "amount" },
  { label: "Dibuat", value: "created_at" },
] as const;

const PER_PAGE_OPTIONS = [15, 30, 50, 100];

const TYPE_OPTIONS = [
  { label: "Semua Tipe", value: "__all__" },
  { label: "Kas Masuk (IN)", value: "IN" },
  { label: "Kas Keluar (OUT)", value: "OUT" },
];

const KATEGORI_OPTIONS = [
  { label: "Semua Kategori", value: "__all__" },
  { label: "Pembayaran Paket", value: "Pembayaran Paket" },
  { label: "Biaya Pendaftaran", value: "Biaya Pendaftaran" },
  { label: "Gaji", value: "Gaji" },
  { label: "Sewa", value: "Sewa" },
  { label: "ATK", value: "ATK" },
  { label: "Operasional", value: "Operasional" },
  { label: "Refund", value: "Refund" },
  { label: "Lainnya", value: "Lainnya" },
];

interface KasTransaksiListClientProps {
  data: KasTransaksi[];
  meta: PaginatedMeta;
  stats: {
    total_in: number;
    total_out: number;
    balance: number;
  };
}

export function KasTransaksiListClient({ data, meta, stats }: KasTransaksiListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setItems } = useBreadcrumbStore();

  const initialQ = searchParams.get("q") || "";
  const [searchValue, setSearchValue] = useState(initialQ);
  const debouncedQ = useDebouncedValue(searchValue, 400);

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Kas", href: "/dashboard/kas" },
      { label: "Transaksi" },
    ]);
  }, [setItems]);

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
      if (value === null || value === "__all__") {
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

  const handleExport = async (format: string) => {
    try {
      const params: Record<string, string> = {};
      searchParams.forEach((val, key) => {
        params[key] = val;
      });
      await download("kas/transaksi/export", { ...params, format });
      toast.success(`Berhasil export ke ${format.toUpperCase()}`);
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message || "Gagal export data");
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div>
      <PageHeader
        title="Transaksi Kas"
        description="Kelola dan lihat riwayat transaksi kas masuk dan keluar"
        actions={
          <div className="flex items-center gap-2">
            <ExportDropdown onExport={handleExport} />
            <Button asChild>
              <Link href="/dashboard/kas/transaksi/new">
                <Plus className="mr-2 size-4" />
                Tambah Transaksi
              </Link>
            </Button>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard
          label="Total Kas Masuk"
          value={formatCurrency(stats.total_in)}
          icon={TrendingUp}
          variant="success"
          description="Total pemasukan"
        />
        <StatsCard
          label="Total Kas Keluar"
          value={formatCurrency(stats.total_out)}
          icon={TrendingDown}
          variant="danger"
          description="Total pengeluaran"
        />
        <StatsCard
          label="Saldo"
          value={formatCurrency(stats.balance)}
          icon={DollarSign}
          variant={stats.balance >= 0 ? "primary" : "danger"}
          description="Kas masuk - kas keluar"
        />
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="space-y-4 pt-6">
          <DataTableToolbar
            searchValue={searchValue}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Cari keterangan, pihak, referensi..."
            filters={[
              {
                key: "type",
                label: "Tipe",
                options: TYPE_OPTIONS,
                value: searchParams.get("type"),
                onChange: (v) => updateUrl({ type: v === "__all__" ? null : v, page: "1" }),
              },
              {
                key: "kategori",
                label: "Kategori",
                options: KATEGORI_OPTIONS,
                value: searchParams.get("kategori"),
                onChange: (v) => updateUrl({ kategori: v === "__all__" ? null : v, page: "1" }),
              },
            ]}
            sort={{
              value: searchParams.get("sort_by") || "tanggal",
              options: SORT_OPTIONS.map((o) => ({ label: o.label, value: o.value })),
              onChange: (v) => updateUrl({ sort_by: v, page: "1" }),
              direction: (searchParams.get("sort_dir") as "asc" | "desc") || "desc",
              onToggleDirection: () => {
                const current = searchParams.get("sort_dir") || "desc";
                updateUrl({ sort_dir: current === "asc" ? "desc" : "asc" });
              },
              defaultValue: "tanggal",
              defaultDirection: "desc",
              onDirectionChange: (d) => updateUrl({ sort_dir: d }),
            }}
          />

          {/* Date Range Filters */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground whitespace-nowrap">Dari:</Label>
              <Input
                type="date"
                value={searchParams.get("tanggal_from") || ""}
                onChange={(e) => updateUrl({ tanggal_from: e.target.value || null, page: "1" })}
                className="h-9 w-[150px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground whitespace-nowrap">Sampai:</Label>
              <Input
                type="date"
                value={searchParams.get("tanggal_to") || ""}
                onChange={(e) => updateUrl({ tanggal_to: e.target.value || null, page: "1" })}
                className="h-9 w-[150px]"
              />
            </div>
          </div>

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

          <KasTransaksiTable data={data} loading={false} />

          <DataTablePagination meta={meta} onPageChange={(p) => updateUrl({ page: String(p) })} />
        </CardContent>
      </Card>
    </div>
  );
}
