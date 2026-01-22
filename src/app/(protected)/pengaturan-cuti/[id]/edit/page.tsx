
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { PengaturanCutiForm } from "@/modules/pengaturan-cuti/presentation/components/PengaturanCutiForm";
import { getPengaturanCutiDetail } from "@/modules/pengaturan-cuti/infrastructure/pengaturan-cuti.repository";
import type { PengaturanCuti } from "@/modules/pengaturan-cuti/domain/entities";
import { toast } from "sonner";

export default function PengaturanCutiEditPage() {
  const { allowed } = usePermissionGuard("pengaturan_cuti.update");
  const { setItems } = useBreadcrumbStore();
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<PengaturanCuti | null>(null);
  const [loading, setLoading] = useState(true);

  const id = Number(params.id);

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Pengaturan Cuti", href: "/pengaturan-cuti" },
      { label: "Edit Aturan" },
    ]);
  }, [setItems]);

  useEffect(() => {
    if (!allowed) return;
    if (!id) return;

    getPengaturanCutiDetail(id)
      .then((res) => setData(res))
      .catch((e) => {
        toast.error("Gagal memuat aturan");
        router.push("/pengaturan-cuti");
      })
      .finally(() => setLoading(false));
  }, [allowed, id, router]);

  if (!allowed || loading) return null;

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Edit Aturan"
        description="Perbarui aturan cuti"
      />
      {data && <PengaturanCutiForm initialData={data} isEdit />}
    </div>
  );
}
