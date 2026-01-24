"use client";

import { useEffect } from "react";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { JenjangForm } from "@/modules/catalog/presentation/components/JenjangForm";

export default function CreateJenjangPage() {
  const { setItems } = useBreadcrumbStore();

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Catalog" },
      { label: "Jenjang", href: "/dashboard/catalog/jenjang" },
      { label: "Tambah" },
    ]);
  }, [setItems]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tambah Jenjang"
        description="Buat data jenjang baru"
      />
      <div className="max-w-2xl">
        <JenjangForm mode="create" />
      </div>
    </div>
  );
}
