"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Shield,
  KeyRound,
} from "lucide-react";
import { authStore } from "@/modules/auth/infrastructure/auth.store";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: null as string | null },
  { href: "/users", label: "Users", icon: Users, permission: "users.view" },
  { href: "/roles", label: "Roles", icon: Shield, permission: "roles.view" },
  { href: "/permissions", label: "Permissions", icon: KeyRound, permission: "permissions.view" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const hasAny = (p: string | null) =>
    !p || authStore.hasAnyPermission([p]);

  return (
    <aside className="flex h-full w-56 flex-col border-r bg-sidebar">
      <div className="p-4">
        <Link href="/dashboard" className="font-semibold text-sidebar-foreground">
          Shine Edu
        </Link>
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 p-2">
        {nav.filter((n) => hasAny(n.permission)).map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
