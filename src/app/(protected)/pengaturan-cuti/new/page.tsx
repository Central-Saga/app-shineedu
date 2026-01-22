
"use client";

import { useEffect } from "react";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { PengaturanCutiForm } from "@/modules/pengaturan-cuti/presentation/components/PengaturanCutiForm";

export default function PengaturanCutiNewPage() {
  const { allowed } = usePermissionGuard("pengaturan_cuti.create");
  const { setItems } = useBreadcrumbStore();

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Pengaturan Cuti", href: "/pengaturan-cuti" },
      { label: "Tambah Aturan" },
    ]);
  }, [setItems]);

  if (!allowed) return null;

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Tambah Aturan"
        description="Buat aturan cuti baru"
      />
      <PengaturanCutiForm />
    </div>
  );
}
