"use client";

import { useEffect } from "react";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { MateriModulForm } from "@/modules/learning/presentation/components/MateriModulForm";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";

export default function CreateMateriModulPage() {
  const { setItems } = useBreadcrumbStore();

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Materi Modul", href: "/dashboard/materi-modul" },
      { label: "Buat Modul" },
    ]);
  }, [setItems]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buat Materi Modul"
        description="Buat materi pembelajaran baru"
      />
      <MateriModulForm />
    </div>
  );
}
