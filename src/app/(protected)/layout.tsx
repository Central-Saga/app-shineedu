"use client";

import { useAuthGuard } from "@/shared/presentation/hooks/useAuthGuard";
import { AppSidebar } from "@/shared/presentation/components/AppSidebar";
import { AppTopbar } from "@/shared/presentation/components/AppTopbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
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
        <Skeleton className="h-14 w-full shrink-0" />
        <div className="flex flex-1">
          <Skeleton className="hidden w-64 md:block" />
          <Skeleton className="flex-1" />
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppTopbar />
        <div className="flex-1 overflow-auto px-6 py-6">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
