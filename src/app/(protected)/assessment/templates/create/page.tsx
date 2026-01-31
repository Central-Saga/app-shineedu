"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { TemplateForm } from "@/modules/assessment/presentation/components/TemplateForm";
import { createTemplateUsecase } from "@/modules/assessment/application/usecases/createTemplate.usecase";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import type { CreateTemplateInput } from "@/modules/assessment/domain/entities";

export default function CreateTemplatePage() {
  const { allowed } = usePermissionGuard("assessment.manage");
  const router = useRouter();
  const { setItems } = useBreadcrumbStore();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Templates", href: "/assessment/templates" },
      { label: "Buat Baru" },
    ]);
  }, [setItems]);

  async function handleSubmit(data: CreateTemplateInput) {
    try {
      setSubmitting(true);
      await createTemplateUsecase(data);
      toast.success("Template berhasil dibuat");
      router.push("/assessment/templates");
    } catch (e: any) {
        // Handle validation errors from backend usually in e.errors or e.message
        const msg = e.response?.data?.message || e.message || "Gagal membuat template";
        toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (!allowed) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Buat Template Baru"
        description="Upload background sertifikat dan atur posisi text"
        showBackButton
      />

      <Card className="rounded-2xl shadow-sm mt-6">
        <CardContent className="pt-6">
          <TemplateForm loading={submitting} onSubmit={handleSubmit} />
        </CardContent>
      </Card>
    </div>
  );
}
