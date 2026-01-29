"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getJobVacancyDetail } from "@/modules/job-vacancy/infrastructure/job-vacancy.repository";
import type { JobVacancy } from "@/modules/job-vacancy/domain/entities";
import { NotFoundError } from "@/shared/infrastructure/api/errors";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { ArrowLeft, MapPin, Briefcase, Calendar, Pencil } from "lucide-react";
import { authStore } from "@/modules/auth/infrastructure/auth.store";

export default function JobVacancyDetailPage() {
  const { allowed } = usePermissionGuard("job_vacancy.view");
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [data, setData] = useState<JobVacancy | null>(null);
  const [loading, setLoading] = useState(true);
  const { setItems } = useBreadcrumbStore();

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Lowongan Kerja", href: "/job-vacancies" },
      { label: "Detail Lowongan" },
    ]);
  }, [setItems]);

  const fetchData = useCallback(async () => {
    try {
      const res = await getJobVacancyDetail(id);
      setData(res);
    } catch (e) {
      if (e instanceof NotFoundError) {
        toast.error("Lowongan tidak ditemukan");
        router.replace("/job-vacancies");
      } else {
        toast.error("Gagal memuat data lowongan");
      }
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (!allowed || !id || Number.isNaN(id)) return;
    fetchData();
  }, [allowed, id, fetchData]);

  if (!allowed) return null;

  if (loading && !data) {
    return (
      <div className="w-full animate-pulse space-y-6">
        <div className="mb-8 flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  if (!data) return null;

  const canUpdate = authStore.hasPermission("job_vacancy.update");
  const requirements = Array.isArray(data.requirements) ? data.requirements : [];
  const responsibilities = Array.isArray(data.responsibilities) ? data.responsibilities : [];
  const benefits = Array.isArray(data.benefits) ? data.benefits : [];

  return (
    <div className="w-full space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="h-9 w-9"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight">{data.title}</h1>
            <div className="mt-1 flex items-center gap-2">
              {data.employment_type && (
                <Badge variant="outline">{data.employment_type}</Badge>
              )}
              <Badge variant={data.is_active ? "default" : "secondary"} className={data.is_active ? "bg-emerald-600" : ""}>
                {data.is_active ? "Aktif" : "Nonaktif"}
              </Badge>
            </div>
          </div>
        </div>
        {canUpdate && (
          <Button
            variant="default"
            size="sm"
            onClick={() => router.push(`/job-vacancies/${id}/edit`)}
          >
            <Pencil className="mr-2 size-4" /> Edit
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4 text-muted-foreground text-sm">
        {data.location && (
          <span className="flex items-center gap-1">
            <MapPin className="size-4" /> {data.location}
          </span>
        )}
        {data.posted_at && (
          <span className="flex items-center gap-1">
            <Calendar className="size-4" /> Dibuka:{" "}
            {format(new Date(data.posted_at), "dd MMMM yyyy", { locale: idLocale })}
          </span>
        )}
        {data.end_at && (
          <span className="flex items-center gap-1">
            Ditutup: {format(new Date(data.end_at), "dd MMMM yyyy", { locale: idLocale })}
          </span>
        )}
      </div>

      <div className="space-y-6">
        {data.description && (
          <Card>
            <CardHeader className="border-b py-4">
              <CardTitle className="flex items-center gap-2 text-base text-primary">
                <Briefcase className="size-4" /> Deskripsi Pekerjaan
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-muted-foreground whitespace-pre-wrap">{data.description}</p>
            </CardContent>
          </Card>
        )}

        {requirements.length > 0 && (
          <Card>
            <CardHeader className="border-b py-4">
              <CardTitle className="text-base text-primary">Kualifikasi</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                {requirements.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {responsibilities.length > 0 && (
          <Card>
            <CardHeader className="border-b py-4">
              <CardTitle className="text-base text-primary">Tanggung Jawab</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                {responsibilities.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {benefits.length > 0 && (
          <Card>
            <CardHeader className="border-b py-4">
              <CardTitle className="text-base text-primary">Benefit</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                {benefits.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
