"use client";

import { useEffect, useState, use } from "react";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { JenjangForm } from "@/modules/catalog/presentation/components/JenjangForm";
import { getJenjang } from "@/modules/catalog/infrastructure/catalog.repository";
import type { Jenjang } from "@/modules/catalog/domain/entities";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditJenjangPage({ params }: Props) {
  const { id } = use(params);
  const { setItems } = useBreadcrumbStore();
  const [data, setData] = useState<Jenjang | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  // Unwrapping params for Next.js 15+ if needed, but standard prop access usually works 
  // or use `useParams` hook if this was a purely client component from route
  // treating `params` as prop is fine for page component.

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Catalog" },
      { label: "Jenjang", href: "/dashboard/catalog/jenjang" },
      { label: "Edit" },
    ]);

    getJenjang(Number(id))
      .then(setData)
      .catch((err) => toast.error("Gagal memuat data"))
      .finally(() => setLoading(false));
  }, [setItems, id]);

  if (loading) {
      return <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-[400px] w-full" />
      </div>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Jenjang"
        description={`Ubah data jenjang ${data?.kode}`}
      />
      <div className="w-full">
        <JenjangForm mode="edit" initialData={data} />
      </div>
    </div>
  );
}
