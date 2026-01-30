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
  BookOpen,
  ListChecks,
  School,
  Wallet,
  ImageIcon,
  FileText,
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

export function SidebarKehadiranToggle({ can }: { can: (key: string) => boolean }) {
  const pathname = usePathname();

  const canAbsensi = can("absensi.view");
  const canCuti = can("cuti.view");
  const canPengaturan = can("pengaturan_cuti.view");

  if (!canAbsensi && !canCuti && !canPengaturan) return null;

  const absensiActive = pathname.startsWith("/absensi");
  const cutiActive = pathname.startsWith("/cuti");
  const pengaturanActive = pathname.startsWith("/pengaturan-cuti");
  const parentActive = absensiActive || cutiActive || pengaturanActive;

  return (
    <Collapsible defaultOpen={parentActive} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton isActive={parentActive} className="py-1">
            <CalendarDays className="size-4 shrink-0" />
            <span>Kehadiran & Cuti</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <SidebarMenuSub>
            {canAbsensi && (
              <SidebarMenuSubItem>
                <SidebarMenuSubButton asChild isActive={absensiActive}>
                  <Link href="/absensi">
                    <span>Absensi</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            )}

            {canCuti && (
              <SidebarMenuSubItem>
                <SidebarMenuSubButton asChild isActive={cutiActive}>
                  <Link href="/cuti">
                    <span>Cuti</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            )}

            {canPengaturan && (
              <SidebarMenuSubItem>
                <SidebarMenuSubButton asChild isActive={pengaturanActive}>
                  <Link href="/pengaturan-cuti">
                    <span>Pengaturan Cuti</span>
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
                ACADEMIC
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {authStore.hasPermission("student.view") && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname.startsWith("/dashboard/murid")}>
                        <Link href="/dashboard/murid" className="py-1">
                          <Users className="size-4 shrink-0" />
                          <span>Murid</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  {authStore.hasPermission("enrollment.view") && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname.startsWith("/dashboard/enrollment")}>
                        <Link href="/dashboard/enrollment" className="py-1">
                          <ListChecks className="size-4 shrink-0" />
                          <span>Enrollment</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    )}
                  {authStore.hasPermission("kelas.view") && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname.startsWith("/dashboard/kelas")}>
                        <Link href="/dashboard/kelas" className="py-1">
                          <School className="size-4 shrink-0" />
                          <span>Kelas</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  <SidebarCatalogToggle can={(k) => authStore.hasPermission(k)} />
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {(authStore.hasPermission("landing.gallery.view") || authStore.hasPermission("blog.view")) && (
          <Collapsible defaultOpen className="group/collapsible">
            <SidebarGroup className="py-1">
              <SidebarGroupLabel asChild className="mb-0 h-7 px-2">
                <CollapsibleTrigger className="flex w-full items-center justify-between hover:text-sidebar-foreground transition-colors">
                  LANDING
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname.startsWith("/gallery-landing")}>
                        <Link href="/gallery-landing" className="py-1">
                          <ImageIcon className="size-4 shrink-0" />
                          <span>Gallery Landing</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    {authStore.hasPermission("blog.view") && (
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname.startsWith("/blogs")}>
                          <Link href="/blogs" className="py-1">
                            <FileText className="size-4 shrink-0" />
                            <span>Blog</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}

        {authStore.hasPermission("kas.view") && (
          <Collapsible defaultOpen className="group/collapsible">
            <SidebarGroup className="py-1">
              <SidebarGroupLabel asChild className="mb-0 h-7 px-2">
                <CollapsibleTrigger className="flex w-full items-center justify-between hover:text-sidebar-foreground transition-colors">
                  FINANCE
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname.startsWith("/dashboard/kas")}>
                        <Link href="/dashboard/kas/transaksi" className="py-1">
                          <Wallet className="size-4 shrink-0" />
                          <span>Kas</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}

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
            "absensi.view",
            "cuti.view",
            "pengaturan_cuti.view",
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
                    <SidebarKehadiranToggle can={(k) => authStore.hasPermission(k)} />
                    <SidebarJadwalToggle can={(k) => authStore.hasPermission(k)} />
                    <SidebarPayrollToggle can={(k) => authStore.hasPermission(k)} />
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

export function SidebarCatalogToggle({ can }: { can: (key: string) => boolean }) {
  const pathname = usePathname();

  const canJenjang = can("catalog.jenjang.view");
  const canProgram = can("catalog.program.view");
  const canPaket = can("catalog.paket.view");
  const canHarga = can("catalog.pricing.view");

  if (!canJenjang && !canProgram && !canPaket && !canHarga) return null;

  const active = pathname.startsWith("/dashboard/catalog");
  const jenjangActive = pathname.startsWith("/dashboard/catalog/jenjang");
  const programActive = pathname.startsWith("/dashboard/catalog/program");
  const paketActive = pathname.startsWith("/dashboard/catalog/paket");
  const hargaActive = pathname.startsWith("/dashboard/catalog/harga");
  const lookupActive = pathname.startsWith("/dashboard/catalog/lookup");

  return (
    <Collapsible defaultOpen={active} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton isActive={active} className="py-1">
            <BookOpen className="size-4 shrink-0" />
            <span>Katalog</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <SidebarMenuSub>
            {canJenjang && (
              <SidebarMenuSubItem>
                <SidebarMenuSubButton asChild isActive={jenjangActive}>
                  <Link href="/dashboard/catalog/jenjang">
                    <span>Jenjang</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            )}
            
            {canProgram && (
              <SidebarMenuSubItem>
                <SidebarMenuSubButton asChild isActive={programActive}>
                  <Link href="/dashboard/catalog/program">
                    <span>Program</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            )}

            {canPaket && (
              <SidebarMenuSubItem>
                <SidebarMenuSubButton asChild isActive={paketActive}>
                  <Link href="/dashboard/catalog/paket">
                    <span>Paket</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            )}

            {canHarga && (
              <SidebarMenuSubItem>
                <SidebarMenuSubButton asChild isActive={hargaActive}>
                  <Link href="/dashboard/catalog/harga">
                    <span>Harga Paket</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            )}
            
             {/* Optional Lookup */}
            {canHarga && (
              <SidebarMenuSubItem>
                <SidebarMenuSubButton asChild isActive={lookupActive}>
                  <Link href="/dashboard/catalog/lookup">
                    <span>Cek Harga</span>
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

export function SidebarPayrollToggle({ can }: { can: (key: string) => boolean }) {
  const pathname = usePathname();

  const canGaji = can("gaji.view");
  if (!canGaji) return null;

  const active = pathname.startsWith("/gaji") || pathname.startsWith("/rekap-bulanan");

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} className="py-1">
        <Link href="/gaji">
          <span className="size-4 shrink-0 flex items-center justify-center font-bold text-xs">$</span>
          <span>Payroll</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
