"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, DueBadge } from "@/modules/learning/presentation/components/StatusBadge";
import { assignmentRepository } from "@/modules/learning/infrastructure/assignment.repository";
import type { Assignment } from "@/modules/learning/domain/entities";
import type { PaginatedMeta } from "@/shared/domain/types";
import { ClipboardList, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyAssignmentsPage() {
  const router = useRouter();
  const [data, setData] = useState<Assignment[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await assignmentRepository.getList({ page, per_page: 20 });
      setData(result.data);
      setMeta(result.meta);
    } catch (error) {
      toast.error("Gagal memuat daftar tugas");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tugas Saya"
        description="Daftar tugas yang diberikan oleh guru"
      />

      {data.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ClipboardList className="h-12 w-12" />
              <p className="text-lg font-medium">Belum ada tugas</p>
              <p className="text-sm">Tugas dari guru akan muncul di sini</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {data.map((item) => (
            <Card
              key={item.id}
              className="hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => router.push(`/my/assignments/${item.id}`)}
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">{item.title}</h3>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {item.sesi?.tanggal && (
                        <span>
                          Sesi: {new Date(item.sesi.tanggal).toLocaleDateString("id-ID")}
                        </span>
                      )}
                      <DueBadge dueAt={item.due_at} isOverdue={item.is_overdue} />
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {meta && meta.last_page > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Sebelumnya
          </Button>
          <span className="flex items-center px-4 text-sm">
            {page} / {meta.last_page}
          </span>
          <Button
            variant="outline"
            disabled={page === meta.last_page}
            onClick={() => setPage((p) => p + 1)}
          >
            Selanjutnya
          </Button>
        </div>
      )}
    </div>
  );
}
