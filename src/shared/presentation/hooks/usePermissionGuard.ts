"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authStore, useAuthStore } from "@/modules/auth/infrastructure/auth.store";

export function usePermissionGuard(permission: string): { allowed: boolean } {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const allowed = useAuthStore((s) => authStore.hasPermission(permission));

  useEffect(() => {
    // Jika tidak ada token, berarti memang belum login
    if (!token) {
      router.replace("/login");
      return;
    }

    // Hanya tendang user jika data user SUDAH ada tapi izin TIDAK ada
    if (user && !allowed) {
      toast.error("Tidak punya akses ke halaman tersebut");
      router.replace("/dashboard");
    }
  }, [allowed, user, token, router]);

  return { allowed };
}
