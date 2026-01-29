"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getJobApplicationDetail } from "@/modules/job-application/infrastructure/job-application.repository";
import type { JobApplication } from "@/modules/job-application/domain/entities";
import { NotFoundError } from "@/shared/infrastructure/api/errors";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  FileText,
  User,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { authStore } from "@/modules/auth/infrastructure/auth.store";

const EXPERIENCE_LABELS: Record<string, string> = {
  "fresh-graduate": "Fresh Graduate",
  "1-2": "1-2 tahun",
  "3-5": "3-5 tahun",
  "5-10": "5-10 tahun",
  "10+": "Lebih dari 10 tahun",
};

const EDUCATION_LABELS: Record<string, string> = {
  sma: "SMA/SMK/Sederajat",
  d3: "Diploma (D3)",
  s1: "Sarjana (S1)",
  s2: "Magister (S2)",
  s3: "Doktor (S3)",
};

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 border-b py-3 last:border-0">
      <div className="mt-0.5 shrink-0 rounded-lg bg-secondary p-2 text-secondary-foreground">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 text-xs font-medium text-muted-foreground">
          {label}
        </p>
        <div className="truncate text-sm font-semibold text-foreground">
          {value ?? "-"}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    reviewed: "bg-blue-100 text-blue-700 border-blue-200",
    shortlisted: "bg-emerald-100 text-emerald-700 border-emerald-200",
    rejected: "bg-red-100 text-red-700 border-red-200",
    hired: "bg-green-100 text-green-700 border-green-200",
  };
  return (
    <Badge
      variant="outline"
      className={styles[status] ?? "bg-muted text-muted-foreground"}
    >
      {status}
    </Badge>
  );
}

export default function JobApplicationDetailPage() {
  const { allowed } = usePermissionGuard("job_application.view");
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [data, setData] = useState<JobApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const { setItems } = useBreadcrumbStore();

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Job Applications", href: "/job-applications" },
      { label: "Detail Lamaran" },
    ]);
  }, [setItems]);

  const fetchData = useCallback(async () => {
    try {
      const res = await getJobApplicationDetail(id);
      setData(res);
    } catch (e) {
      if (e instanceof NotFoundError) {
        toast.error("Lamaran tidak ditemukan");
        router.replace("/job-applications");
      } else {
        toast.error("Gagal memuat data lamaran");
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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-lg" />
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-64 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const canUpdate = authStore.hasPermission("job_application.update");

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
            <h1 className="text-2xl font-bold tracking-tight">
              {data.first_name} {data.last_name}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <StatusBadge status={data.status} />
              {data.tracking_code && (
                <Badge variant="secondary" className="font-mono text-[10px]">
                  {data.tracking_code}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {data.resume_url && (
            <Button asChild variant="outline" size="sm">
              <a
                href={data.resume_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2"
              >
                <FileText className="size-4" />
                CV
              </a>
            </Button>
          )}
          {canUpdate && (
            <Button
              variant="default"
              size="sm"
              onClick={() => router.push(`/job-applications/${id}/edit`)}
            >
              Edit
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <div className="mb-4 flex flex-col items-center border-b pb-6 text-center">
                <div className="mb-4 flex size-20 items-center justify-center rounded-full border bg-slate-50 text-slate-300">
                  <User className="size-10" />
                </div>
                <h2 className="text-xl font-bold">
                  {data.first_name} {data.last_name}
                </h2>
                <p className="mt-1 text-sm font-medium text-muted-foreground">
                  {data.email}
                </p>
                <p className="text-sm text-muted-foreground">{data.phone}</p>
              </div>
              <div className="space-y-1">
                <DetailItem icon={Mail} label="Email" value={data.email} />
                <DetailItem icon={Phone} label="Telepon" value={data.phone} />
                <DetailItem
                  icon={MapPin}
                  label="Alamat"
                  value={data.address || "-"}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="border-b py-4">
              <CardTitle className="flex items-center gap-2 text-sm font-bold">
                <Briefcase className="size-4" /> Posisi & Kualifikasi
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid gap-x-12 gap-y-1 md:grid-cols-2">
                <DetailItem
                  icon={Briefcase}
                  label="Posisi"
                  value={
                    data.position?.title
                      ? `${data.position.title} - ${data.position.location}`
                      : `Posisi #${data.position_id}`
                  }
                />
                <DetailItem
                  icon={GraduationCap}
                  label="Pengalaman"
                  value={EXPERIENCE_LABELS[data.experience] ?? data.experience}
                />
                <DetailItem
                  icon={GraduationCap}
                  label="Pendidikan"
                  value={EDUCATION_LABELS[data.education] ?? data.education}
                />
                <DetailItem
                  icon={Calendar}
                  label="Tanggal Lamar"
                  value={
                    data.created_at
                      ? format(new Date(data.created_at), "dd MMMM yyyy", {
                          locale: idLocale,
                        })
                      : "-"
                  }
                />
              </div>
            </CardContent>
          </Card>

          {data.cover_letter_url && (
            <Card>
              <CardHeader className="border-b py-4">
                <CardTitle className="flex items-center gap-2 text-sm font-bold">
                  <FileText className="size-4" /> Surat Lamaran
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <Button asChild variant="outline" className="w-full">
                  <a
                    href={data.cover_letter_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="mr-2 size-4" />
                    Buka dokumen
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
