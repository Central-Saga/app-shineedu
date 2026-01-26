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
              {value.replace("_", " ")}
            </Badge>
          ) : (
            <div className="text-sm font-semibold text-foreground">{value || "-"}</div>
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
              {jadwal.mata_pelajaran || "Detail Jadwal"}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="font-mono text-[10px] px-2 py-0 border">
                 {jadwal.hari}
              </Badge>
              <Badge variant={jadwal.status === "Aktif" ? "outline" : "destructive"} className={jadwal.status === "Aktif" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : ""}>
                {jadwal.status}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canUpdate && (
            <Button asChild>
              <Link href={`/jadwal-kerja/${jadwal.id}/edit`}>
                <Pencil className="mr-2 size-4" />
                Edit Jadwal
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
                 <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4 border">
                   <Calendar className="size-10" />
                 </div>
                 <h2 className="text-xl font-bold capitalize">{jadwal.kategori.replace("_", " ")}</h2>
                 <p className="text-sm text-muted-foreground mt-1 font-medium">
                   {jadwal.mata_pelajaran}
                 </p>
                 <div className="flex flex-wrap justify-center gap-2 mt-4">
                    <Badge variant="outline">
                      Sesi {jadwal.nomor_sesi}
                    </Badge>
                    {jadwal.ruangan_kelas && (
                      <Badge variant="outline">
                        {jadwal.ruangan_kelas}
                      </Badge>
                    )}
                 </div>
              </div>
              <div className="space-y-1">
                <DetailItem icon={Banknote} label="Tarif Pengajaran" value={formatCurrency(jadwal.tarif)} />
                <DetailItem icon={Tag} label="Kategori Jadwal" value={jadwal.kategori} badge />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Detailed Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
             <CardHeader className="py-4 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Clock className="size-4" /> Waktu & Lokasi
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
                <DetailItem icon={Calendar} label="Hari Pelaksanaan" value={jadwal.hari} />
                <DetailItem icon={Hash} label="Nomor Sesi" value={String(jadwal.nomor_sesi)} />
                <DetailItem icon={Clock} label="Waktu Mulai" value={jadwal.jam_mulai} />
                <DetailItem icon={Clock} label="Waktu Selesai" value={jadwal.jam_selesai} />
                <DetailItem icon={MapPin} label="Ruangan / Kelas" value={jadwal.ruangan_kelas || "Tidak ditentukan"} />
                <DetailItem icon={Activity} label="Status Aktif" value={jadwal.status} badge />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-4 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <User className="size-4" /> Tenaga Pengajar
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
                <DetailItem icon={User} label="Nama Lengkap" value={jadwal.guru_pengajar?.user?.name || "-"} />
                <DetailItem icon={Tag} label="Kategori Karyawan" value={jadwal.guru_pengajar?.kategori_karyawan} badge />
                <DetailItem icon={Hash} label="Kode Karyawan" value={jadwal.guru_pengajar?.kode_karyawan || "-"} />
                 <DetailItem icon={Tag} label="Kontak Guru" value={jadwal.guru_pengajar?.kontak?.nomor_hp || "-"} />
              </div>

               {jadwal.guru_pengajar?.kontak?.nomor_hp && (
                  <div className="mt-6">
                     <Button variant="outline" size="sm" className="w-full" asChild>
                      <a href={`https://wa.me/${jadwal.guru_pengajar.kontak.nomor_hp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                        Hubungi Guru via WhatsApp
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
