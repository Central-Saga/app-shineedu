"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Database
} from "lucide-react";

function DetailItem({ icon: Icon, label, value, badge, variant = "blue" }: { icon: React.ElementType, label: string, value: string | null | undefined, badge?: boolean, variant?: "rose" | "amber" | "emerald" | "blue" | "slate" }) {
  const bgClass = variant === "rose" ? "bg-rose-50 text-rose-500" : 
                  variant === "amber" ? "bg-amber-50 text-amber-500" :
                  variant === "emerald" ? "bg-emerald-50 text-emerald-500" : 
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
      <div className="space-y-6">
        <PageHeader title="Detail Realisasi" description="Memuat data..." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 md:col-span-2 rounded-3xl" />
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
            {realisasi.jadwal_kerja?.mata_pelajaran || "Realisasi Jadwal"}
          </h1>
          <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
            <span className="font-medium">{new Date(realisasi.tanggal).toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span> 
            <span className="text-slate-200">|</span>
            <Badge 
              variant="outline" 
              className={`${statusConfig.border} ${statusConfig.bg} ${statusConfig.color} h-5 px-2 text-[10px] font-bold uppercase`}
            >
              {realisasi.status}
            </Badge>
          </div>
        </div>
        <div className="ml-auto">
          {canUpdate && (
            <Button asChild className="rounded-2xl px-6 h-11 bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-200 transition-all hover:scale-105 active:scale-95">
              <Link href={`/realisasi-jadwal-kerja/${realisasi.id}/edit`}>
                <Pencil className="mr-2 size-4" />
                Edit Realisasi
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Summary Card */}
        <div className="lg:col-span-1 space-y-8">
          <Card className="rounded-[2.5rem] border-none shadow-premium overflow-hidden ring-1 ring-slate-100 p-0">
            <div className={`h-32 ${statusConfig.bg.replace("50", "600")} bg-linear-to-br from-${realisasi.status === 'disetujui' ? 'emerald' : realisasi.status === 'ditolak' ? 'rose' : 'amber'}-600 to-${realisasi.status === 'disetujui' ? 'teal' : realisasi.status === 'ditolak' ? 'orange' : 'orange'}-500`} />
            <div className="px-8 pb-10 -mt-14 text-center relative z-10">
              <div className="inline-flex p-1.5 bg-white rounded-3xl shadow-xl mb-4 ring-8 ring-white/50">
                <div className="size-24 bg-slate-50 rounded-[1.25rem] flex items-center justify-center">
                  <StatusIcon className={`size-10 ${statusConfig.color}`} />
                </div>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 leading-tight mb-2 uppercase tracking-wide">
                {realisasi.status}
              </h2>
              <p className="text-sm font-bold text-slate-500 mb-8 italic">
                Sumber: {realisasi.sumber || "Sistem"}
              </p>
              
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="secondary" className="bg-slate-100 text-slate-700 h-7 px-4 text-xs rounded-full border-transparent font-bold">
                  ID #{realisasi.id}
                </Badge>
              </div>
            </div>
          </Card>

          <Card className="rounded-3xl border-none shadow-premium ring-1 ring-slate-100 overflow-hidden py-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-50 rounded-xl">
                  <Database className="size-4 text-blue-600" />
                </div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Metadata</h3>
              </div>
              <div className="space-y-1">
                <DetailItem icon={Calendar} label="Dibuat" value={realisasi.created_at ? new Date(realisasi.created_at).toLocaleString("id-ID") : "-"} variant="slate" />
                <DetailItem icon={Clock} label="Terakhir Update" value={realisasi.updated_at ? new Date(realisasi.updated_at).toLocaleString("id-ID") : "-"} variant="slate" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Detailed Info */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="rounded-3xl border-none shadow-premium ring-1 ring-slate-100 overflow-hidden py-0">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-blue-50 rounded-xl">
                  <Clock className="size-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Referensi Jadwal</h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5 tracking-tight">Informasi jadwal yang direalisasikan</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-2">
                <DetailItem icon={FileText} label="Mata Pelajaran" value={realisasi.jadwal_kerja?.mata_pelajaran} variant="blue" />
                <DetailItem icon={Calendar} label="Hari Terjadwal" value={realisasi.jadwal_kerja?.hari} variant="blue" />
                <DetailItem icon={Clock} label="Waktu Terjadwal" value={`${realisasi.jadwal_kerja?.jam_mulai} - ${realisasi.jadwal_kerja?.jam_selesai}`} variant="blue" />
                <DetailItem icon={Hash} label="Nomor Sesi" value={realisasi.jadwal_kerja?.nomor_sesi ? String(realisasi.jadwal_kerja.nomor_sesi) : "-"} variant="blue" />
                <DetailItem icon={MapPin} label="Ruangan (Aktual)" value={realisasi.ruangan_kelas || realisasi.jadwal_kerja?.ruangan_kelas || "Tidak ditentukan"} variant="rose" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none shadow-premium ring-1 ring-slate-100 overflow-hidden py-0">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-emerald-50 rounded-xl">
                  <UserCheck className="size-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Tenaga Pengajar</h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5 tracking-tight">Informasi guru yang bertugas</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-2">
                <DetailItem icon={User} label="Guru Pengajar" value={realisasi.guru_pengajar?.user?.name || realisasi.jadwal_kerja?.guru_pengajar?.user?.name || "-"} variant="emerald" />
                <DetailItem icon={UserCheck} label="Guru Pengganti" value={realisasi.guru_pengganti?.user?.name || "Tidak ada pengganti"} variant={realisasi.guru_pengganti ? "amber" : "slate"} />
              </div>
              
              {(realisasi.guru_pengganti || realisasi.guru_pengajar || realisasi.jadwal_kerja?.guru_pengajar) && (
                <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex flex-col">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Kontak Guru Aktif</p>
                    <p className="text-slate-700 font-bold">{realisasi.guru_pengganti?.kontak?.nomor_hp || realisasi.guru_pengajar?.kontak?.nomor_hp || realisasi.jadwal_kerja?.guru_pengajar?.kontak?.nomor_hp || "-"}</p>
                  </div>
                  {(realisasi.guru_pengganti?.kontak?.nomor_hp || realisasi.guru_pengajar?.kontak?.nomor_hp || realisasi.jadwal_kerja?.guru_pengajar?.kontak?.nomor_hp) && (
                    <Button variant="outline" className="rounded-xl border-emerald-100 text-emerald-600 hover:bg-emerald-50 font-bold" asChild>
                      <a href={`https://wa.me/${(realisasi.guru_pengganti?.kontak?.nomor_hp || realisasi.guru_pengajar?.kontak?.nomor_hp || realisasi.jadwal_kerja?.guru_pengajar?.kontak?.nomor_hp || "").replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                        Hubungi Guru
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {realisasi.catatan && (
            <Card className="rounded-3xl border-none shadow-premium ring-1 ring-slate-100 overflow-hidden py-0">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-amber-50 rounded-xl">
                    <FileText className="size-4 text-amber-600" />
                  </div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Catatan / Keterangan</h3>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-slate-600 text-sm">
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
