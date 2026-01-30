"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AssignmentListClient } from "@/modules/learning/presentation/components/AssignmentListClient";
import { assignmentRepository } from "@/modules/learning/infrastructure/assignment.repository";
import type { Assignment } from "@/modules/learning/domain/entities";
import type { PaginatedMeta } from "@/shared/domain/types";

const DEFAULT_META: PaginatedMeta = {
  current_page: 1,
  per_page: 15,
  total: 0,
  last_page: 1,
  from: null,
  to: null,
};

export default function AssignmentsPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Assignment[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta>(DEFAULT_META);
  const [stats, setStats] = useState({ total: 0, assigned: 0, submitted: 0, reviewed: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const page = Number(searchParams.get("page")) || 1;
      const per_page = Number(searchParams.get("per_page")) || 15;
      const q = searchParams.get("q") || "";
      const status = searchParams.get("status") || undefined;
      const sort_by = searchParams.get("sort_by") || "created_at";
      const sort_dir = searchParams.get("sort_dir") || "desc";

      const [listRes, statsTotal, statsAssigned, statsSubmitted, statsReviewed] =
        await Promise.all([
          assignmentRepository.getList({
            page,
            per_page,
            q,
            status: status === "__all__" ? undefined : status,
            sort_by,
            sort_dir,
          }),
          assignmentRepository.getList({ per_page: 1 }),
          assignmentRepository.getList({ per_page: 1, status: "ASSIGNED" }),
          assignmentRepository.getList({ per_page: 1, status: "SUBMITTED" }),
          assignmentRepository.getList({ per_page: 1, status: "REVIEWED" }),
        ]);

      setData(listRes.data || []);
      setMeta(listRes.meta || DEFAULT_META);
      setStats({
        total: statsTotal.meta?.total || 0,
        assigned: statsAssigned.meta?.total || 0,
        submitted: statsSubmitted.meta?.total || 0,
        reviewed: statsReviewed.meta?.total || 0,
      });
    } catch (e: any) {
      toast.error(e.message || "Gagal memuat data tugas");
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

  return <AssignmentListClient data={data} meta={meta} stats={stats} loading={loading} />;
}
