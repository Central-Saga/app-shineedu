"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { kasApi, KasTransaksi, KAS_KATEGORI_OPTIONS } from "@/lib/api/kas";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  ArrowUpCircle,
  ArrowDownCircle,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import type { PaginatedMeta } from "@/shared/domain/types";
import { DEFAULT_META } from "@/shared/infrastructure/api/httpClient";

const formatCurrency = (val: number | string | null | undefined) => {
  if (val === null || val === undefined) return "Rp 0";
  const num = typeof val === 'string' ? parseFloat(val) : val;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(num);
};

const formatDate = (s: string | null | undefined) => {
  if (!s) return "-";
  try {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? String(s) : d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  } catch {
    return String(s);
  }
};

export default function KasTransaksiPage() {
  const { allowed } = usePermissionGuard("kas.view");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setItems } = useBreadcrumbStore();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<KasTransaksi[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta>(DEFAULT_META);

  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [filterType, setFilterType] = useState(searchParams.get("type") || "__all__");
  const [filterKategori, setFilterKategori] = useState(searchParams.get("kategori") || "__all__");
  const [filterDateFrom, setFilterDateFrom] = useState(searchParams.get("tanggal_from") || "");
  const [filterDateTo, setFilterDateTo] = useState(searchParams.get("tanggal_to") || "");

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Kas", href: "/dashboard/kas" },
      { label: "Transaksi" },
    ]);
  }, [setItems]);

  const fetchData = useCallback(async () => {
    if (!allowed) return;
    setLoading(true);
    try {
      const page = Number(searchParams.get("page")) || 1;
      const per_page = Number(searchParams.get("per_page")) || 15;
      const q = searchParams.get("q") || undefined;
      const typeParam = searchParams.get("type");
      const kategori = searchParams.get("kategori") || undefined;
      const tanggal_from = searchParams.get("tanggal_from") || undefined;
      const tanggal_to = searchParams.get("tanggal_to") || undefined;
      
      // Validate type param
      const validType = typeParam === 'IN' || typeParam === 'OUT' ? typeParam : undefined;

      const result = await kasApi.list({
        page,
        per_page,
        q,
        type: validType,
        kategori: kategori && kategori !== '__all__' ? kategori : undefined,
        tanggal_from,
        tanggal_to
      });

      setData(result.data);
      setMeta(result.meta);
    } catch (error: any) {
      if (error?.status === 403) {
        toast.error("Anda tidak memiliki akses ke halaman ini");
        router.replace("/dashboard");
        return;
      }
      toast.error(error.message || "Gagal memuat data transaksi");
    } finally {
      setLoading(false);
    }
  }, [allowed, searchParams, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateSearchParams = useCallback((updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "__all__") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    // Reset to page 1 when filters change (except for page change itself)
    if (!updates.page) {
      params.delete("page");
    }
    router.push(`?${params.toString()}`);
  }, [searchParams, router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateSearchParams({ q: searchQuery || undefined });
  };

  const handlePageChange = (newPage: number) => {
    updateSearchParams({ page: String(newPage) });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterType("__all__");
    setFilterKategori("__all__");
    setFilterDateFrom("");
    setFilterDateTo("");
    router.push("?");
  };

  const hasActiveFilters = searchQuery || filterType !== "__all__" || filterKategori !== "__all__" || filterDateFrom || filterDateTo;

  if (!allowed) return null;

  return (
    <div className="w-full pb-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transaksi Kas</h1>
          <p className="text-muted-foreground text-sm">
            Kelola dan lihat riwayat transaksi kas masuk dan keluar
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/kas/transaksi/new">
            <Plus className="mr-2 size-4" />
            Tambah Transaksi
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="py-4 border-b">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Filter className="size-4" />
            Filter & Pencarian
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2 text-xs ml-2">
                <X className="size-3 mr-1" /> Reset
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Cari keterangan, pihak, referensi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </form>

            {/* Type Filter */}
            <Select
              value={filterType}
              onValueChange={(val) => {
                setFilterType(val);
                updateSearchParams({ type: val });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipe Transaksi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Semua Tipe</SelectItem>
                <SelectItem value="IN">Kas Masuk (IN)</SelectItem>
                <SelectItem value="OUT">Kas Keluar (OUT)</SelectItem>
              </SelectContent>
            </Select>

            {/* Kategori Filter */}
            <Select
              value={filterKategori}
              onValueChange={(val) => {
                setFilterKategori(val);
                updateSearchParams({ kategori: val });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Semua Kategori</SelectItem>
                {KAS_KATEGORI_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Range */}
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={filterDateFrom}
                onChange={(e) => {
                  setFilterDateFrom(e.target.value);
                  updateSearchParams({ tanggal_from: e.target.value || undefined });
                }}
                placeholder="Dari"
                className="text-sm"
              />
              <span className="text-muted-foreground text-sm">-</span>
              <Input
                type="date"
                value={filterDateTo}
                onChange={(e) => {
                  setFilterDateTo(e.target.value);
                  updateSearchParams({ tanggal_to: e.target.value || undefined });
                }}
                placeholder="Sampai"
                className="text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : data.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-muted-foreground">Tidak ada data transaksi</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Tanggal</TableHead>
                  <TableHead className="w-[80px]">Tipe</TableHead>
                  <TableHead className="text-right w-[140px]">Jumlah</TableHead>
                  <TableHead className="w-[100px]">Metode</TableHead>
                  <TableHead className="w-[120px]">Kategori</TableHead>
                  <TableHead>Pihak</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead className="w-[120px]">Referensi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((trx) => (
                  <TableRow key={trx.id}>
                    <TableCell className="font-medium text-sm">
                      {formatDate(trx.tanggal)}
                    </TableCell>
                    <TableCell>
                      {trx.type === 'IN' ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
                          <ArrowUpCircle className="size-3" />
                          IN
                        </Badge>
                      ) : (
                        <Badge className="bg-red-50 text-red-700 border-red-200 gap-1">
                          <ArrowDownCircle className="size-3" />
                          OUT
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className={`text-right font-mono font-semibold ${trx.type === 'IN' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {trx.type === 'IN' ? '+' : '-'}{formatCurrency(trx.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{trx.metode}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">{trx.kategori}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {trx.pihak || "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {trx.keterangan || "-"}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {trx.external_ref || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>

        {/* Pagination */}
        {meta.last_page > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <p className="text-sm text-muted-foreground">
              Menampilkan {((meta.current_page - 1) * meta.per_page) + 1} - {Math.min(meta.current_page * meta.per_page, meta.total)} dari {meta.total} transaksi
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={meta.current_page === 1}
                onClick={() => handlePageChange(meta.current_page - 1)}
              >
                <ChevronLeft className="size-4 mr-1" />
                Sebelumnya
              </Button>
              <span className="text-sm font-medium px-2">
                {meta.current_page} / {meta.last_page}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={meta.current_page === meta.last_page}
                onClick={() => handlePageChange(meta.current_page + 1)}
              >
                Selanjutnya
                <ChevronRight className="size-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
