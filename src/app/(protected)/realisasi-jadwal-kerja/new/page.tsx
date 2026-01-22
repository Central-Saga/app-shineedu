"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { RealisasiJadwalForm } from "@/modules/realisasi-jadwal-kerja/presentation/components/RealisasiJadwalForm";
import { createRealisasiJadwalUsecase } from "@/modules/realisasi-jadwal-kerja/application/usecases/createRealisasiJadwal.usecase";
import { getEmployeesUsecase } from "@/modules/employees/application/usecases/getEmployees.usecase";
import { getJadwalKerjaListUsecase } from "@/modules/jadwal-kerja/application/usecases/getJadwalKerjaList.usecase";
import type { Employee } from "@/modules/employees/domain/entities";
import type { JadwalKerja } from "@/modules/jadwal-kerja/domain/entities";
import { toast } from "sonner";

export default function RealisasiJadwalNewPage() {
  const { allowed } = usePermissionGuard("realisasi_jadwal_kerja.create");
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [jadwalList, setJadwalList] = useState<JadwalKerja[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setItems } = useBreadcrumbStore();

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Realisasi Jadwal Kerja", href: "/realisasi-jadwal-kerja" },
      { label: "Tambah Realisasi" },
    ]);
  }, [setItems]);

  useEffect(() => {
    if (!allowed) return;
    Promise.all([
      getEmployeesUsecase({ per_page: 100 }),
      getJadwalKerjaListUsecase({ per_page: 100 }),
    ]).then(([empRes, jadwalRes]) => {
      setEmployees(empRes.items);
      setJadwalList(jadwalRes.items);
    }).catch(() => toast.error("Gagal memuat data pendukung"));
  }, [allowed]);

  async function handleSubmit(payload: any) {
    setIsSubmitting(true);
    try {
      await createRealisasiJadwalUsecase(payload);
      toast.success("Realisasi berhasil ditambahkan");
      router.push("/realisasi-jadwal-kerja");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan realisasi");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!allowed) return null;

  return (
    <div className="w-full">
      <PageHeader
        title="Tambah Realisasi Jadwal"
        description="Catat realisasi kedatangan dan pengajaran guru"
      />
      <div className="mt-6">
        <RealisasiJadwalForm
          employees={employees}
          jadwalList={jadwalList}
          onSubmit={handleSubmit}
          onCancel={() => router.push("/realisasi-jadwal-kerja")}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
