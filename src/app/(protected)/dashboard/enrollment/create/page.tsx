"use client";

import { useEffect } from "react";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard"; // Verify path or use hook
import { EnrollmentForm } from "@/modules/enrollment/presentation/components/EnrollmentForm";

export default function CreateEnrollmentPage() {
  const { allowed } = usePermissionGuard("enrollment.create");
  const { setItems } = useBreadcrumbStore();

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Enrollment", href: "/dashboard/enrollment" },
      { label: "Buat Enrollment" },
    ]);
  }, [setItems]);

  if (!allowed) return null; // Hook handles redirect

  return (
    <div>
      <PageHeader 
        title="Buat Enrollment Baru" 
        description="Mendaftarkan siswa ke program/jenjang/paket tertentu." 
      />
      <div className="mt-6">
        <EnrollmentForm />
      </div>
    </div>
  );
}
