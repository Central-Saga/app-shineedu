"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { enrollmentRepository } from "@/modules/enrollment/infrastructure/enrollment.repository";
import { EnrollmentListClient } from "@/modules/enrollment/presentation/components/EnrollmentListClient";
import { toast } from "sonner";
import { Enrollment } from "@/modules/enrollment/domain/entities";

import type { PaginatedMeta } from "@/shared/domain/types";
import { DEFAULT_META } from "@/shared/infrastructure/api/httpClient";

export default function EnrollmentPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Enrollment[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta>(DEFAULT_META);
  const [stats, setStats] = useState({ total: 0, aktif: 0, selesai: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const page = Number(searchParams.get("page")) || 1;
      const per_page = Number(searchParams.get("per_page")) || 15;
      const q = searchParams.get("q") || "";
      const status = searchParams.get("status") || undefined;
      const sort_by = searchParams.get("sort_by") || "created_at";
      const sort_dir = (searchParams.get("sort_dir") as "asc" | "desc") || "desc";

      const [listRes, allRes, activeRes, finishedRes] = await Promise.all([
        enrollmentRepository.getEnrollments({ 
          page, 
          per_page, 
          q, 
          status: status === "__all__" ? undefined : status,
          sort_by,
          sort_dir
        }),
        enrollmentRepository.getEnrollments({ per_page: 1 }),
        enrollmentRepository.getEnrollments({ per_page: 1, status: "Aktif" }),
        enrollmentRepository.getEnrollments({ per_page: 1, status: "Selesai" }),
      ]);

      setData(listRes.data);
      setMeta(listRes.meta);
      setStats({
        total: allRes.meta.total,
        aktif: activeRes.meta.total,
        selesai: finishedRes.meta.total,
      });
    } catch (e: any) {
      toast.error(e.message || "Gagal memuat data enrollment");
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

  return <EnrollmentListClient data={data} meta={meta} stats={stats} />;
}
