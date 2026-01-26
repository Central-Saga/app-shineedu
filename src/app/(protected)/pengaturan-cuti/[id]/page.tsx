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
import { authStore } from "@/modules/auth/infrastructure/auth.store";
import { NotFoundError } from "@/shared/infrastructure/api/errors";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Pencil, 
  ShieldCheck, 
  Clock, 
  Settings, 
  Users, 
  BookOpen, 
  Banknote,
  Info 
} from "lucide-react";
import { getPengaturanCutiDetail } from "@/modules/pengaturan-cuti/infrastructure/pengaturan-cuti.repository";
import type { PengaturanCuti } from "@/modules/pengaturan-cuti/domain/entities";

function DetailItem({ icon: Icon, label, value, badge }: { 
  icon: React.ElementType, 
  label: string, 
  value: string | null | undefined, 
  badge?: boolean
}) {
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

export default function PengaturanCutiDetailPage() {
  const { allowed } = usePermissionGuard("pengaturan-cuti.view");
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [data, setData] = useState<PengaturanCuti | null>(null);
  const [loading, setLoading] = useState(true);

  const canUpdate = authStore.hasPermission("pengaturan-cuti.update");
  const { setItems } = useBreadcrumbStore();

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Pengaturan Cuti", href: "/pengaturan-cuti" },
      { label: "Detail Aturan" },
    ]);
  }, [setItems]);

  useEffect(() => {
    if (!allowed || !id || Number.isNaN(id)) return;
    
    const fetchData = async () => {
      try {
        const res = await getPengaturanCutiDetail(id);
        setData(res);
      } catch (e) {
        if (e instanceof NotFoundError) {
          toast.error("Aturan tidak ditemukan");
          router.replace("/pengaturan-cuti");
        } else {
          toast.error("Gagal memuat data aturan");
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

  if (!data) return null;

  return (
    <div className="w-full pb-10 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.back()} className="h-9 w-9">
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight">Aturan {data.jenis.charAt(0).toUpperCase() + data.jenis.slice(1)}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="font-mono text-[10px] px-2 py-0 border">
                 {data.kategori_karyawan}
              </Badge>
              <Badge variant={data.aktif ? "outline" : "destructive"} className={data.aktif ? "bg-emerald-50 text-emerald-700 border-emerald-200" : ""}>
                {data.aktif ? "Aktif" : "Nonaktif"}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canUpdate && (
            <Button asChild>
              <Link href={`/pengaturan-cuti/${data.id}/edit`}>
                <Pencil className="mr-2 size-4" />
                Edit Aturan
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
                   <Settings className="size-10" />
                 </div>
                 <h2 className="text-xl font-bold capitalize">{data.jenis}</h2>
                 <p className="text-sm text-muted-foreground mt-1 font-medium">
                   ID: {data.id}
                 </p>
                 <div className="flex flex-wrap justify-center gap-2 mt-4">
                    <Badge variant="outline">
                      {data.periode}
                    </Badge>
                 </div>
              </div>

              <div className="space-y-1">
                 <DetailItem icon={ShieldCheck} label="Status" value={data.aktif ? "Aktif" : "Nonaktif"} />
                 <DetailItem icon={Users} label="Kategori" value={data.kategori_karyawan} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Detailed Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="py-4 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Users className="size-4" /> Target Kriteria
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
                <DetailItem icon={Users} label="Kategori Karyawan" value={data.kategori_karyawan} badge />
                <DetailItem icon={Users} label="Subtipe Kontrak" value={data.subtipe_kontrak} badge />
                <DetailItem icon={BookOpen} label="Divisi / Kategori" value={data.divisi === "all" ? "Semua Divisi" : data.divisi} badge />
                <DetailItem icon={Info} label="Jenis Pengajuan" value={data.jenis} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-4 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Clock className="size-4" /> Aturan Kuota & Waktu
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
                <DetailItem icon={Clock} label="Periode Perhitungan" value={data.periode} />
                <DetailItem icon={Clock} label="Maksimal Pengajuan" value={data.maksimal_pengajuan ? `${data.maksimal_pengajuan} Kali` : "Tanpa Batas"} />
                <DetailItem icon={Clock} label="Minimal Hari Pengajuan" value={`H-${data.minimal_hari_pengajuan}`} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-4 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Banknote className="size-4" /> Kebijakan Potongan
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
               <div className="p-4 bg-slate-50/50 rounded-lg border text-sm text-slate-600 leading-relaxed mb-4">
                    {data.potongan_tipe === "none" ? "Tidak ada potongan gaji untuk jenis pengajuan ini." : 
                     data.potongan_tipe === "flat" ? "Potongan akan dikenakan secara tetap (flat) setiap kali pengajuan dilakukan." : 
                     "Potongan dihitung berdasarkan rasio harian gaji pokok sesuai dengan koefisien yang ditentukan."}
               </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
                <DetailItem icon={Banknote} label="Tipe Potongan" value={data.potongan_tipe} badge />
                <DetailItem 
                   icon={Banknote} 
                   label="Nilai Potongan" 
                   value={data.potongan_tipe === "none" ? "Rp 0" : 
                          data.potongan_tipe === "flat" ? `Rp ${Number(data.potongan_nilai).toLocaleString("id-ID")}` : 
                          `${data.potongan_nilai}x Gaji`} 
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
