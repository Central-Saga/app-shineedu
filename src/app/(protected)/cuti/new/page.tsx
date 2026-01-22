
"use client";

import { useEffect } from "react";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { CutiForm } from "@/modules/cuti/presentation/components/CutiForm";

export default function CutiNewPage() {
  const { allowed } = usePermissionGuard("cuti.create");
  const { setItems } = useBreadcrumbStore();

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Cuti", href: "/cuti" },
      { label: "Ajukan Cuti" },
    ]);
  }, [setItems]);

  if (!allowed) return null;

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Ajukan Cuti"
        description="Buat pengajuan cuti atau izin baru"
      />
      <CutiForm />
    </div>
  );
}
