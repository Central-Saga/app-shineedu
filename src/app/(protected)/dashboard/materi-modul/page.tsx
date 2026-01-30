"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { MateriModulListClient } from "@/modules/learning/presentation/components/MateriModulListClient";
import { materiRepository } from "@/modules/learning/infrastructure/materi.repository";
import { listProgram, listJenjang } from "@/modules/catalog/infrastructure/catalog.repository";
import type { MateriModul } from "@/modules/learning/domain/entities";
import type { PaginatedMeta } from "@/shared/domain/types";

const DEFAULT_META: PaginatedMeta = {
  current_page: 1,
  per_page: 15,
  total: 0,
  last_page: 1,
  from: null,
  to: null,
};

export default function MateriModulPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MateriModul[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta>(DEFAULT_META);
  const [programs, setPrograms] = useState<any[]>([]);
  const [jenjangs, setJenjangs] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const page = Number(searchParams.get("page")) || 1;
      const per_page = Number(searchParams.get("per_page")) || 15;
      const q = searchParams.get("q") || "";
      const is_active = searchParams.get("is_active") || undefined;
      const program_id = searchParams.get("program_id") || undefined;
      const jenjang_id = searchParams.get("jenjang_id") || undefined;
      const sort_by = searchParams.get("sort_by") || "created_at";
      const sort_dir = searchParams.get("sort_dir") || "desc";

      const [listRes, programsRes, jenjangsRes, statsTotal, statsActive, statsInactive] =
        await Promise.all([
          materiRepository.getList({
            page,
            per_page,
            q,
            is_active: is_active === "true" ? true : is_active === "false" ? false : undefined,
            program_id,
            jenjang_id,
            sort_by,
            sort_dir,
          }),
          listProgram({}),
          listJenjang({}),
          materiRepository.getList({ per_page: 1 }),
          materiRepository.getList({ per_page: 1, is_active: true }),
          materiRepository.getList({ per_page: 1, is_active: false }),
        ]);

      setData(listRes.data || []);
      setMeta(listRes.meta || DEFAULT_META);
      setPrograms(programsRes.items || []);
      setJenjangs(jenjangsRes.items || []);
      setStats({
        total: statsTotal.meta?.total || 0,
        active: statsActive.meta?.total || 0,
        inactive: statsInactive.meta?.total || 0,
      });
    } catch (e: any) {
      toast.error(e.message || "Gagal memuat data materi modul");
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

  return (
    <MateriModulListClient
      data={data}
      meta={meta}
      stats={stats}
      programs={programs}
      jenjangs={jenjangs}
      loading={loading}
    />
  );
}
