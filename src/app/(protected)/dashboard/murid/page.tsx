"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { listMurids, DEFAULT_META } from "@/modules/murid/infrastructure/murid.repository";
import { MuridListClient } from "@/modules/murid/presentation/components/MuridListClient";
import { toast } from "sonner";
import type { Murid } from "@/modules/murid/domain/entities";
import type { PaginatedMeta } from "@/shared/domain/types";

export default function MuridPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Murid[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta>(DEFAULT_META);
  const [stats, setStats] = useState({ total: 0, aktif: 0, nonaktif: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const page = Number(searchParams.get("page")) || 1;
      const per_page = Number(searchParams.get("per_page")) || 15;
      const q = searchParams.get("q") || "";
      const status = searchParams.get("status") || undefined;
      const sort_by = searchParams.get("sort_by") || "created_at";
      const sort_dir = (searchParams.get("sort_dir") as "asc" | "desc") || "desc";

      const [listRes, allRes, activeRes, inactiveRes] = await Promise.all([
        listMurids({ page, per_page, q, status: status === "__all__" ? undefined : status, sort_by, sort_dir }),
        listMurids({ per_page: 1 }),
        listMurids({ per_page: 1, status: "Aktif" }),
        listMurids({ per_page: 1, status: "Non Aktif" }),
      ]);

      setData(listRes.items);
      setMeta(listRes.meta);
      setStats({
        total: allRes.meta.total,
        aktif: activeRes.meta.total,
        nonaktif: inactiveRes.meta.total,
      });
    } catch (e: any) {
      toast.error(e.message || "Gagal memuat data murid");
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

  return <MuridListClient data={data} meta={meta} stats={stats} />;
}
