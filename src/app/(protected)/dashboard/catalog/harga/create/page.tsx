"use client";

import { useEffect, useState } from "react";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { PaketHargaForm } from "@/modules/catalog/presentation/components/PaketHargaForm";
import { listJenjang, listProgram, listPaket } from "@/modules/catalog/infrastructure/catalog.repository";
import type { Jenjang, Program, Paket } from "@/modules/catalog/domain/entities";

export default function CreatePaketHargaPage() {
  const { setItems } = useBreadcrumbStore();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [jenjangs, setJenjangs] = useState<Jenjang[]>([]);
  const [pakets, setPakets] = useState<Paket[]>([]);

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Catalog" },
      { label: "Harga Paket", href: "/dashboard/catalog/harga" },
      { label: "Tambah" },
    ]);
    
    // Fetch all options
    Promise.all([
        listProgram({ per_page: 999, status: "Aktif" }),
        listJenjang({ per_page: 999, status: "Aktif" }),
        listPaket({ per_page: 999, status: "Aktif" })
    ]).then(([p, j, pk]) => {
        setPrograms(p.items);
        setJenjangs(j.items);
        setPakets(pk.items);
    });
  }, [setItems]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tambah Harga Paket"
        description="Buat aturan harga baru"
      />
      <div className="w-full">
        <PaketHargaForm 
            mode="create" 
            programs={programs}
            jenjangs={jenjangs}
            pakets={pakets}
        />
      </div>
    </div>
  );
}
