"use client";

import { useEffect } from "react";
import {
  setTokenGetter,
  setOnUnauthorized,
} from "@/shared/infrastructure/api/httpClient";
import { authStore } from "@/modules/auth/infrastructure/auth.store";

export function AuthStoreHydration() {
  // Hydrate token from localStorage before children (e.g. useAuthGuard) run
  if (typeof window !== "undefined") {
    authStore.hydrate();
  }

  useEffect(() => {
    setTokenGetter(() => authStore.getState().token);
    setOnUnauthorized(() => {
      authStore.clearSession();
      if (typeof window !== "undefined") window.location.href = "/login";
    });
  }, []);
  return null;
}
