"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sesiApi } from "../api/sesi.api";
import { Sesi } from "../types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, User, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DetailSesiProps {
  kelasId: number;
  sessionId: number;
}

export function DetailSesiClient({ kelasId, sessionId }: DetailSesiProps) {
  const router = useRouter();
  const [session, setSession] = useState<Sesi | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      setLoading(true);
      try {
        const data = await sesiApi.getSesiDetail(sessionId);
        setSession(data);
      } catch (error) {
        console.error("Failed to fetch session detail", error);
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchSession();
    }
  }, [sessionId]);

  if (loading) {
    return <div className="p-8 space-y-4">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-64 w-full" />
    </div>;
  }

  if (!session) {
    return <div className="p-8">Sesi tidak ditemukan</div>;
  }

  const statusVariant = 
    session.status_sesi === "TERJADWAL" ? "secondary" :
    session.status_sesi === "BERJALAN" ? "default" :
    session.status_sesi === "SELESAI" ? "default" : // success
    session.status_sesi === "BATAL" ? "destructive" : "outline";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Detail Sesi</h1>
        <Badge variant={statusVariant}>{session.status_sesi}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle>Informasi Sesi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                            {format(new Date(session.tanggal), "eeee, dd MMMM yyyy", { locale: localeId })}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                            {session.jam_mulai_plan?.slice(0,5)} - {session.jam_selesai_plan?.slice(0,5)}
                        </span>
                    </div>
                     <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{session.ruangan_kelas || "Ruang Default"}</span>
                    </div>
                </div>

                <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">Pengajar</span>
                    </div>
                    <div>
                        {session.guru_pengganti ? (
                             <div className="flex flex-col">
                                <span className="font-medium text-destructive">{session.guru_pengganti.user?.name} (Pengganti)</span>
                                <span className="text-sm text-muted-foreground line-through">{session.guru_pengajar?.user?.name}</span>
                             </div>
                        ) : (
                            <span className="font-medium">{session.guru_pengajar?.user?.name || "Belum ditentukan"}</span>
                        )}
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                        Kehadiran Guru: <Badge variant="outline" className="ml-1">{session.status_kehadiran_guru}</Badge>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* Action Panel or Stats */}
        <Card>
            <CardHeader>
                <CardTitle>Tindakan</CardTitle>
            </CardHeader>
             <CardContent className="space-y-2">
                <Button className="w-full" variant="outline" disabled>Edit Sesi (Coming Soon)</Button>
                <Button className="w-full" variant="secondary" onClick={() => sesiApi.syncAnggota(sessionId)}>Sync Peserta</Button>
            </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="absensi" className="w-full">
        <TabsList>
            <TabsTrigger value="absensi">Absensi Siswa</TabsTrigger>
            <TabsTrigger value="logbook">Logbook & Materi</TabsTrigger>
        </TabsList>
        <TabsContent value="absensi" className="p-4 border rounded-md mt-2">
            <div className="text-center py-8 text-muted-foreground">Modul Absensi (Under Construction)</div>
        </TabsContent>
        <TabsContent value="logbook" className="p-4 border rounded-md mt-2">
             <div className="text-center py-8 text-muted-foreground">Modul Logbook (Under Construction)</div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
