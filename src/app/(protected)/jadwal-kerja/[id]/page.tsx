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
import { getJadwalKerjaUsecase } from "@/modules/jadwal-kerja/application/usecases/getJadwalKerja.usecase";
import { authStore } from "@/modules/auth/infrastructure/auth.store";
import type { JadwalKerja } from "@/modules/jadwal-kerja/domain/entities";
import { NotFoundError } from "@/shared/infrastructure/api/errors";
import { toast } from "sonner";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Pencil, 
  ArrowLeft,
  Banknote,
  Tag,
  Hash,
  Activity
} from "lucide-react";

function DetailItem({ icon: Icon, label, value, badge, variant = "rose" }: { icon: React.ElementType, label: string, value: string | null | undefined, badge?: boolean, variant?: "rose" | "amber" | "emerald" | "blue" }) {
  const bgClass = variant === "rose" ? "bg-rose-50 text-rose-500" : 
                  variant === "amber" ? "bg-amber-50 text-amber-500" :
                  variant === "emerald" ? "bg-emerald-50 text-emerald-500" : "bg-blue-50 text-blue-500";
  
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
              {value.replace("_", " ")}
            </Badge>
          ) : (
            <p className="text-slate-700 font-semibold text-sm leading-tight">{value || "-"}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function JadwalKerjaDetailPage() {
  const { allowed } = usePermissionGuard("jadwal_kerja.view");
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [jadwal, setJadwal] = useState<JadwalKerja | null>(null);
  const [loading, setLoading] = useState(true);

  const canUpdate = authStore.hasPermission("jadwal_kerja.update");
  const { setItems } = useBreadcrumbStore();

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Jadwal Kerja", href: "/jadwal-kerja" },
      { label: "Detail Jadwal" },
    ]);
  }, [setItems]);

  useEffect(() => {
    if (!allowed || !id || Number.isNaN(id)) return;
    
    const fetchData = async () => {
      try {
        const data = await getJadwalKerjaUsecase(id);
        setJadwal(data);
      } catch (e) {
        if (e instanceof NotFoundError) {
          toast.error("Jadwal tidak ditemukan");
          router.replace("/jadwal-kerja");
        } else {
          toast.error("Gagal memuat data jadwal");
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
        <PageHeader title="Detail Jadwal" description="Memuat data..." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 md:col-span-2 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!jadwal) return null;

  const formatCurrency = (val: number | string | null | undefined) => {
    if (val === null || val === undefined || val === "") return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(val));
  };

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
            {jadwal.mata_pelajaran || "Detail Jadwal"}
          </h1>
          <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
            <span className="font-medium">{jadwal.hari}</span> 
            <span className="text-slate-200">|</span>
            <span className="font-medium">{jadwal.jam_mulai} - {jadwal.jam_selesai}</span>
            <span className="text-slate-200">|</span>
            <Badge 
              variant="outline" 
              className={jadwal.status === "Aktif" 
                ? "border-emerald-200 bg-emerald-50/50 text-emerald-600 h-5 px-2 text-[10px] font-bold" 
                : "border-rose-100 bg-rose-50/50 text-rose-600 h-5 px-2 text-[10px] font-bold"
              }
            >
              {jadwal.status}
            </Badge>
          </div>
        </div>
        <div className="ml-auto">
          {canUpdate && (
            <Button asChild className="rounded-2xl px-6 h-11 bg-rose-700 hover:bg-rose-800 shadow-lg shadow-rose-200 transition-all hover:scale-105 active:scale-95">
              <Link href={`/jadwal-kerja/${jadwal.id}/edit`}>
                <Pencil className="mr-2 size-4" />
                Edit Jadwal
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Summary Card */}
        <div className="lg:col-span-1 space-y-8">
          <Card className="rounded-[2.5rem] border-none shadow-premium overflow-hidden ring-1 ring-slate-100 p-0">
            <div className="h-32 bg-linear-to-br from-rose-700 via-rose-600 to-amber-500" />
            <div className="px-8 pb-10 -mt-14 text-center relative z-10">
              <div className="inline-flex p-1.5 bg-white rounded-3xl shadow-xl mb-4 ring-8 ring-white/50">
                <div className="size-24 bg-slate-50 rounded-[1.25rem] flex items-center justify-center text-slate-300">
                  <Calendar className="size-10 text-rose-500" />
                </div>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 leading-tight mb-2 uppercase tracking-wide">
                {jadwal.kategori.replace("_", " ")}
              </h2>
              <p className="text-sm font-bold text-slate-500 mb-8 italic">
                &quot;{jadwal.mata_pelajaran}&quot;
              </p>
              
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="secondary" className="bg-rose-50 text-rose-700 h-7 px-4 text-xs rounded-full border-transparent font-bold">
                  Sesi {jadwal.nomor_sesi}
                </Badge>
                {jadwal.ruangan_kelas && (
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 h-7 px-4 text-xs rounded-full border-transparent font-bold">
                    {jadwal.ruangan_kelas}
                  </Badge>
                )}
              </div>
            </div>
          </Card>

          <Card className="rounded-3xl border-none shadow-premium ring-1 ring-slate-100 overflow-hidden py-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-rose-50 rounded-xl">
                  <Banknote className="size-4 text-rose-600" />
                </div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Informasi Finance</h3>
              </div>
              <div className="space-y-1">
                <DetailItem icon={Banknote} label="Tarif Pengajaran" value={formatCurrency(jadwal.tarif)} variant="rose" />
                <DetailItem icon={Tag} label="Kategori Jadwal" value={jadwal.kategori} badge variant="amber" />
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
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Waktu & Lokasi</h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5 tracking-tight">Detail pelaksanaan kegiatan</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-2">
                <DetailItem icon={Calendar} label="Hari Pelaksanaan" value={jadwal.hari} variant="blue" />
                <DetailItem icon={Hash} label="Nomor Sesi" value={String(jadwal.nomor_sesi)} variant="blue" />
                <DetailItem icon={Clock} label="Waktu Mulai" value={jadwal.jam_mulai} variant="blue" />
                <DetailItem icon={Clock} label="Waktu Selesai" value={jadwal.jam_selesai} variant="blue" />
                <DetailItem icon={MapPin} label="Ruangan / Kelas" value={jadwal.ruangan_kelas || "Tidak ditentukan"} variant="blue" />
                <DetailItem icon={Activity} label="Status Aktif" value={jadwal.status} variant="blue" badge />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none shadow-premium ring-1 ring-slate-100 overflow-hidden py-0">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-emerald-50 rounded-xl">
                  <User className="size-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Tenaga Pengajar</h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5 tracking-tight">Informasi guru yang bertugas</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-2">
                <DetailItem icon={User} label="Nama Lengkap" value={jadwal.guru_pengajar?.user?.name || "-"} variant="emerald" />
                <DetailItem icon={Tag} label="Kategori Karyawan" value={jadwal.guru_pengajar?.kategori_karyawan} variant="emerald" badge />
                <DetailItem icon={Hash} label="Kode Karyawan" value={jadwal.guru_pengajar?.kode_karyawan || "-"} variant="emerald" />
              </div>
              
              {jadwal.guru_pengajar?.kontak?.nomor_hp && (
                <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex flex-col">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Kontak Guru</p>
                    <p className="text-slate-700 font-bold">{jadwal.guru_pengajar.kontak.nomor_hp}</p>
                  </div>
                  <Button variant="outline" className="rounded-xl border-emerald-100 text-emerald-600 hover:bg-emerald-50 font-bold" asChild>
                    <a href={`https://wa.me/${jadwal.guru_pengajar.kontak.nomor_hp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                      Hubungi Guru
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
