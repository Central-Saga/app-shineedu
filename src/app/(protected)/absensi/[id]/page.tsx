"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { getAbsensiDetailUsecase } from "@/modules/absensi/application/usecases/getAbsensiDetail.usecase";
import { Absensi } from "@/modules/absensi/domain/entities";
import { NotFoundError } from "@/shared/infrastructure/api/errors";
import { toast } from "sonner";
import { 
  Calendar, 
  Clock, 
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileText,
  Camera,
  Navigation,
  ExternalLink,
  User
} from "lucide-react";

function DetailItem({ icon: Icon, label, value, badge, variant = "primary" }: { icon: React.ElementType, label: string, value: string | null | undefined, badge?: boolean, variant?: any }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <div className="mt-0.5 p-2 rounded-lg bg-secondary text-secondary-foreground shrink-0 text-slate-500">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground font-medium mb-0.5">{label}</p>
        <div className="">
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

export default function AbsensiDetailPage() {
  const { allowed } = usePermissionGuard("absensi.view");
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [absensi, setAbsensi] = useState<Absensi | null>(null);
  const [loading, setLoading] = useState(true);

  const { setItems } = useBreadcrumbStore();

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Absensi", href: "/absensi" },
      { label: "Detail Absensi" },
    ]);
  }, [setItems]);

  useEffect(() => {
    if (!allowed || !id || Number.isNaN(id)) return;
    
    const fetchData = async () => {
      try {
        const data = await getAbsensiDetailUsecase(id);
        setAbsensi(data);
      } catch (e) {
        if (e instanceof NotFoundError) {
          toast.error("Data absensi tidak ditemukan");
          router.replace("/absensi");
        } else {
          toast.error("Gagal memuat data absensi");
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

  if (!absensi) return null;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "hadir":
        return { icon: CheckCircle2, variant: "outline", className: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Hadir" };
      case "sakit":
        return { icon: AlertCircle, variant: "outline", className: "bg-amber-50 text-amber-700 border-amber-200", label: "Sakit" };
      case "izin":
        return { icon: FileText, variant: "outline", className: "bg-indigo-50 text-indigo-700 border-indigo-200", label: "Izin" };
      case "cuti":
        return { icon: Calendar, variant: "outline", className: "bg-blue-50 text-blue-700 border-blue-200", label: "Cuti" };
      case "alpha":
        return { icon: XCircle, variant: "outline", className: "bg-rose-50 text-rose-700 border-rose-200", label: "Alpha" };
      default:
        return { icon: AlertCircle, variant: "secondary", className: "", label: status };
    }
  };

  const statusConfig = getStatusConfig(absensi.status_kehadiran);
  const googleMapsUrl = absensi.latitude && absensi.longitude 
    ? `https://www.google.com/maps/search/?api=1&query=${absensi.latitude},${absensi.longitude}`
    : null;

  return (
    <div className="w-full pb-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.back()} className="h-9 w-9">
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight">Detail Absensi</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="font-mono text-[10px] px-2 py-0 border">
                 {new Date(absensi.tanggal).toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </Badge>
              <Badge variant={statusConfig.variant as any} className={statusConfig.className}>
                {statusConfig.label}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center pb-6 border-b mb-4">
                 <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4 border">
                    <User className="size-10" />
                 </div>
                 <h2 className="text-xl font-bold">{absensi.karyawan_nama}</h2>
                 <p className="text-sm text-muted-foreground mt-1 font-medium">
                    {absensi.karyawan?.kode_karyawan || "-"}
                 </p>
                 <div className="flex flex-wrap justify-center gap-2 mt-4">
                   <Badge variant="outline">
                     Sumber: {absensi.sumber_absen || "Sistem"}
                   </Badge>
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="size-8 bg-secondary rounded-lg flex items-center justify-center text-muted-foreground shrink-0">
                       <Navigation className="size-4" />
                    </div>
                    <div className="w-full">
                       <p className="text-xs text-muted-foreground font-medium mb-0.5">Titik Koordinat</p>
                       <p className="text-sm font-semibold truncate">
                          {absensi.latitude && absensi.longitude 
                            ? `${absensi.latitude}, ${absensi.longitude}` 
                            : "Tidak ada data"}
                       </p>
                       {googleMapsUrl && (
                        <Button asChild variant="outline" size="sm" className="w-full mt-2 h-8 text-xs">
                            <a href={googleMapsUrl} target="_blank" rel="noreferrer">
                            <ExternalLink className="mr-2 size-3" />
                            Lihat Peta
                            </a>
                        </Button>
                       )}
                    </div>
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="py-4 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Clock className="size-4" /> Waktu Kehadiran
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
                 <DetailItem icon={Clock} label="Jam Masuk" value={absensi.jam_masuk || "-"} />
                 <DetailItem icon={Clock} label="Jam Pulang" value={absensi.jam_pulang || "-"} />
                 <DetailItem icon={Clock} label="Total Durasi" value={absensi.durasi_formatted || "-"} />
                 <DetailItem icon={Calendar} label="Tanggal" value={absensi.tanggal} />
               </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-4 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Camera className="size-4" /> Dokumentasi Foto
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground text-center">Foto Masuk</p>
                  <div className="aspect-square bg-muted rounded-lg overflow-hidden border flex items-center justify-center relative group">
                    {absensi.foto_masuk_url ? (
                      <Image 
                        src={absensi.foto_masuk_url} 
                        alt="Foto Masuk" 
                        fill
                        unoptimized
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-muted-foreground/50">
                        <Camera className="size-10 mb-2" />
                        <p className="text-[10px] font-bold">TIDAK ADA FOTO</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground text-center">Foto Pulang</p>
                  <div className="aspect-square bg-muted rounded-lg overflow-hidden border flex items-center justify-center relative group">
                    {absensi.foto_pulang_url ? (
                      <Image 
                        src={absensi.foto_pulang_url} 
                        alt="Foto Pulang" 
                        fill
                        unoptimized
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-muted-foreground/50">
                        <Camera className="size-10 mb-2" />
                        <p className="text-[10px] font-bold">TIDAK ADA FOTO</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {absensi.catatan && (
            <Card>
                <CardHeader className="py-4 border-b">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <FileText className="size-4" /> Catatan / Keterangan
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                   <div className="p-3 bg-slate-50 rounded-lg text-sm text-muted-foreground leading-relaxed italic border border-slate-100">
                      &quot;{absensi.catatan}&quot;
                   </div>
                </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
