"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authStore } from "@/modules/auth/infrastructure/auth.store";

type GuardState = "loading" | "ready";

export function useAuthGuard(): GuardState {
  const router = useRouter();
  const [state, setState] = useState<GuardState>("loading");
  const token = authStore.getState().token;
  const user = authStore.getState().user;

  useEffect(() => {
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
  }, [token, user, router]);

  return state;
}
