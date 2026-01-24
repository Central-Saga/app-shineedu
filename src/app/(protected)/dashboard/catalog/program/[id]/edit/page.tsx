"use client";

import { useEffect, useState } from "react";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { ProgramForm } from "@/modules/catalog/presentation/components/ProgramForm";
import { getProgram, listJenjang } from "@/modules/catalog/infrastructure/catalog.repository";
import type { Program, Jenjang } from "@/modules/catalog/domain/entities";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  params: { id: string };
}

export default function EditProgramPage({ params }: Props) {
  const { setItems } = useBreadcrumbStore();
  const [data, setData] = useState<Program | undefined>(undefined);
  const [jenjangs, setJenjangs] = useState<Jenjang[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Catalog" },
      { label: "Program", href: "/dashboard/catalog/program" },
      { label: "Edit" },
    ]);

    Promise.all([
        getProgram(Number(params.id)),
        listJenjang({ per_page: 999, status: "Aktif" })
    ])
      .then(([program, jenjangList]) => {
          setData(program);
          setJenjangs(jenjangList.items);
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
        title="Edit Program"
        description={`Ubah data program ${data?.kode}`}
      />
      <div className="max-w-2xl">
        <ProgramForm mode="edit" initialData={data} jenjangOptions={jenjangs} />
      </div>
    </div>
  );
}
