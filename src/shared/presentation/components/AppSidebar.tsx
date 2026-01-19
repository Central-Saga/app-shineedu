"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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

const mainNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: null as string | null },
];

const identityNav = [
  { href: "/users", label: "Users", icon: Users, permission: "users.view" },
  { href: "/roles", label: "Roles", icon: Shield, permission: "roles.view" },
  { href: "/permissions", label: "Permissions", icon: KeyRound, permission: "permissions.view" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [logoError, setLogoError] = useState(false);
  const hasAny = (p: string | null) =>
    !p || authStore.hasAnyPermission([p]);

  return (
    <aside className="flex h-full w-56 flex-col border-r border-slate-200 bg-white">
      <div className="p-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2"
        >
          {!logoError ? (
            <Image
              src="/logo.png"
              alt="SHINE"
              width={100}
              height={32}
              className="object-contain"
              onError={() => setLogoError(true)}
            />
          ) : (
            <span className="font-semibold text-primary">SHINE</span>
          )}
        </Link>
      </div>
      <Separator />
      <nav className="flex-1 space-y-4 p-2">
        <div>
          <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            MAIN
          </div>
          <div className="space-y-0.5">
            {mainNav.filter((n) => hasAny(n.permission)).map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-red-50 text-red-700"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <Icon
                    className={cn("size-4 shrink-0", active && "text-primary")}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            IDENTITY
          </div>
          <div className="space-y-0.5">
            {identityNav.filter((n) => hasAny(n.permission)).map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-red-50 text-red-700"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <Icon
                    className={cn("size-4 shrink-0", active && "text-primary")}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </aside>
  );
}
