import { Suspense } from "react";
import { StudentKelasDetailClient } from "@/modules/learning/presentation/components/StudentKelasDetailClient";

export default function StudentKelasDetailPage({ 
  params 
}: { 
  params: Promise<{ kelasId: string }> 
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StudentKelasDetailClient params={params} />
    </Suspense>
  );
}
