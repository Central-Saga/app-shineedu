
"use client";

import { useEffect } from "react";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { AbsensiForm } from "@/modules/absensi/presentation/components/AbsensiForm";

export default function AbsensiNewPage() {
  const { allowed } = usePermissionGuard("absensi.create");
  const { setItems } = useBreadcrumbStore();

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Absensi", href: "/absensi" },
      { label: "Tambah Absensi" },
    ]);
  }, [setItems]);

  if (!allowed) return null;

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Tambah Absensi"
        description="Catat kehadiran karyawan secara manual"
      />
      <AbsensiForm />
    </div>
  );
}
