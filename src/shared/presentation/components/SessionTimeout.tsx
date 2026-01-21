"use client";

import { useEffect, useRef, useCallback } from "react";
import { authStore, useAuthStore } from "@/modules/auth/infrastructure/auth.store";

const TIMEOUT_IN_MS = 3600 * 1000; // 1 hour

export default function SessionTimeout() {
  const token = useAuthStore((state) => state.token);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (token) {
      timeoutRef.current = setTimeout(() => {
        console.log("Session inactive for 1 hour. Logging out...");
        authStore.logout();
      }, TIMEOUT_IN_MS);
    }
  }, [token]);

  useEffect(() => {
    // Only set up listeners if user is logged in
    if (!token) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
    ];

    const handleActivity = () => {
      resetTimer();
    };

    // Initialize timer
    resetTimer();

    // Add listeners
    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [token, resetTimer]);

  return null;
}
