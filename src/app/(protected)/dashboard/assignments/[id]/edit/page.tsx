"use client";

import { use } from "react";
import { AssignmentForm } from "@/modules/learning/presentation/components/AssignmentForm";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { assignmentRepository } from "@/modules/learning/infrastructure/assignment.repository";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Assignment } from "@/modules/learning/domain/entities";

export default function EditAssignmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await assignmentRepository.getById(id);
        setData(result);
      } catch (error) {
        toast.error("Gagal memuat data tugas");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Tugas"
        description="Perbarui informasi tugas"
      />
      <AssignmentForm initialData={data} isEdit />
    </div>
  );
}
