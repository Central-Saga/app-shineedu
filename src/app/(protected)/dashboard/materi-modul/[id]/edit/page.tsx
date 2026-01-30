"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { MateriModulForm } from "@/modules/learning/presentation/components/MateriModulForm";
import { materiRepository } from "@/modules/learning/infrastructure/materi.repository";
import type { MateriModul } from "@/modules/learning/domain/entities";
import { Skeleton } from "@/components/ui/skeleton";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye } from "lucide-react";
import Link from "next/link";

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
        { label: result.title, href: `/dashboard/materi-modul/${id}` },
        { label: "Edit" },
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
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Edit Materi Modul"
          description={`Mengedit: ${data.title}`}
        />
        <Button variant="outline" asChild>
          <Link href={`/dashboard/materi-modul/${id}`}>
            <Eye className="mr-2 size-4" />
            Lihat Detail
          </Link>
        </Button>
      </div>
      
      <MateriModulForm initialData={data} isEdit />

      <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900">
            Untuk mengelola Item Materi (file, URL, dll)
          </p>
          <p className="text-xs text-blue-700 mt-1">
            Silakan kembali ke halaman detail modul
          </p>
        </div>
        <Button variant="outline" size="sm" asChild className="shrink-0">
          <Link href={`/dashboard/materi-modul/${id}`}>
            <ArrowLeft className="mr-2 size-4" />
            Ke Detail
          </Link>
        </Button>
      </div>
    </div>
  );
}
