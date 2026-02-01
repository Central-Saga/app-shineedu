"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/modules/auth/infrastructure/auth.store";
import { 
  Users, 
  GraduationCap, 
  Wallet, 
  BookOpen, 
  QrCode
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { type DashboardData, fetchDashboardStats } from "@/modules/dashboard/infrastructure/dashboard.service";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const { setItems } = useBreadcrumbStore();
  const router = useRouter();

  useEffect(() => {
    setItems([{ label: "Dashboard", href: "/dashboard" }]);
    setMounted(true);
  }, [setItems]);

  useEffect(() => {
    async function r() {
        if (!user) return;
        try {
            const res = await fetchDashboardStats();
            setData(res);
        } catch (e) {
            console.error(e);
        }
    }
    r();
  }, [user]);

  if (!mounted || !user) {
      return (
          <div className="flex h-full w-full items-center justify-center p-12">
            <Loader2 className="size-8 animate-spin text-primary/30" />
          </div>
      )
  }

  const role = user?.roles?.[0]?.name || "Student";
  const isSuperadmin = role === "Superadmin" || role === "Admin";
  const isTeacher = role === "Teacher";
  
  // Shortcuts configuration
  const shortcuts = [
    { label: "Absensi", icon: QrCode, action: () => router.push("/absensi"), visible: true },
    { label: "Isi Logbook", icon: BookOpen, action: () => router.push("/realisasi-jadwal-kerja"), visible: isTeacher || isSuperadmin },
    { label: "Tambah Murid", icon: Users, action: () => router.push("/dashboard/murid/new"), visible: isSuperadmin },
    { label: "Buka Kelas", icon: BookOpen, action: () => router.push("/dashboard/enrollment"), visible: isSuperadmin },
    { label: "Catat Kas", icon: Wallet, action: () => router.push("/dashboard/kas"), visible: isSuperadmin },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 md:p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      
      <div className="flex items-center justify-between space-y-2">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">
                Selamat datang kembali, {user.name} 👋
            </p>
        </div>
      </div>

      {isSuperadmin ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Murid</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.stats.total_murid || 0}</div>
                <p className="text-xs text-muted-foreground">
                  +{data?.stats.new_murid_this_month || 0} bulan ini
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Guru</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.stats.total_guru || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Tenaga pengajar aktif
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Kelas Aktif</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.stats.kelas_aktif || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Sesi berjalan saat ini
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estimasi Omset</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Rp -</div>
                <p className="text-xs text-muted-foreground">
                  Belum tersedia
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Pendaftaran Terbaru</CardTitle>
                <CardDescription>
                  5 pendaftaran murid terakhir di sistem.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Murid</TableHead>
                        <TableHead>Program</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Tanggal</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data?.latest_enrollments?.map((enrollment) => (
                            <TableRow key={enrollment.id}>
                                <TableCell className="font-medium">{enrollment.murid_nama}</TableCell>
                                <TableCell>{enrollment.program_nama}</TableCell>
                                <TableCell>
                                    <Badge variant={enrollment.status === 'Aktif' ? 'default' : 'secondary'}>
                                        {enrollment.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">{enrollment.created_at}</TableCell>
                            </TableRow>
                        ))}
                        {(!data?.latest_enrollments || data.latest_enrollments.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    Belum ada data pendaftaran.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Aktivitas Terbaru</CardTitle>
                <CardDescription>
                  Audit log aktivitas sistem
                </CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="space-y-8">
                    {data?.recent_activities?.map((activity, i) => (
                        <div className="flex items-center" key={i}>
                            <div className="space-y-1">
                                <p className="text-sm font-medium leading-none">{activity.description}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    {activity.causer}
                                    <span className="text-[10px]">&bull;</span>
                                    <span className="text-xs">{activity.created_at}</span>
                                </p>
                            </div>
                            <div className="ml-auto font-medium text-xs text-muted-foreground capitalize">
                                 {activity.event}
                            </div>
                        </div>
                    ))}
                     {(!data?.recent_activities || data.recent_activities.length === 0) && (
                         <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">
                             Belum ada aktivitas.
                         </div>
                     )}
                 </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>
             Anda masuk sebagai {role}. Gunakan menu shortcut di bawah untuk navigasi cepat.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
           {shortcuts.filter(s => s.visible).map((s, i) => (
                <Button key={i} variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2" onClick={s.action}>
                    <s.icon className="h-6 w-6 mb-1" />
                    <span className="font-medium">{s.label}</span>
                </Button>
           ))}
       </div>
    </div>
  );
}
