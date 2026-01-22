"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { JadwalKerjaForm } from "@/modules/jadwal-kerja/presentation/components/JadwalKerjaForm";
import { getJadwalKerjaUsecase } from "@/modules/jadwal-kerja/application/usecases/getJadwalKerja.usecase";
import { updateJadwalKerjaUsecase } from "@/modules/jadwal-kerja/application/usecases/updateJadwalKerja.usecase";
import { getEmployeesUsecase } from "@/modules/employees/application/usecases/getEmployees.usecase";
import type { Employee } from "@/modules/employees/domain/entities";
import type { JadwalKerja } from "@/modules/jadwal-kerja/domain/entities";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function JadwalKerjaEditPage() {
  const { allowed } = usePermissionGuard("jadwal_kerja.update");
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [initialData, setInitialData] = useState<JadwalKerja | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { setItems } = useBreadcrumbStore();

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Jadwal Kerja", href: "/jadwal-kerja" },
      { label: "Edit Jadwal" },
    ]);
  }, [setItems]);

  useEffect(() => {
    if (!allowed || !id) return;
    setLoading(true);
    Promise.all([
      getJadwalKerjaUsecase(id),
      getEmployeesUsecase({ per_page: 100 }),
    ])
      .then(([data, empRes]) => {
        setInitialData(data);
        setEmployees(empRes.items);
      })
      .catch((e) => {
        toast.error("Gagal memuat data");
        router.push("/jadwal-kerja");
      })
      .finally(() => setLoading(false));
  }, [allowed, id, router]);

  async function handleSubmit(payload: any) {
    setIsSubmitting(true);
    try {
      await updateJadwalKerjaUsecase(id, payload);
      toast.success("Jadwal berhasil diperbarui");
      router.push("/jadwal-kerja");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal memperbarui jadwal");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!allowed) return null;

  return (
    <div className="w-full">
      <PageHeader
        title="Edit Jadwal Kerja"
        description="Perbarui informasi jadwal pengajaran"
      />
      
      <div className="mt-6">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        ) : initialData ? (
          <JadwalKerjaForm
            initialData={initialData}
            employees={employees}
            onSubmit={handleSubmit}
            onCancel={() => router.push("/jadwal-kerja")}
            isSubmitting={isSubmitting}
          />
        ) : null}
      </div>
    </div>
  );
}
