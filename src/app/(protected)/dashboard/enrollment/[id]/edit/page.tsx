"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { EnrollmentForm } from "@/modules/enrollment/presentation/components/EnrollmentForm";
import { enrollmentRepository } from "@/modules/enrollment/infrastructure/enrollment.repository";
import { Enrollment } from "@/modules/enrollment/domain/entities";
import { Loader2 } from "lucide-react";

export default function EditEnrollmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { allowed } = usePermissionGuard("enrollment.update");
  const { setItems } = useBreadcrumbStore();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);

  const resolvedParams = use(params);
  const id = resolvedParams.id;

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Enrollment", href: "/dashboard/enrollment" },
      { label: `Edit #${id}` },
    ]);
  }, [setItems, id]);

  useEffect(() => {
    if (allowed && id) {
        setLoading(true);
        enrollmentRepository.getEnrollment(id)
            .then((res) => {
                setEnrollment(res.data);
            })
            .catch((err) => {
                console.error(err);
                toast.error("Gagal memuat data enrollment");
                router.push("/dashboard/enrollment");
            })
            .finally(() => setLoading(false));
    }
  }, [allowed, id, router]);

  if (!allowed) return null;

  if (loading) {
      return (
          <div className="flex h-60 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
      );
  }

  if(!enrollment) return null;

  return (
    <div>
      <PageHeader 
        title={`Edit Enrollment`} 
        description={`Mengubah data enrollment ${enrollment.kode_enrollment || ''}`} 
      />
      <div className="mt-6">
        <EnrollmentForm 
            isEdit 
            initialData={enrollment} 
        />
      </div>
    </div>
  );
}
