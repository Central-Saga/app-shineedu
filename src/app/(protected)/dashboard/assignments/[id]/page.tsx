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
import { ArrowLeft, User, Calendar, BookOpen, XCircle, Pencil } from "lucide-react";

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <PageHeader
            title={data.title}
            description="Detail tugas dan submission"
          />
        </div>
        {data.status !== "CLOSED" && (
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/assignments/${data.id}/edit`)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit Tugas
          </Button>
        )}
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

          {/* Attachment Section */}
          {data.attachment_type && data.attachment_type !== "NONE" && (
            <div>
              <strong className="text-sm">Lampiran:</strong>
              {data.attachment_type === "FILE" && data.attachment_url && (
                <div className="mt-2 p-3 border rounded-lg bg-muted/50">
                  <a
                    href={data.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-2"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {data.attachment_url.split('/').pop() || 'Download File'}
                  </a>
                </div>
              )}
              {data.attachment_type === "URL" && data.attachment_url && (
                <div className="mt-2 p-3 border rounded-lg bg-muted/50">
                  <a
                    href={data.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-2"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    {data.attachment_url}
                  </a>
                </div>
              )}
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
