"use client";

import { useEffect } from "react";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { AssignmentForm } from "@/modules/learning/presentation/components/AssignmentForm";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";

export default function CreateAssignmentPage() {
  const { setItems } = useBreadcrumbStore();

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Tugas", href: "/dashboard/assignments" },
      { label: "Buat Tugas" },
    ]);
  }, [setItems]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buat Tugas"
        description="Berikan tugas baru kepada murid"
      />
      <AssignmentForm />
    </div>
  );
}
