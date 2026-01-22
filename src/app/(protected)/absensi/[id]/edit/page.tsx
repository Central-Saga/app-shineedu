
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { AbsensiForm } from "@/modules/absensi/presentation/components/AbsensiForm";
import { getAbsensiDetail } from "@/modules/absensi/infrastructure/absensi.repository";
import type { Absensi } from "@/modules/absensi/domain/entities";
import { toast } from "sonner";

export default function AbsensiEditPage() {
  const { allowed } = usePermissionGuard("absensi.update");
  const { setItems } = useBreadcrumbStore();
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<Absensi | null>(null);
  const [loading, setLoading] = useState(true);

  const id = Number(params.id);

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Absensi", href: "/absensi" },
      { label: "Edit Absensi" },
    ]);
  }, [setItems]);

  useEffect(() => {
    if (!allowed) return;
    if (!id) return;
    
    getAbsensiDetail(id)
      .then((res) => setData(res))
      .catch((e) => {
        toast.error("Gagal memuat data absensi");
        router.push("/absensi");
      })
      .finally(() => setLoading(false));
  }, [allowed, id, router]);

  if (!allowed || loading) return null; // Or skeleton

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Edit Absensi"
        description="Perbarui data kehadiran karyawan"
      />
      {data && <AbsensiForm initialData={data} isEdit />}
    </div>
  );
}
