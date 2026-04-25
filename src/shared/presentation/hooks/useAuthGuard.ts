"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authStore, useAuthStore } from "@/modules/auth/infrastructure/auth.store";

type GuardState = "loading" | "ready";

export function useAuthGuard(): GuardState {
  const router = useRouter();
  const [state, setState] = useState<GuardState>("loading");
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated); // NEW

  useEffect(() => {
    // NEW: Wait for hydration before checking token
    if (!isHydrated) {
      return;
    }

    if (!token) {
      router.replace("/login");
      return;
    }
    if (user == null) {
      authStore.fetchMe().then(
        () => setState("ready"),
        () => {
          authStore.clearSession();
          router.replace("/login");
        }
      );
      return;
    }
    setState("ready"); // eslint-disable-line react-hooks/set-state-in-effect
  }, [token, user, isHydrated, router]);

  return state;
}
