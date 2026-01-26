"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { authStore, useAuthStore } from "@/modules/auth/infrastructure/auth.store";
import { setOnUnauthorized } from "@/shared/infrastructure/api/httpClient";
import { toast } from "sonner";

// For testing: 1 minute (60,000 ms). Change back to 3600*1000 later.
const TIMEOUT_IN_MS = 60 * 1000; 

export default function SessionTimeout() {
  const token = useAuthStore((state) => state.token);
  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 1. Setup the global 401 interceptor
    setOnUnauthorized(() => {
      // Prevent duplicate toasts/actions if multiple requests fail at once
      if (useAuthStore.getState().token) {
        toast.error("Sesi telah berakhir. Silakan login kembali.");
        authStore.logout();
        router.push("/auth/login");
      }
    });

    // 2. Setup active timer (Absolute expiration for testing)
    if (token) {
      if (timerRef.current) clearTimeout(timerRef.current);
      
      timerRef.current = setTimeout(() => {
        if (useAuthStore.getState().token) {
           toast.error("Waktu sesi habis (1 menit). Otomatis logout.");
           authStore.logout();
           router.push("/auth/login");
        }
      }, TIMEOUT_IN_MS);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      // We don't unset setOnUnauthorized usually, but could if needed
    };
  }, [token, router]);

  return null;
}

