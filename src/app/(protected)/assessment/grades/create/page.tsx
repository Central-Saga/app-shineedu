"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { GradeForm } from "@/modules/assessment/presentation/components/GradeForm";
import { createGradeUsecase } from "@/modules/assessment/application/usecases/createGrade.usecase";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import type { CreateGradeInput } from "@/modules/assessment/domain/entities";

export default function CreateGradePage() {
  const { allowed } = usePermissionGuard("assessment.manage");
  const router = useRouter();
  const { setItems } = useBreadcrumbStore();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Grades", href: "/assessment/grades" },
      { label: "Input Nilai" },
    ]);
  }, [setItems]);

  async function handleSubmit(data: CreateGradeInput) {
    try {
      setSubmitting(true);
      await createGradeUsecase(data);
      toast.success("Nilai berhasil disimpan");
      router.push("/assessment/grades");
    } catch (e: any) {
        const msg = e.response?.data?.message || e.message || "Gagal menyimpan nilai";
        toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (!allowed) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Input Nilai Assessment"
        description="Masukkan nilai siswa untuk kalkulasi sertifikat"
        backHref="/assessment/grades"
      />

      <Card className="rounded-2xl shadow-sm mt-6">
        <CardContent className="pt-6">
          <GradeForm loading={submitting} onSubmit={handleSubmit} />
        </CardContent>
      </Card>
    </div>
  );
}
