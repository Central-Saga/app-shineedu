"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/modules/auth/infrastructure/auth.store";
import type { User } from "@/modules/auth/domain/entities";

/**
 * Helper to check if a user is superadmin.
 */
function isSuperadmin(user: User): boolean {
  return (user.roles ?? []).some(
    (r: any) => r.name?.toLowerCase() === "superadmin"
  );
}

/**
 * Stable permission check logic for use in Zustand selectors or hooks.
 */
export function checkPermission(state: { user: User | null; permissionsSet: Set<string> }, name: string): boolean {
  if (!state.user) return false;
  if (isSuperadmin(state.user)) return true;
  return state.permissionsSet.has(name);
}

/**
 * Hook to guard pages based on permissions.
 * Prevents white screen by waiting for user data to load before redirecting.
 */
export function usePermissionGuard(permission: string): { allowed: boolean } {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const allowed = useAuthStore((s) => checkPermission(s, permission));

  useEffect(() => {
    // Only redirect if user data is loaded (not null) AND permission is checkable and denied.
    if (user !== null && !allowed) {
      toast.error("Anda tidak memiliki akses ke halaman ini");
      router.replace("/dashboard");
    }
  }, [user, allowed, router]);

  return { allowed };
}
