"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { MateriModulForm } from "@/modules/learning/presentation/components/MateriModulForm";
import { MateriItemEditor } from "@/modules/learning/presentation/components/MateriItemEditor";
import { materiRepository } from "@/modules/learning/infrastructure/materi.repository";
import type { MateriModul } from "@/modules/learning/domain/entities";
import { Skeleton } from "@/components/ui/skeleton";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";

export default function EditMateriModulPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { setItems } = useBreadcrumbStore();

  const [data, setData] = useState<MateriModul | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const result = await materiRepository.getById(id);
      setData(result);
      
      // Set breadcrumb with module title
      setItems([
        { label: "Dashboard", href: "/dashboard" },
        { label: "Materi Modul", href: "/dashboard/materi-modul" },
        { label: result.title },
      ]);
    } catch {
      toast.error("Gagal memuat data materi modul");
      router.push("/dashboard/materi-modul");
    } finally {
      setLoading(false);
    }
  }, [id, router, setItems]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-[300px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Materi Modul"
        description={`Mengedit: ${data.title}`}
      />
      
      <MateriModulForm initialData={data} isEdit />
      
      <MateriItemEditor
        modulId={data.id}
        items={data.items || []}
        onItemsChange={fetchData}
      />
    </div>
  );
}
