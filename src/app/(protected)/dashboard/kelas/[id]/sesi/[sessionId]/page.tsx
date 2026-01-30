"use client";

import { useEffect, useState, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Clock, MapPin, User, AlertTriangle, RefreshCw, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Calendar } from "lucide-react";

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
    params: Promise<{ id: string; sessionId: string }> 
}) {
  const { allowed } = usePermissionGuard("session.view");
  const resolvedParams = use(params);
  const sessionId = Number(resolvedParams.sessionId);
  const kelasId = Number(resolvedParams.id);
  const router = useRouter();

  const [sesi, setSesi] = useState<Sesi | null>(null);
  const [absensi, setAbsensi] = useState<AbsensiItem[]>([]);
  const [logbook, setLogbook] = useState<LogbookSesi>({ sesi_id: sessionId });
  const [logbookMurid, setLogbookMurid] = useState<LogbookMuridItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { setItems } = useBreadcrumbStore();

  // Permissions
  const canUpdate = authStore.hasPermission("session.update");
  const canManageAbsensi = authStore.hasPermission("session.attendance.manage");
  const canManageLogbook = authStore.hasPermission("session.logbook.manage");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sesiRes, absensiRes, logbookRes, logbookMuridRes] = await Promise.all([
           sesiApi.getSesiDetail(sessionId),
           sesiApi.getAbsensi(sessionId),
           sesiApi.getLogbook(sessionId),
           sesiApi.getLogbookMurid(sessionId)
      ]);

      setSesi(sesiRes);
      setAbsensi(absensiRes);
      if (logbookRes) setLogbook(logbookRes);
      setLogbookMurid(logbookMuridRes);

    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      toast.error("Gagal memuat detail sesi: " + message);
      router.replace(`/dashboard/kelas/${kelasId}`);
    } finally {
      setLoading(false);
    }
  }, [sessionId, kelasId, router]);

  useEffect(() => {
    if (!allowed) return;
    fetchData();
  }, [allowed, fetchData]);

  useEffect(() => {
    if (sesi) {
      setItems([
        { label: "Dashboard", href: "/dashboard" },
        { label: "Kelas", href: "/dashboard/kelas" },
        { label: sesi.kelas?.nama_kelas || "Detail Kelas", href: `/dashboard/kelas/${kelasId}` },
        { label: `Sesi ${format(new Date(sesi.tanggal), "dd/MM/yy")}` },
      ]);
    }
  }, [sesi, setItems, kelasId]);

  const handleSyncAnggota = async () => {
    try {
        toast.loading("Menyelaraskan anggota...");
        await sesiApi.syncAnggota(sessionId);
        // Refresh data
        await fetchData();
        toast.dismiss();
        toast.success("Data anggota berhasil diselaraskan");
    } catch (e) {
        toast.dismiss();
        const message = e instanceof Error ? e.message : "Gagal sync anggota";
        toast.error(message);
    }
  };

  if (!allowed) return null;
  if (loading && !sesi) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;
  if (!sesi) return null;

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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => router.push(`/dashboard/kelas/${kelasId}/sesi/${sessionId}/materi-tugas`)}
                  >
                    <BookOpen className="mr-2 h-3.5 w-3.5" /> Materi & Tugas
                  </Button>
             </div>
        </div>

        <Accordion defaultValue="absensi" className="w-full space-y-4">
            {/* Section: Informasi Sesi */}
            <AccordionItem value="info">
                <AccordionTrigger description={`${sesi.jam_mulai_plan?.slice(0,5)} - ${sesi.jam_selesai_plan?.slice(0,5)} • ${sesi.ruangan_kelas || "No Room"}`}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                             <Calendar className="h-4 w-4" />
                        </div>
                        <span className="text-lg font-semibold">Informasi Sesi</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-start gap-3">
                            <Clock className="mt-1 h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Waktu & Jadwal</p>
                                <p className="text-sm font-semibold">{sesi.jam_mulai_plan?.slice(0,5) || "-"} - {sesi.jam_selesai_plan?.slice(0,5) || "-"}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">Hari: {format(new Date(sesi.tanggal), "eeee", { locale: idLocale })}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <User className="mt-1 h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Guru Pengajar</p>
                                <p className="text-sm font-semibold">
                                    {sesi.guru_pengganti ? (
                                        <span className="text-amber-600 font-bold">{sesi.guru_pengganti.user?.name} <Badge variant="outline" className="ml-1 text-[10px] h-4 bg-amber-50 text-amber-700">GURU PENGGANTI</Badge></span>
                                    ) : (
                                        <span>{sesi.guru_pengajar?.user?.name || "-"}</span>
                                    )}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">Status: {sesi.status_kehadiran_guru}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <MapPin className="mt-1 h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Lokasi / Ruangan</p>
                                <p className="text-sm font-semibold">{sesi.ruangan_kelas || "-"}</p>
                            </div>
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>

            {/* Section: Absensi */}
            <AccordionItem value="absensi">
                <AccordionTrigger description={`Total ${absensi.length} Murid Terdaftar`}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                             <User className="h-4 w-4" />
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="text-lg font-semibold">Absensi Murid</span>
                           <Badge variant="secondary" className="rounded-full px-2 py-0 h-5 text-xs font-bold">{absensi.length}</Badge>
                        </div>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <AbsensiEditor 
                        sesi={sesi} 
                        absensi={absensi} 
                        canEdit={canManageAbsensi} 
                        onSuccess={() => fetchData()}
                    />
                </AccordionContent>
            </AccordionItem>

            {/* Section: Logbook Sesi */}
            <AccordionItem value="logbook">
                <AccordionTrigger description="Materi, Pekerjaan Rumah, dan Catatan Sesi">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-rose-100 text-rose-600">
                             <BookOpen className="h-4 w-4" />
                        </div>
                        <span className="text-lg font-semibold">Logbook Sesi & Materi</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <LogbookSesiForm 
                        sesi={sesi} 
                        logbook={logbook} 
                        canEdit={canManageLogbook} 
                        onSuccess={() => fetchData()}
                    />
                </AccordionContent>
            </AccordionItem>

            {/* Section: Logbook Murid */}
            <AccordionItem value="logbook-murid">
                <AccordionTrigger description="Catatan Perkembangan Individu Murid">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                             <User className="h-4 w-4" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-semibold">Logbook Individu Murid</span>
                            {sesi.status_sesi === "SELESAI" && logbookMurid.length === 0 && (
                                <Badge variant="destructive" className="animate-pulse flex items-center gap-1 text-[10px] h-5 py-0">
                                    <AlertTriangle className="h-2.5 w-2.5" /> BUTUH PENGISIAN
                                </Badge>
                            )}
                        </div>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <LogbookMuridEditor 
                        sesi={sesi} 
                        absensi={absensi}
                        logbookMurid={logbookMurid} 
                        canEdit={canManageLogbook} 
                        onSuccess={() => fetchData()}
                    />
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    </div>
  );
}
