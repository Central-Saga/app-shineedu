"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { JobApplicationEditForm } from "@/modules/job-application/presentation/components/JobApplicationEditForm";
import { getJobApplicationDetail } from "@/modules/job-application/infrastructure/job-application.repository";
import type { JobApplication } from "@/modules/job-application/domain/entities";
import { toast } from "sonner";

export default function JobApplicationEditPage() {
  const { allowed } = usePermissionGuard("job_application.update");
  const { setItems } = useBreadcrumbStore();
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<JobApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const id = Number(params.id);

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Job Applications", href: "/job-applications" },
      { label: "Detail Lamaran", href: `/job-applications/${id}` },
      { label: "Edit" },
    ]);
  }, [setItems, id]);

  useEffect(() => {
    if (!allowed) return;
    if (!id || Number.isNaN(id)) return;
    getJobApplicationDetail(id)
      .then(setData)
      .catch(() => {
        toast.error("Gagal memuat data lamaran");
        router.push("/job-applications");
      })
      .finally(() => setLoading(false));
  }, [allowed, id, router]);

  if (!allowed || loading) return null;

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Edit Lamaran"
        description="Ubah status atau data lamaran kerja"
      />
      {data && <JobApplicationEditForm initialData={data} />}
    </div>
  );
}
