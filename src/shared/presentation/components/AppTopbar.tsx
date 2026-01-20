"use client";

import { usePathname, useRouter } from "next/navigation";
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

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/users": "Users",
  "/roles": "Roles",
  "/permissions": "Permissions",
};

export function AppTopbar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = authStore.getState().user;
  const name = user?.name ?? "User";
  const email = user?.email ?? "";
  const initial = name.slice(0, 1).toUpperCase();
  const roleName = user?.roles?.[0]?.name;
  const pageTitle = PAGE_TITLES[pathname] ?? null;

  async function handleLogout() {
    await authStore.logout();
    router.push("/login");
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <div className="min-w-0 flex-1">
        {pageTitle && (
          <span className="text-sm font-medium text-slate-600">{pageTitle}</span>
        )}
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
