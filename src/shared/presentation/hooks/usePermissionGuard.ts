"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authStore, useAuthStore } from "@/modules/auth/infrastructure/auth.store";

export function usePermissionGuard(permission: string): { allowed: boolean } {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const allowed = useAuthStore((s) => authStore.hasPermission(permission));

  useEffect(() => {
    // Hanya lakukan pengecekan jika user sudah ter-load (tidak null)
    if (user && !allowed) {
      toast.error("Anda tidak memiliki akses ke halaman ini");
      router.replace("/dashboard");
    }
  }, [user, allowed, router]);

  return { allowed };
}
