"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getRealisasiJadwalUsecase } from "@/modules/realisasi-jadwal-kerja/application/usecases/getRealisasiJadwal.usecase";
import { authStore } from "@/modules/auth/infrastructure/auth.store";
import type { RealisasiJadwal } from "@/modules/realisasi-jadwal-kerja/domain/entities";
import { NotFoundError } from "@/shared/infrastructure/api/errors";
import { toast } from "sonner";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Pencil, 
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileText,
  UserCheck,
  Hash,
  Database,
  Activity
} from "lucide-react";

function DetailItem({ icon: Icon, label, value, badge }: { icon: React.ElementType, label: string, value: string | null | undefined, badge?: boolean }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-200">
      <div className="mt-0.5 p-2 rounded-lg bg-secondary text-secondary-foreground shrink-0 text-slate-500">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground font-medium mb-0.5">{label}</p>
        <div className="truncate">
          {badge && value ? (
            <Badge variant="outline" className="font-semibold capitalize">
              {value}
            </Badge>
          ) : (
            <div className="text-sm font-semibold text-foreground">{value || "-"}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RealisasiJadwalDetailPage() {
  const { allowed } = usePermissionGuard("realisasi_jadwal_kerja.view");
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [realisasi, setRealisasi] = useState<RealisasiJadwal | null>(null);
  const [loading, setLoading] = useState(true);

  const canUpdate = authStore.hasPermission("realisasi_jadwal_kerja.update");
  const { setItems } = useBreadcrumbStore();

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Realisasi Jadwal Kerja", href: "/realisasi-jadwal-kerja" },
      { label: "Detail Realisasi" },
    ]);
  }, [setItems]);

  useEffect(() => {
    if (!allowed || !id || Number.isNaN(id)) return;
    
    const fetchData = async () => {
      try {
        const data = await getRealisasiJadwalUsecase(id);
        setRealisasi(data);
      } catch (e) {
        if (e instanceof NotFoundError) {
          toast.error("Realisasi tidak ditemukan");
          router.replace("/realisasi-jadwal-kerja");
        } else {
          toast.error("Gagal memuat data realisasi");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [allowed, id, router]);

  if (!allowed) return null;

  if (loading) {
    return (
      <div className="w-full space-y-6 animate-pulse">
        <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
            </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-lg" />
          <div className="lg:col-span-2 space-y-6">
             <Skeleton className="h-64 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!realisasi) return null;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "disetujui":
        return { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" };
      case "ditolak":
        return { icon: XCircle, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" };
      default:
        return { icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" };
    }
  };

  const statusConfig = getStatusConfig(realisasi.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="w-full pb-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => router.back()} 
            className="h-9 w-9"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight">
              {realisasi.jadwal_kerja?.mata_pelajaran || "Realisasi Jadwal"}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="font-mono text-[10px] px-2 py-0 border">
                 {new Date(realisasi.tanggal).toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </Badge>
              <Badge variant="outline" className={`${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}`}>
                {realisasi.status}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canUpdate && (
            <Button asChild>
              <Link href={`/realisasi-jadwal-kerja/${realisasi.id}/edit`}>
                <Pencil className="mr-2 size-4" />
                Edit Realisasi
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Summary Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center pb-6 border-b mb-4">
                 <div className={`size-20 ${statusConfig.bg} rounded-full flex items-center justify-center mb-4 border`}>
                   <StatusIcon className={`size-10 ${statusConfig.color}`} />
                 </div>
                 <h2 className="text-xl font-bold capitalize">{realisasi.status}</h2>
                 <p className="text-sm text-muted-foreground mt-1 font-medium">
                   Sumber: {realisasi.sumber || "Sistem"}
                 </p>
                 <div className="flex flex-wrap justify-center gap-2 mt-4">
                    <Badge variant="outline">
                      ID #{realisasi.id}
                    </Badge>
                 </div>
              </div>

              <div className="space-y-1">
                 <DetailItem icon={Calendar} label="Dibuat" value={realisasi.created_at ? new Date(realisasi.created_at).toLocaleString("id-ID") : "-"} />
                 <DetailItem icon={Clock} label="Terakhir Update" value={realisasi.updated_at ? new Date(realisasi.updated_at).toLocaleString("id-ID") : "-"} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Detailed Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
             <CardHeader className="py-4 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Clock className="size-4" /> Referensi Jadwal
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
                <DetailItem icon={FileText} label="Mata Pelajaran" value={realisasi.jadwal_kerja?.mata_pelajaran} />
                <DetailItem icon={Calendar} label="Hari Terjadwal" value={realisasi.jadwal_kerja?.hari} />
                <DetailItem icon={Clock} label="Waktu Terjadwal" value={`${realisasi.jadwal_kerja?.jam_mulai} - ${realisasi.jadwal_kerja?.jam_selesai}`} />
                <DetailItem icon={Hash} label="Nomor Sesi" value={realisasi.jadwal_kerja?.nomor_sesi ? String(realisasi.jadwal_kerja.nomor_sesi) : "-"} />
                <DetailItem icon={MapPin} label="Ruangan (Aktual)" value={realisasi.ruangan_kelas || realisasi.jadwal_kerja?.ruangan_kelas || "Tidak ditentukan"} />
              </div>
            </CardContent>
          </Card>

          <Card>
             <CardHeader className="py-4 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <UserCheck className="size-4" /> Tenaga Pengajar
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
                <DetailItem icon={User} label="Guru Pengajar" value={realisasi.guru_pengajar?.user?.name || realisasi.jadwal_kerja?.guru_pengajar?.user?.name || "-"} />
                <DetailItem icon={UserCheck} label="Guru Pengganti" value={realisasi.guru_pengganti?.user?.name || "Tidak ada pengganti"} />
              </div>

               {(realisasi.guru_pengganti || realisasi.guru_pengajar || realisasi.jadwal_kerja?.guru_pengajar) && (
                  <div className="mt-6">
                     <Button variant="outline" size="sm" className="w-full" asChild>
                      <a href={`https://wa.me/${(realisasi.guru_pengganti?.kontak?.nomor_hp || realisasi.guru_pengajar?.kontak?.nomor_hp || realisasi.jadwal_kerja?.guru_pengajar?.kontak?.nomor_hp || "").replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                        Hubungi Guru Aktif via WhatsApp
                      </a>
                    </Button>
                  </div>
               )}
            </CardContent>
          </Card>

          {realisasi.catatan && (
            <Card>
                <CardHeader className="py-4 border-b">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <FileText className="size-4" /> Catatan / Keterangan
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="p-4 bg-slate-50/50 rounded-lg border text-sm text-slate-600 leading-relaxed italic">
                        &quot;{realisasi.catatan}&quot;
                    </div>
                </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
