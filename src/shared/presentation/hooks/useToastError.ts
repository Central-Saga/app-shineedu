"use client";

import { useCallback } from "react";
import { toast } from "sonner";

export function useToastError(): (err: unknown) => void {
  return useCallback((err: unknown) => {
    const message =
      err instanceof Error ? err.message : "Terjadi kesalahan";
    toast.error(message);
  }, []);
}
