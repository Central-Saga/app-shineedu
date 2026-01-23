"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { getAbsensiDetailUsecase } from "@/modules/absensi/application/usecases/getAbsensiDetail.usecase";
import type { Absensi } from "@/modules/absensi/domain/entities";
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
  ExternalLink
} from "lucide-react";

function DetailItem({ icon: Icon, label, value, badge, variant = "blue" }: { icon: React.ElementType, label: string, value: string | null | undefined, badge?: boolean, variant?: "rose" | "amber" | "emerald" | "blue" | "slate" | "indigo" }) {
  const bgClass = variant === "rose" ? "bg-rose-50 text-rose-500" : 
                  variant === "amber" ? "bg-amber-50 text-amber-500" :
                  variant === "emerald" ? "bg-emerald-50 text-emerald-500" : 
                  variant === "indigo" ? "bg-indigo-50 text-indigo-500" :
                  variant === "slate" ? "bg-slate-100 text-slate-500" : "bg-blue-50 text-blue-500";
  
  const badgeClass = variant === "rose" ? "bg-rose-50 text-rose-600" : 
                     variant === "amber" ? "bg-amber-50 text-amber-700" :
                     variant === "emerald" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700";

  return (
    <div className="flex items-start gap-4 py-3 border-b last:border-0 border-slate-50/80">
      <div className={`mt-0.5 p-2 rounded-xl shrink-0 ${bgClass}`}>
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">{label}</p>
        <div className="truncate">
          {badge && value ? (
            <Badge variant="secondary" className={`${badgeClass} border-none h-5 px-2.5 text-[10px] font-bold capitalize`}>
              {value}
            </Badge>
          ) : (
            <p className="text-slate-700 font-semibold text-sm leading-tight">{value || "-"}</p>
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
      <div className="space-y-6">
        <PageHeader title="Detail Absensi" description="Memuat data..." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 md:col-span-2 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!absensi) return null;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "hadir":
        return { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", label: "Hadir" };
      case "sakit":
        return { icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", label: "Sakit" };
      case "izin":
        return { icon: FileText, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200", label: "Izin" };
      case "cuti":
        return { icon: Calendar, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", label: "Cuti" };
      case "alpha":
        return { icon: XCircle, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200", label: "Alpha" };
      default:
        return { icon: AlertCircle, color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200", label: status };
    }
  };

  const statusConfig = getStatusConfig(absensi.status_kehadiran);
  const StatusIcon = statusConfig.icon;

  const googleMapsUrl = absensi.latitude && absensi.longitude 
    ? `https://www.google.com/maps/search/?api=1&query=${absensi.latitude},${absensi.longitude}`
    : null;

  return (
    <div className="w-full pb-10">
      <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()} 
          className="rounded-full h-10 w-10 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">
            {absensi.karyawan_nama || "Detail Absensi"}
          </h1>
          <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
            <span className="font-medium">{new Date(absensi.tanggal).toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span> 
            <span className="text-slate-200">|</span>
            <Badge 
              variant="outline" 
              className={`${statusConfig.border} ${statusConfig.bg} ${statusConfig.color} h-5 px-2 text-[10px] font-bold uppercase`}
            >
              {statusConfig.label}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-8">
          <Card className="rounded-[2.5rem] border-none shadow-premium overflow-hidden ring-1 ring-slate-100 p-0">
            <div className={`h-32 bg-linear-to-br from-slate-600 to-slate-500`} />
            <div className="px-8 pb-10 -mt-14 text-center relative z-10">
              <div className="inline-flex p-1.5 bg-white rounded-3xl shadow-xl mb-4 ring-8 ring-white/50">
                <div className="size-24 bg-slate-50 rounded-[1.25rem] flex items-center justify-center">
                  <StatusIcon className={`size-10 ${statusConfig.color}`} />
                </div>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 leading-tight mb-1">
                {absensi.karyawan_nama}
              </h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
                {absensi.karyawan?.kode_karyawan || "-"}
              </p>
              
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="secondary" className="bg-slate-100 text-slate-700 h-7 px-4 text-xs rounded-full border-transparent font-bold capitalize">
                  Sumber: {absensi.sumber_absen || "Sistem"}
                </Badge>
              </div>
            </div>
          </Card>

          <Card className="rounded-3xl border-none shadow-premium ring-1 ring-slate-100 overflow-hidden py-0">
            <CardContent className="p-6 text-center">
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 bg-blue-50 rounded-2xl mb-2">
                  <Navigation className="size-6 text-blue-600" />
                </div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Titik Koordinat</h3>
                <p className="text-sm font-semibold text-slate-600">
                  {absensi.latitude && absensi.longitude 
                    ? `${absensi.latitude}, ${absensi.longitude}` 
                    : "Tidak ada data lokasi"}
                </p>
                {googleMapsUrl && (
                  <Button asChild variant="outline" className="mt-4 rounded-xl border-blue-100 text-blue-600 hover:bg-blue-50 font-bold w-full">
                    <a href={googleMapsUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-2 size-4" />
                      Lihat di Peta
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="rounded-3xl border-none shadow-premium ring-1 ring-slate-100 overflow-hidden py-0">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-blue-50 rounded-xl">
                  <Clock className="size-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Waktu Kehadiran</h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5 tracking-tight">Waktu masuk dan pulang karyawan</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-2">
                <DetailItem icon={Clock} label="Jam Masuk" value={absensi.jam_masuk || "-"} variant="emerald" />
                <DetailItem icon={Clock} label="Jam Pulang" value={absensi.jam_pulang || "-"} variant="rose" />
                <DetailItem icon={Clock} label="Total Durasi" value={absensi.durasi_formatted || "-"} variant="blue" />
                <DetailItem icon={Calendar} label="Tanggal" value={absensi.tanggal} variant="slate" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none shadow-premium ring-1 ring-slate-100 overflow-hidden py-0">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-amber-50 rounded-xl">
                  <Camera className="size-4 text-amber-600" />
                </div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Dokumentasi Foto</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center">Foto Masuk</p>
                  <div className="aspect-square bg-slate-50 rounded-3xl overflow-hidden ring-1 ring-slate-100 flex items-center justify-center relative group">
                    {absensi.foto_masuk_url ? (
                      <Image 
                        src={absensi.foto_masuk_url} 
                        alt="Foto Masuk" 
                        fill
                        unoptimized
                        className="object-cover transition-transform group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-slate-300">
                        <Camera className="size-12 mb-2 opacity-50" />
                        <p className="text-[10px] font-bold">TIDAK ADA FOTO</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center">Foto Pulang</p>
                  <div className="aspect-square bg-slate-50 rounded-3xl overflow-hidden ring-1 ring-slate-100 flex items-center justify-center relative group">
                    {absensi.foto_pulang_url ? (
                      <Image 
                        src={absensi.foto_pulang_url} 
                        alt="Foto Pulang" 
                        fill
                        unoptimized
                        className="object-cover transition-transform group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-slate-300">
                        <Camera className="size-12 mb-2 opacity-50" />
                        <p className="text-[10px] font-bold">TIDAK ADA FOTO</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {absensi.catatan && (
            <Card className="rounded-3xl border-none shadow-premium ring-1 ring-slate-100 overflow-hidden py-0">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <FileText className="size-4 text-slate-600" />
                  </div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Catatan / Keterangan</h3>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-slate-600 text-sm">
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
