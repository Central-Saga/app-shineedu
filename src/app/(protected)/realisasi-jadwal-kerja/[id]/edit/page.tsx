"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { RealisasiJadwalForm } from "@/modules/realisasi-jadwal-kerja/presentation/components/RealisasiJadwalForm";
import { getRealisasiJadwalUsecase } from "@/modules/realisasi-jadwal-kerja/application/usecases/getRealisasiJadwal.usecase";
import { updateRealisasiJadwalUsecase } from "@/modules/realisasi-jadwal-kerja/application/usecases/updateRealisasiJadwal.usecase";
import { getEmployeesUsecase } from "@/modules/employees/application/usecases/getEmployees.usecase";
import { getJadwalKerjaListUsecase } from "@/modules/jadwal-kerja/application/usecases/getJadwalKerjaList.usecase";
import type { Employee } from "@/modules/employees/domain/entities";
import type { JadwalKerja } from "@/modules/jadwal-kerja/domain/entities";
import type { RealisasiJadwal } from "@/modules/realisasi-jadwal-kerja/domain/entities";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function RealisasiJadwalEditPage() {
  const { allowed } = usePermissionGuard("realisasi_jadwal_kerja.update");
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [initialData, setInitialData] = useState<RealisasiJadwal | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [jadwalList, setJadwalList] = useState<JadwalKerja[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { setItems } = useBreadcrumbStore();

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Realisasi Jadwal Kerja", href: "/realisasi-jadwal-kerja" },
      { label: "Edit Realisasi" },
    ]);
  }, [setItems]);

  useEffect(() => {
    if (!allowed || !id) return;
    setLoading(true);
    Promise.all([
      getRealisasiJadwalUsecase(id),
      getEmployeesUsecase({ per_page: 100 }),
      getJadwalKerjaListUsecase({ per_page: 100 }),
    ])
      .then(([data, empRes, jadwalRes]) => {
        setInitialData(data);
        setEmployees(empRes.items);
        setJadwalList(jadwalRes.items);
      })
      .catch((e) => {
        toast.error("Gagal memuat data");
        router.push("/realisasi-jadwal-kerja");
      })
      .finally(() => setLoading(false));
  }, [allowed, id, router]);

  async function handleSubmit(payload: any) {
    setIsSubmitting(true);
    try {
      await updateRealisasiJadwalUsecase(id, payload);
      toast.success("Realisasi berhasil diperbarui");
      router.push("/realisasi-jadwal-kerja");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal memperbarui realisasi");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!allowed) return null;

  return (
    <div className="w-full">
      <PageHeader
        title="Edit Realisasi Jadwal"
        description="Perbarui informasi realisasi pengajaran"
      />
      
      <div className="mt-6">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        ) : initialData ? (
          <RealisasiJadwalForm
            initialData={initialData}
            employees={employees}
            jadwalList={jadwalList}
            onSubmit={handleSubmit}
            onCancel={() => router.push("/realisasi-jadwal-kerja")}
            isSubmitting={isSubmitting}
          />
        ) : null}
      </div>
    </div>
  );
}
