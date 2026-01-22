
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { CutiForm } from "@/modules/cuti/presentation/components/CutiForm";
import { getCutiDetail } from "@/modules/cuti/infrastructure/cuti.repository";
import type { Cuti } from "@/modules/cuti/domain/entities";
import { toast } from "sonner";

export default function CutiEditPage() {
  const { allowed } = usePermissionGuard("cuti.view"); // View permission needed to see page, Form handles update permission
  const { setItems } = useBreadcrumbStore();
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<Cuti | null>(null);
  const [loading, setLoading] = useState(true);

  const id = Number(params.id);

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Cuti", href: "/cuti" },
      { label: "Detail Pengajuan" },
    ]);
  }, [setItems]);

  useEffect(() => {
    if (!allowed) return;
    if (!id) return;

    getCutiDetail(id)
      .then((res) => setData(res))
      .catch((e) => {
        toast.error("Gagal memuat data cuti");
        router.push("/cuti");
      })
      .finally(() => setLoading(false));
  }, [allowed, id, router]);

  if (!allowed || loading) return null;

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Detail Pengajuan"
        description="Lihat atau edit pengajuan cuti"
      />
      {data && <CutiForm initialData={data} isEdit />}
    </div>
  );
}
