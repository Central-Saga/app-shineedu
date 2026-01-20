"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authStore } from "@/modules/auth/infrastructure/auth.store";

export function usePermissionGuard(permission: string): { allowed: boolean } {
  const router = useRouter();
  const allowed = authStore.hasPermission(permission);

  useEffect(() => {
    if (!allowed) {
      toast.error("Tidak punya akses");
      router.replace("/dashboard");
    }
  }, [allowed, router]);

  return { allowed };
}
