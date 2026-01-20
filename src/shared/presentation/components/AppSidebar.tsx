"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Shield,
  KeyRound,
  UserCircle,
} from "lucide-react";
import { authStore } from "@/modules/auth/infrastructure/auth.store";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const mainNav = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    permission: null as string | null,
  },
];

const identityNav = [
  { href: "/users", label: "Users", icon: Users, permission: "users.view" },
  { href: "/roles", label: "Roles", icon: Shield, permission: "roles.view" },
  {
    href: "/permissions",
    label: "Permissions",
    icon: KeyRound,
    permission: "permissions.view",
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const hasAny = (p: string | null) => !p || authStore.hasAnyPermission([p]);

  return (
    <Sidebar
      variant="floating"
      collapsible="offcanvas"
      side="left"
      className="border-0"
    >
      <SidebarHeader className="p-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 outline-none ring-sidebar-ring focus-visible:ring-2 rounded-md"
        >
          <Image
            src="/logo-tanpa-nama.png"
            alt=""
            width={32}
            height={32}
            className="shrink-0 object-contain"
          />
          <span className="font-semibold text-sidebar-foreground">Shine Edu</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>MAIN</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.filter((n) => hasAny(n.permission)).map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link href={item.href}>
                        <Icon className="size-4 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>IDENTITY</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {identityNav.filter((n) => hasAny(n.permission)).map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link href={item.href}>
                        <Icon className="size-4 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>HR</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton disabled aria-disabled>
                  <UserCircle className="size-4 shrink-0" />
                  <span>Employees</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
