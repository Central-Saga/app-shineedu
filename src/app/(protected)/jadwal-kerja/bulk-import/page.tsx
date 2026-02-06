"use client";

import { useEffect } from "react";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { JadwalKerjaBulkImport } from "@/modules/jadwal-kerja/presentation/components/JadwalKerjaBulkImport";

export default function BulkImportJadwalKerjaPage() {
  const { allowed } = usePermissionGuard("jadwal_kerja.create");
  const { setItems } = useBreadcrumbStore();

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Jadwal Kerja", href: "/jadwal-kerja" },
      { label: "Bulk Import" },
    ]);
  }, [setItems]);

  if (!allowed) return null;

  return (
    <div>
      <PageHeader
        title="Bulk Import Jadwal Kerja"
        description="Import jadwal kerja dari file CSV"
      />
      <div className="mt-6">
        <JadwalKerjaBulkImport />
      </div>
    </div>
  );
}
