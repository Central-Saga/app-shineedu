"use client";

import { useEffect } from "react";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { ActivityLogTable } from "@/modules/identity/presentation/components/ActivityLogTable";
import { authStore } from "@/modules/auth/infrastructure/auth.store";
import { useRouter } from "next/navigation";

export default function ActivityLogPage() {
  const { setItems } = useBreadcrumbStore();
  const router = useRouter();

  // Protect page
  const canView = authStore.hasPermission("activity_logs.view");

  useEffect(() => {
     if (!canView) {
        // Optional: redirect or show unauthorized
        // router.push('/dashboard');
     }
  }, [canView, router]);

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Activity Logs" },
    ]);
  }, [setItems]);

  if (!canView) {
      return (
          <div className="p-8 text-center text-muted-foreground">
              Anda tidak memiliki izin untuk melihat halaman ini.
          </div>
      )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-shine-dark">Activity Logs</h2>
        <p className="text-muted-foreground">
          Audit trail semua aktivitas pengguna dalam sistem.
        </p>
      </div>
      
      <ActivityLogTable />
    </div>
  );
}
