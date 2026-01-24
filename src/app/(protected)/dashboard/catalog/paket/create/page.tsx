"use client";

import { useEffect } from "react";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { PaketForm } from "@/modules/catalog/presentation/components/PaketForm";

export default function CreatePaketPage() {
  const { setItems } = useBreadcrumbStore();

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Catalog" },
      { label: "Paket", href: "/dashboard/catalog/paket" },
      { label: "Tambah" },
    ]);
  }, [setItems]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tambah Paket"
        description="Buat data paket baru"
      />
      <div className="max-w-2xl">
        <PaketForm mode="create" />
      </div>
    </div>
  );
}
