"use client";

import { useEffect, useState } from "react";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { ProgramForm } from "@/modules/catalog/presentation/components/ProgramForm";
import { listJenjang } from "@/modules/catalog/infrastructure/catalog.repository";
import type { Jenjang } from "@/modules/catalog/domain/entities";

export default function CreateProgramPage() {
  const { setItems } = useBreadcrumbStore();
  const [jenjangs, setJenjangs] = useState<Jenjang[]>([]);

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Catalog" },
      { label: "Program", href: "/dashboard/catalog/program" },
      { label: "Tambah" },
    ]);
    
    // Fetch options
    listJenjang({ per_page: 999, status: "Aktif" }).then(res => setJenjangs(res.items));
  }, [setItems]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tambah Program"
        description="Buat data program baru"
      />
      <div className="max-w-2xl">
        <ProgramForm mode="create" jenjangOptions={jenjangs} />
      </div>
    </div>
  );
}
