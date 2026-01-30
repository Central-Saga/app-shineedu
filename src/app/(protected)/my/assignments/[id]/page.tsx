"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, DueBadge } from "@/modules/learning/presentation/components/StatusBadge";
import { SubmissionForm } from "@/modules/learning/presentation/components/SubmissionForm";
import { assignmentRepository } from "@/modules/learning/infrastructure/assignment.repository";
import type { Assignment } from "@/modules/learning/domain/entities";
import { ArrowLeft, Calendar, BookOpen, MessageSquare, Star } from "lucide-react";

export default function MyAssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [data, setData] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const result = await assignmentRepository.getById(id);
      setData(result);
    } catch {
      toast.error("Gagal memuat data tugas");
      router.push("/my/assignments");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const canSubmit = data.status !== "CLOSED" && data.status !== "REVIEWED";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title={data.title} description="Detail tugas" />
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
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <strong>Tenggat:</strong>{" "}
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
        </CardContent>
      </Card>

      {/* Submission Form */}
      {canSubmit && (
        <SubmissionForm assignmentId={data.id} onSuccess={fetchData} />
      )}

      {/* Submission History */}
      {data.submissions && data.submissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Riwayat Pengumpulan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.submissions.map((sub, index) => (
                <div
                  key={sub.id}
                  className="p-4 border rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Pengumpulan #{data.submissions!.length - index}
                    </span>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={sub.status} />
                      {sub.score !== null && (
                        <span className="flex items-center gap-1 text-sm">
                          <Star className="h-4 w-4 text-yellow-500" />
                          {sub.score}
                        </span>
                      )}
                    </div>
                  </div>

                  {sub.content_text && (
                    <div className="text-sm bg-muted/50 p-3 rounded-md">
                      {sub.content_text}
                    </div>
                  )}

                  {sub.attachment_url && (
                    <a
                      href={sub.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      📎 Lihat Lampiran
                    </a>
                  )}

                  {sub.feedback && (
                    <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/50 rounded-md">
                      <MessageSquare className="h-4 w-4 text-blue-500 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                          Feedback dari guru:
                        </p>
                        <p className="text-sm mt-1">{sub.feedback}</p>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Dikirim:{" "}
                    {sub.submitted_at
                      ? new Date(sub.submitted_at).toLocaleString("id-ID")
                      : "-"}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
