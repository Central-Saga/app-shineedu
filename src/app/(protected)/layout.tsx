"use client";

import { useAuthGuard } from "@/shared/presentation/hooks/useAuthGuard";
import { AppSidebar } from "@/shared/presentation/components/AppSidebar";
import { AppTopbar } from "@/shared/presentation/components/AppTopbar";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const state = useAuthGuard();

  if (state === "loading") {
    return (
      <div className="flex h-screen flex-col">
        <Skeleton className="h-14 w-full" />
        <div className="flex flex-1">
          <Skeleton className="w-56" />
          <Skeleton className="flex-1" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <AppTopbar />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-auto px-6 py-6">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
