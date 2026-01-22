"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Shield,
  UserCircle,
  CalendarDays,
  ChevronRight,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
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
];

const hrNav = [
  {
    href: "/employees",
    label: "Karyawan",
    icon: UserCircle,
    permission: "employees.view",
  },
];

export function SidebarJadwalToggle({ can }: { can: (key: string) => boolean }) {
  const pathname = usePathname();

  const canJadwal = can("jadwal_kerja.view");
  const canRealisasi = can("realisasi_jadwal_kerja.view");
  if (!canJadwal && !canRealisasi) return null;

  const jadwalActive = pathname.startsWith("/jadwal-kerja");
  const realisasiActive = pathname.startsWith("/realisasi-jadwal-kerja");
  const parentActive = jadwalActive || realisasiActive;

  return (
    <Collapsible defaultOpen={parentActive} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton isActive={parentActive} className="py-1">
            <CalendarDays className="size-4 shrink-0" />
            <span>Jadwal</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <SidebarMenuSub>
            {canJadwal && (
              <SidebarMenuSubItem>
                <SidebarMenuSubButton asChild isActive={jadwalActive}>
                  <Link href="/jadwal-kerja">
                    <span>Jadwal Kerja</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            )}

            {canRealisasi && (
              <SidebarMenuSubItem>
                <SidebarMenuSubButton asChild isActive={realisasiActive}>
                  <Link href="/realisasi-jadwal-kerja">
                    <span>Realisasi Jadwal</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            )}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

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
      <SidebarHeader className="px-5 py-4">
        <Link
          href="/dashboard"
          className="flex items-center outline-none ring-sidebar-ring focus-visible:ring-2 rounded-md"
        >
          <Image
            src="/shine-logo.png"
            alt="Shine Edu"
            width={160}
            height={48}
            className="w-full h-auto object-contain"
          />
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup className="py-1">
            <SidebarGroupLabel asChild className="mb-0 h-7 px-2">
              <CollapsibleTrigger className="flex w-full items-center justify-between hover:text-sidebar-foreground transition-colors">
                MAIN
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {mainNav
                    .map((item) => {
                      const Icon = item.icon;
                      const active = pathname === item.href;
                      return (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton asChild isActive={active}>
                            <Link href={item.href} className="py-1">
                              <Icon className="size-4 shrink-0" />
                              <span>{item.label}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup className="py-1">
            <SidebarGroupLabel asChild className="mb-0 h-7 px-2">
              <CollapsibleTrigger className="flex w-full items-center justify-between hover:text-sidebar-foreground transition-colors">
                IDENTITY
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {identityNav
                    .filter((n) => hasAny(n.permission))
                    .map((item) => {
                      const Icon = item.icon;
                      const active = pathname === item.href;
                      return (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton asChild isActive={active}>
                            <Link href={item.href} className="py-1">
                              <Icon className="size-4 shrink-0" />
                              <span>{item.label}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {(hrNav.filter((n) => hasAny(n.permission)).length > 0 ||
          authStore.hasAnyPermission([
            "jadwal_kerja.view",
            "realisasi_jadwal_kerja.view",
          ])) && (
          <Collapsible defaultOpen className="group/collapsible">
            <SidebarGroup className="py-1">
              <SidebarGroupLabel asChild className="mb-0 h-7 px-2">
                <CollapsibleTrigger className="flex w-full items-center justify-between hover:text-sidebar-foreground transition-colors">
                  HR
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {hrNav
                      .filter((n) => hasAny(n.permission))
                      .map((item) => {
                        const Icon = item.icon;
                        const active = pathname === item.href;
                        return (
                          <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton asChild isActive={active}>
                              <Link href={item.href} className="py-1">
                                <Icon className="size-4 shrink-0" />
                                <span>{item.label}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    <SidebarJadwalToggle can={(k) => authStore.hasPermission(k)} />
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
