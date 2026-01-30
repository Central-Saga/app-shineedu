import { Suspense } from "react";
import { StudentLearningClient } from "@/modules/learning/presentation/components/StudentLearningClient";

export default function StudentLearningPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StudentLearningClient />
    </Suspense>
  );
}
