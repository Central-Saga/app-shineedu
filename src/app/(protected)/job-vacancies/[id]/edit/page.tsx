"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { JobVacancyForm } from "@/modules/job-vacancy/presentation/components/JobVacancyForm";
import { getJobVacancyDetail } from "@/modules/job-vacancy/infrastructure/job-vacancy.repository";
import type { JobVacancy } from "@/modules/job-vacancy/domain/entities";
import { toast } from "sonner";

export default function JobVacancyEditPage() {
  const { allowed } = usePermissionGuard("job_vacancy.update");
  const { setItems } = useBreadcrumbStore();
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<JobVacancy | null>(null);
  const [loading, setLoading] = useState(true);
  const id = Number(params.id);

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Lowongan Kerja", href: "/job-vacancies" },
      { label: "Detail", href: `/job-vacancies/${id}` },
      { label: "Edit" },
    ]);
  }, [setItems, id]);

  useEffect(() => {
    if (!allowed) return;
    if (!id || Number.isNaN(id)) return;
    getJobVacancyDetail(id)
      .then(setData)
      .catch(() => {
        toast.error("Gagal memuat data lowongan");
        router.push("/job-vacancies");
      })
      .finally(() => setLoading(false));
  }, [allowed, id, router]);

  if (!allowed || loading) return null;

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Edit Lowongan"
        description="Ubah deskripsi, kualifikasi, tanggung jawab, dan benefit"
      />
      {data && <JobVacancyForm initialData={data} isEdit />}
    </div>
  );
}
