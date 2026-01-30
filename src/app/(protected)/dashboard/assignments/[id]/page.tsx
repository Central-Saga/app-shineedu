"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, DueBadge } from "@/modules/learning/presentation/components/StatusBadge";
import { SubmissionList } from "@/modules/learning/presentation/components/SubmissionList";
import { assignmentRepository } from "@/modules/learning/infrastructure/assignment.repository";
import type { Assignment } from "@/modules/learning/domain/entities";
import { ArrowLeft, User, Calendar, BookOpen, XCircle } from "lucide-react";

export default function AssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [data, setData] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);

  const fetchData = async () => {
    try {
      const result = await assignmentRepository.getById(id);
      setData(result);
    } catch (error) {
      toast.error("Gagal memuat data tugas");
      router.push("/dashboard/assignments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleClose = async () => {
    if (!data) return;
    setClosing(true);
    try {
      await assignmentRepository.close(data.id);
      toast.success("Tugas berhasil ditutup");
      fetchData();
    } catch (error) {
      toast.error("Gagal menutup tugas");
    } finally {
      setClosing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title={data.title}
          description="Detail tugas dan submission"
        />
      </div>

      {/* Assignment Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Informasi Tugas</CardTitle>
            <StatusBadge status={data.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <strong>Murid:</strong>{" "}
                {data.enrollment?.murid?.nama_lengkap || "-"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <strong>Due:</strong>{" "}
                <DueBadge dueAt={data.due_at} isOverdue={data.is_overdue} />
              </span>
            </div>
            {data.materi_modul && (
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <strong>Materi:</strong> {data.materi_modul.title}
                </span>
              </div>
            )}
          </div>

          {data.instructions && (
            <div>
              <strong className="text-sm">Instruksi:</strong>
              <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                {data.instructions}
              </p>
            </div>
          )}

          {data.status !== "CLOSED" && (
            <div className="flex justify-end">
              <Button
                variant="destructive"
                onClick={handleClose}
                disabled={closing}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Tutup Tugas
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submissions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Submissions ({data.submissions?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SubmissionList
            submissions={data.submissions || []}
            onReviewSuccess={fetchData}
          />
        </CardContent>
      </Card>
    </div>
  );
}
