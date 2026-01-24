"use client";

import { useEffect, useState } from "react";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { PaketHargaForm } from "@/modules/catalog/presentation/components/PaketHargaForm";
import { getPaketHarga, listJenjang, listProgram, listPaket } from "@/modules/catalog/infrastructure/catalog.repository";
import type { PaketHarga, Program, Jenjang, Paket } from "@/modules/catalog/domain/entities";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  params: { id: string };
}

export default function EditPaketHargaPage({ params }: Props) {
  const { setItems } = useBreadcrumbStore();
  const [data, setData] = useState<PaketHarga | undefined>(undefined);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [jenjangs, setJenjangs] = useState<Jenjang[]>([]);
  const [pakets, setPakets] = useState<Paket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Catalog" },
      { label: "Harga Paket", href: "/dashboard/catalog/harga" },
      { label: "Edit" },
    ]);

    Promise.all([
        getPaketHarga(Number(params.id)),
        listProgram({ per_page: 999 }),
        listJenjang({ per_page: 999 }),
        listPaket({ per_page: 999 })
    ])
      .then(([item, p, j, pk]) => {
          setData(item);
          setPrograms(p.items);
          setJenjangs(j.items);
          setPakets(pk.items);
      })
      .catch((err) => toast.error("Gagal memuat data"))
      .finally(() => setLoading(false));
  }, [setItems, params.id]);

  if (loading) {
     return <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-[400px] max-w-2xl" />
      </div>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Harga Paket"
        description="Ubah aturan harga"
      />
      <div className="max-w-2xl">
        <PaketHargaForm 
            mode="edit" 
            initialData={data} 
            programs={programs}
            jenjangs={jenjangs}
            pakets={pakets}
        />
      </div>
    </div>
  );
}
