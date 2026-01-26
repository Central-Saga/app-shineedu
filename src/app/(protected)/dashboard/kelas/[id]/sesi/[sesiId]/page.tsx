"use client";

import { useEffect, useState, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, Clock, MapPin, User, AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import { sesiApi } from "@/features/sesi/api/sesi.api";
import { Sesi, AbsensiItem, LogbookSesi, LogbookMuridItem } from "@/features/sesi/types";
import { AbsensiEditor } from "@/features/sesi/components/AbsensiEditor";
import { LogbookSesiForm } from "@/features/sesi/components/LogbookSesiForm";
import { LogbookMuridEditor } from "@/features/sesi/components/LogbookMuridEditor";
import { EditSesiDialog } from "@/features/sesi/components/EditSesiDialog";
import { authStore } from "@/modules/auth/infrastructure/auth.store";

export default function SesiDetailPage({ 
    params 
}: { 
    params: Promise<{ id: string; sesiId: string }> 
}) {
  const { allowed } = usePermissionGuard("session.view");
  const resolvedParams = use(params);
  const sesiId = Number(resolvedParams.sesiId);
  const kelasId = Number(resolvedParams.id);
  const router = useRouter();

  const [sesi, setSesi] = useState<Sesi | null>(null);
  const [absensi, setAbsensi] = useState<AbsensiItem[]>([]);
  const [logbook, setLogbook] = useState<LogbookSesi>({ sesi_id: sesiId });
  const [logbookMurid, setLogbookMurid] = useState<LogbookMuridItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Permissions
  const canUpdate = authStore.hasPermission("session.update");
  const canManageAbsensi = authStore.hasPermission("session.attendance.manage");
  const canManageLogbook = authStore.hasPermission("session.logbook.manage");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sesiRes, absensiRes, logbookRes, logbookMuridRes] = await Promise.all([
           sesiApi.getSesiDetail(sesiId),
           sesiApi.getAbsensi(sesiId),
           sesiApi.getLogbook(sesiId),
           sesiApi.getLogbookMurid(sesiId)
      ]);

      setSesi(sesiRes);
      setAbsensi(absensiRes);
      if (logbookRes) setLogbook(logbookRes);
      setLogbookMurid(logbookMuridRes);

    } catch (e: any) {
      toast.error("Gagal memuat detail sesi: " + (e.message || "Unknown error"));
      router.replace(`/dashboard/kelas/${kelasId}`);
    } finally {
      setLoading(false);
    }
  }, [sesiId, kelasId, router]);

  useEffect(() => {
    if (!allowed) return;
    fetchData();
  }, [allowed, fetchData]);

  const handleSyncAnggota = async () => {
    try {
        toast.loading("Menyelaraskan anggota...");
        await sesiApi.syncAnggota(sesiId);
        // Refresh data
        await fetchData();
        toast.dismiss();
        toast.success("Data anggota berhasil diselaraskan");
    } catch (e: any) {
        toast.dismiss();
        toast.error(e.message || "Gagal sync anggota");
    }
  };

  if (!allowed) return null;
  if (loading && !sesi) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;
  if (!sesi) return null;

  const isPrivate = sesi.kelas?.tipe_kelas === "PRIVATE";

  return (
    <div className="space-y-6 pb-10">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
             <div className="flex items-center gap-3">
                 <Button variant="outline" size="icon" onClick={() => router.back()}>
                     <ArrowLeft className="h-4 w-4" />
                 </Button>
                 <div>
                     <h1 className="text-2xl font-bold tracking-tight">Detail Sesi</h1>
                     <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                         <span className="font-semibold text-foreground">{sesi.kelas?.nama_kelas}</span>
                         <span>•</span>
                         <span>{format(new Date(sesi.tanggal), "eeee, dd MMMM yyyy", { locale: idLocale })}</span>
                     </div>
                 </div>
             </div>
             <div className="flex items-center gap-2">
                 <Badge variant={sesi.status_sesi === "BERJALAN" ? "default" : "outline"}>
                     {sesi.status_sesi}
                 </Badge>
                  {canUpdate && (
                      <EditSesiDialog sesi={sesi} onSuccess={() => fetchData()} />
                  )}
                  {canManageAbsensi && (
                     <Button variant="outline" size="sm" onClick={handleSyncAnggota}>
                         <RefreshCw className="mr-2 h-3.5 w-3.5" /> Sync Anggota
                     </Button>
                  )}
             </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Info */}
            <div className="lg:col-span-1 space-y-6">
                 <Card className="h-full">
                     <CardHeader>
                         <CardTitle className="text-base">Informasi Sesi</CardTitle>
                     </CardHeader>
                     <CardContent className="space-y-4">
                         <div className="flex items-start gap-3">
                             <Clock className="mt-1 h-4 w-4 text-muted-foreground" />
                             <div>
                                 <p className="text-xs font-medium text-muted-foreground">Jadwal</p>
                                 <p className="text-sm font-medium">{sesi.jam_mulai_plan?.slice(0,5) || "-"} - {sesi.jam_selesai_plan?.slice(0,5) || "-"}</p>
                             </div>
                         </div>
                          <div className="flex items-start gap-3">
                             <User className="mt-1 h-4 w-4 text-muted-foreground" />
                             <div>
                                 <p className="text-xs font-medium text-muted-foreground">Guru Pengajar</p>
                                 <p className="text-sm font-medium">
                                     {sesi.guru_pengganti ? (
                                         <span className="text-amber-600">{sesi.guru_pengganti.user?.name} (Pengganti)</span>
                                     ) : (
                                         <span>{sesi.guru_pengajar?.user?.name || "-"}</span>
                                     )}
                                 </p>
                                 <p className="text-xs text-muted-foreground mt-0.5">Kehadiran: {sesi.status_kehadiran_guru}</p>
                             </div>
                         </div>
                         <div className="flex items-start gap-3">
                             <MapPin className="mt-1 h-4 w-4 text-muted-foreground" />
                             <div>
                                 <p className="text-xs font-medium text-muted-foreground">Ruangan</p>
                                 <p className="text-sm font-medium">{sesi.ruangan_kelas || "-"}</p>
                             </div>
                         </div>
                         {sesi.alasan_batal && (
                             <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
                                 <strong>Alasan Batal:</strong> {sesi.alasan_batal}
                             </div>
                         )}
                     </CardContent>
                 </Card>
            </div>

            {/* Right Logic */}
            <div className="lg:col-span-2">
                 <Tabs defaultValue="absensi" className="w-full">
                     <TabsList className="mb-4 flex-wrap h-auto">
                         <TabsTrigger value="absensi">Absensi ({absensi.length})</TabsTrigger>
                         <TabsTrigger value="logbook">Logbook Sesi</TabsTrigger>
                         <TabsTrigger value="logbook-murid" className="flex items-center gap-2">
                             Logbook Murid
                             {sesi.status_sesi === "SELESAI" && logbookMurid.length === 0 && (
                                 <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                             )}
                         </TabsTrigger>
                         {/* <TabsTrigger value="settings">Pengaturan</TabsTrigger> */}
                     </TabsList>

                     <TabsContent value="absensi">
                         <Card>
                             <CardContent className="pt-6">
                                 <AbsensiEditor 
                                     sesi={sesi} 
                                     absensi={absensi} 
                                     canEdit={canManageAbsensi} 
                                     onSuccess={() => fetchData()}
                                 />
                             </CardContent>
                         </Card>
                     </TabsContent>

                     <TabsContent value="logbook">
                         <Card>
                             <CardContent className="pt-6">
                                 <LogbookSesiForm 
                                     sesi={sesi} 
                                     logbook={logbook} 
                                     canEdit={canManageLogbook} 
                                 />
                             </CardContent>
                         </Card>
                     </TabsContent>

                     <TabsContent value="logbook-murid">
                         <Card>
                             <CardContent className="pt-6">
                                 <LogbookMuridEditor 
                                     sesi={sesi} 
                                     logbookMurid={logbookMurid} 
                                     canEdit={canManageLogbook} 
                                 />
                             </CardContent>
                         </Card>
                     </TabsContent>
                 </Tabs>
            </div>
        </div>
    </div>
  );
}
