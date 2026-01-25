"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { MuridForm } from "@/modules/murid/presentation/components/MuridForm";
import { createMurid } from "@/modules/murid/infrastructure/murid.repository";
import { toast } from "sonner";
import { listJenjang } from "@/modules/catalog/infrastructure/catalog.repository";

export default function CreateMuridPage() {
  const { allowed } = usePermissionGuard("student.create");
  const router = useRouter();
  const { setItems } = useBreadcrumbStore();
  const [loading, setLoading] = useState(false);
  const [jenjangList, setJenjangList] = useState<{ id: number; nama: string }[]>([]);

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Murid", href: "/dashboard/murid" },
      { label: "Tambah Murid" },
    ]);
  }, [setItems]);

  useEffect(() => {
    if (allowed) {
        listJenjang({ per_page: 100 }).then(res => {
            setJenjangList(res.items.map(j => ({ id: j.id, nama: `${j.nama} (${j.kode})` })));
        }).catch(() => toast.error("Gagal memuat data jenjang"));
    }
  }, [allowed]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      await createMurid(values);
      toast.success("Murid berhasil ditambahkan");
      router.push("/dashboard/murid");
    } catch (e: any) {
      toast.error(e.message || "Gagal menambahkan murid");
    } finally {
      setLoading(false);
    }
  };

  if (!allowed) return null;

  return (
    <div>
      <PageHeader title="Tambah Murid" description="Formulir pendaftaran murid baru" />
      <div className="mt-6">
        <MuridForm mode="create" onSubmit={handleSubmit} isLoading={loading} jenjangOptions={jenjangList} />
      </div>
    </div>
  );
}
