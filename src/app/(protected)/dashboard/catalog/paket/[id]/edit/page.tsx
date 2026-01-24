"use client";

import { useEffect, useState } from "react";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { PaketForm } from "@/modules/catalog/presentation/components/PaketForm";
import { getPaket } from "@/modules/catalog/infrastructure/catalog.repository";
import type { Paket } from "@/modules/catalog/domain/entities";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  params: { id: string };
}

export default function EditPaketPage({ params }: Props) {
  const { setItems } = useBreadcrumbStore();
  const [data, setData] = useState<Paket | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Catalog" },
      { label: "Paket", href: "/dashboard/catalog/paket" },
      { label: "Edit" },
    ]);

    getPaket(Number(params.id))
      .then(setData)
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
        title="Edit Paket"
        description={`Ubah data paket ${data?.kode}`}
      />
      <div className="max-w-2xl">
        <PaketForm mode="edit" initialData={data} />
      </div>
    </div>
  );
}
