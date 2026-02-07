"use client";

import { useLayoutEffect } from "react";
import {
  setTokenGetter,
  setOnUnauthorized,
} from "@/shared/infrastructure/api/httpClient";
import { authStore } from "@/modules/auth/infrastructure/auth.store";

export function AuthStoreHydration() {
  // useLayoutEffect: hydrate + setTokenGetter BEFORE paint and before any child useEffect.
  // This prevents useAuthGuard from seeing token=null and redirecting before token is restored from localStorage.
  useLayoutEffect(() => {
    authStore.hydrate();
    setTokenGetter(() => {
      const t = authStore.getState().token;
      return typeof t === "string" && t.trim() !== "" ? t.trim() : null;
    });
    setOnUnauthorized(() => {
      authStore.clearSession();
      if (typeof window !== "undefined") window.location.href = "/login";
    });
  }, []);

  return null;
}
