"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { kasApi, KasTransaksi } from "@/lib/api/kas";
import { KasTransaksiListClient } from "@/modules/finance/presentation/components/KasTransaksiListClient";
import { toast } from "sonner";

import type { PaginatedMeta } from "@/shared/domain/types";
import { DEFAULT_META } from "@/shared/infrastructure/api/httpClient";

export default function KasTransaksiPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<KasTransaksi[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta>(DEFAULT_META);
  const [stats, setStats] = useState({ total_in: 0, total_out: 0, balance: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const page = Number(searchParams.get("page")) || 1;
      const per_page = Number(searchParams.get("per_page")) || 15;
      const q = searchParams.get("q") || undefined;
      const typeParam = searchParams.get("type");
      const kategori = searchParams.get("kategori") || undefined;
      const tanggal_from = searchParams.get("tanggal_from") || undefined;
      const tanggal_to = searchParams.get("tanggal_to") || undefined;
      const sort_by = searchParams.get("sort_by") || "tanggal";
      const sort_dir = (searchParams.get("sort_dir") as "asc" | "desc") || "desc";

      // Validate type param
      const validType = typeParam === "IN" || typeParam === "OUT" ? typeParam : undefined;

      // Fetch main list
      const result = await kasApi.list({
        page,
        per_page,
        q,
        type: validType,
        kategori: kategori && kategori !== "__all__" ? kategori : undefined,
        tanggal_from,
        tanggal_to,
        sort_by,
        sort_dir,
      });

      // Fetch stats (total IN, total OUT)
      const [inResult, outResult] = await Promise.all([
        kasApi.list({ type: "IN", per_page: 1 }),
        kasApi.list({ type: "OUT", per_page: 1 }),
      ]);

      // Calculate totals from meta or fetch summary endpoint if available
      // For now, we'll use simple calculation
      const totalIn = inResult.meta.total || 0;
      const totalOut = outResult.meta.total || 0;

      setData(result.data);
      setMeta(result.meta);
      setStats({
        total_in: totalIn,
        total_out: totalOut,
        balance: totalIn - totalOut,
      });
    } catch (error: any) {
      toast.error(error.message || "Gagal memuat data transaksi");
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && data.length === 0) {
    return <div className="flex h-48 items-center justify-center">Memuat data...</div>;
  }

  return <KasTransaksiListClient data={data} meta={meta} stats={stats} />;
}
