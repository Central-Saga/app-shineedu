"use client";

import { useEffect } from "react";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { MuridBulkImport } from "@/modules/murid/presentation/components/MuridBulkImport";

export default function BulkImportMuridPage() {
  const { allowed } = usePermissionGuard("student.create");
  const { setItems } = useBreadcrumbStore();

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Murid", href: "/dashboard/murid" },
      { label: "Bulk Import" },
    ]);
  }, [setItems]);

  if (!allowed) return null;

  return (
    <div>
      <PageHeader
        title="Bulk Import Murid"
        description="Import data murid dari file CSV"
      />
      <div className="mt-6">
        <MuridBulkImport />
      </div>
    </div>
  );
}
