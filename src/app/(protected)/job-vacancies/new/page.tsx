"use client";

import { useEffect } from "react";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { JobVacancyForm } from "@/modules/job-vacancy/presentation/components/JobVacancyForm";

export default function JobVacancyNewPage() {
  const { allowed } = usePermissionGuard("job_vacancy.create");
  const { setItems } = useBreadcrumbStore();

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Lowongan Kerja", href: "/job-vacancies" },
      { label: "Tambah Lowongan" },
    ]);
  }, [setItems]);

  if (!allowed) return null;

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Tambah Lowongan"
        description="Buat lowongan kerja baru (deskripsi, kualifikasi, tanggung jawab, benefit)"
      />
      <JobVacancyForm />
    </div>
  );
}
