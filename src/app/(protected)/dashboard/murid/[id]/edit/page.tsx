"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { MuridForm } from "@/modules/murid/presentation/components/MuridForm";
import { updateMurid, getMurid } from "@/modules/murid/infrastructure/murid.repository";
import { toast } from "sonner";
import { listJenjang } from "@/modules/catalog/infrastructure/catalog.repository";
import type { Murid } from "@/modules/murid/domain/entities";

export default function EditMuridPage({ params }: { params: Promise<{ id: string }> }) {
  const { allowed } = usePermissionGuard("student.update");
  const router = useRouter();
  const { setItems } = useBreadcrumbStore();
  const [loading, setLoading] = useState(false);
  const [murid, setMurid] = useState<Murid | null>(null);
  const [jenjangList, setJenjangList] = useState<{ id: number; nama: string }[]>([]);
  const resolvedParams = use(params);
  const id = Number(resolvedParams.id);

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Murid", href: "/dashboard/murid" },
      { label: "Edit Murid" },
    ]);
  }, [setItems]);

  useEffect(() => {
    if (allowed) {
        Promise.all([
            getMurid(id),
            listJenjang({ per_page: 100 })
        ]).then(([m, j]) => {
            setMurid(m);
            setJenjangList(j.items.map(item => ({ id: item.id, nama: `${item.nama} (${item.kode})` })));
        }).catch(() => {
            toast.error("Gagal memuat data");
            router.push("/dashboard/murid");
        });
    }
  }, [allowed, id, router]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      await updateMurid(id, values);
      toast.success("Data murid berhasil diperbarui");
      router.push("/dashboard/murid");
    } catch (e: any) {
      toast.error(e.message || "Gagal memperbarui data murid");
    } finally {
      setLoading(false);
    }
  };

  if (!allowed || !murid) return null;

  return (
    <div>
      <PageHeader title="Edit Murid" description="Perbarui data murid" />
      <div className="mt-6">
        <MuridForm 
            mode="edit"
            initialData={{
                ...murid,
                jenjang_id: murid.jenjang_id,
                tanggal_lahir: murid.tanggal_lahir,
            } as any} 
            onSubmit={handleSubmit} 
            isLoading={loading} 
            jenjangOptions={jenjangList} 
        />
      </div>
    </div>
  );
}
