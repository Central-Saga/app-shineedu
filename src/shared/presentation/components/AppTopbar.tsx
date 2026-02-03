"use client";

import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { authStore } from "@/modules/auth/infrastructure/auth.store";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { LogOut, ChevronDown } from "lucide-react";

import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { AppBreadcrumbs } from "./AppBreadcrumbs";

export function AppTopbar() {
  const router = useRouter();
  const user = authStore.getState().user;
  const name = user?.name ?? "User";
  const email = user?.email ?? "";
  const initial = name.slice(0, 1).toUpperCase();
  // Determine role to display: if multiple roles exist and one of them is NOT Superadmin, assume the user prefers to see that functional role (e.g., Teacher).
  const roleName = user?.roles && user.roles.length > 0
    ? (() => {
        const roles = user.roles.map(r => r.name);
        // Find any role that is NOT Superadmin
        const nonSuper = roles.find(r => r.toLowerCase() !== "superadmin");
        // If found, display it. Otherwise (if only Superadmin), display Superadmin.
        return nonSuper || roles[0];
      })()
    : undefined;
  const { items } = useBreadcrumbStore();

  async function handleLogout() {
    await authStore.logout();
    router.push("/login");
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 bg-background px-4">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <SidebarTrigger className="-ml-1" />
        <div className="h-4 w-px bg-slate-200 mx-1" />
        <div className="flex-1 min-w-0">
          <AppBreadcrumbs items={items} className="mb-0 text-xs sm:text-sm" />
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2">
            <Avatar className="size-8">
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>
            <span className="hidden text-sm sm:inline">{name}</span>
            <ChevronDown className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Akun</DropdownMenuLabel>
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{name}</p>
            {email && (
              <p className="text-xs text-muted-foreground">{email}</p>
            )}
            {roleName && (
              <Badge
                variant="outline"
                className="mt-1.5 border-amber-300/80 bg-amber-50 text-amber-800"
              >
                {roleName}
              </Badge>
            )}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} variant="destructive">
            <LogOut className="mr-2 size-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
