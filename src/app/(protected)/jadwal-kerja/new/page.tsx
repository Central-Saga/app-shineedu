"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { JadwalKerjaForm } from "@/modules/jadwal-kerja/presentation/components/JadwalKerjaForm";
import { createJadwalKerjaUsecase } from "@/modules/jadwal-kerja/application/usecases/createJadwalKerja.usecase";
import { getEmployeesUsecase } from "@/modules/employees/application/usecases/getEmployees.usecase";
import type { Employee } from "@/modules/employees/domain/entities";
import { toast } from "sonner";

export default function JadwalKerjaNewPage() {
  const { allowed } = usePermissionGuard("jadwal_kerja.create");
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setItems } = useBreadcrumbStore();

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Jadwal Kerja", href: "/jadwal-kerja" },
      { label: "Tambah Jadwal" },
    ]);
  }, [setItems]);

  useEffect(() => {
    if (!allowed) return;
    getEmployeesUsecase({ per_page: 100 })
      .then((r) => setEmployees(r.items))
      .catch(() => toast.error("Gagal memuat data pengajar"));
  }, [allowed]);

  async function handleSubmit(payload: any) {
    setIsSubmitting(true);
    try {
      await createJadwalKerjaUsecase(payload);
      toast.success("Jadwal berhasil ditambahkan");
      router.push("/jadwal-kerja");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan jadwal");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!allowed) return null;

  return (
    <div className="w-full">
      <PageHeader
        title="Tambah Jadwal Kerja"
        description="Buat jadwal pengajaran baru untuk guru"
      />
      <div className="mt-6">
        <JadwalKerjaForm
          employees={employees}
          onSubmit={handleSubmit}
          onCancel={() => router.push("/jadwal-kerja")}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
