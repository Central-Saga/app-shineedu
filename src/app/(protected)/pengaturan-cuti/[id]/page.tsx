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
import { Separator } from "@/components/ui/separator";
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
  Info,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { getPengaturanCutiDetail } from "@/modules/pengaturan-cuti/infrastructure/pengaturan-cuti.repository";
import type { PengaturanCuti } from "@/modules/pengaturan-cuti/domain/entities";

function DetailItem({ icon: Icon, label, value, badge, variant = "blue" }: { 
  icon: React.ElementType, 
  label: string, 
  value: string | null | undefined, 
  badge?: boolean,
  variant?: "rose" | "amber" | "emerald" | "blue" | "slate" | "indigo" 
}) {
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
      <div className="space-y-6">
        <PageHeader title="Detail Aturan Cuti" description="Memuat data..." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 md:col-span-2 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="w-full pb-10">
      <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()} 
          className="rounded-full h-10 w-10 text-slate-400 hover:text-primary hover:bg-primary/5 transition-colors"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">
            Aturan {data.jenis.charAt(0).toUpperCase() + data.jenis.slice(1)}
          </h1>
          <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
            <span className="font-medium">Kategori: {data.kategori_karyawan}</span> 
            <span className="text-slate-200">|</span>
            <Badge 
              variant="outline" 
              className={data.aktif ? "border-emerald-200 bg-emerald-50 text-emerald-600 h-5 px-2 text-[10px] font-bold uppercase" : "border-rose-200 bg-rose-50 text-rose-600 h-5 px-2 text-[10px] font-bold uppercase"}
            >
              {data.aktif ? "Aktif" : "Nonaktif"}
            </Badge>
          </div>
        </div>
        <div className="ml-auto">
          {canUpdate && (
            <Button asChild className="rounded-full px-6 h-10 shadow-lg shadow-primary/20">
              <Link href={`/pengaturan-cuti/${data.id}/edit`}>
                <Pencil className="mr-2 size-4" />
                Edit Aturan
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-8">
          <Card className="rounded-[2.5rem] border-none shadow-premium overflow-hidden ring-1 ring-slate-100 p-0">
            <div className="h-32 bg-linear-to-br from-primary/80 to-primary" />
            <div className="px-8 pb-10 -mt-14 text-center relative z-10">
              <div className="inline-flex p-1.5 bg-white rounded-3xl shadow-xl mb-4 ring-8 ring-white/50">
                <div className="size-24 bg-slate-50 rounded-[1.25rem] flex items-center justify-center">
                  <Settings className="size-10 text-primary" />
                </div>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 leading-tight mb-1 capitalize">
                {data.jenis}
              </h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
                ID Aturan: #{data.id}
              </p>
              
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="secondary" className="bg-slate-100 text-slate-700 h-7 px-4 text-xs rounded-full border-transparent font-bold capitalize">
                  {data.periode}
                </Badge>
              </div>
            </div>
          </Card>

          <Card className="rounded-3xl border-none shadow-premium ring-1 ring-slate-100 overflow-hidden py-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-50 rounded-xl">
                  <ShieldCheck className="size-4 text-blue-600" />
                </div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Status Pengajuan</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    {data.aktif ? <CheckCircle2 className="size-5 text-emerald-500" /> : <XCircle className="size-5 text-rose-500" />}
                    <span className="text-sm font-bold text-slate-700">Status Keaktifan</span>
                  </div>
                  <Badge variant={data.aktif ? "secondary" : "destructive"}>
                    {data.aktif ? "AKTIF" : "NONAKTIF"}
                  </Badge>
                </div>
                <p className="text-[10px] text-slate-400 font-medium px-2 leading-relaxed text-center">
                  Aturan ini {data.aktif ? "sedang diterapkan" : "sedang ditangguhkan"} untuk seluruh karyawan dengan kriteria yang sesuai.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="rounded-3xl border-none shadow-premium ring-1 ring-slate-100 overflow-hidden py-0">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-indigo-50 rounded-xl">
                  <Users className="size-4 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Kriteria Karyawan</h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5 tracking-tight">Karyawan yang terkena dampak aturan ini</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-2">
                <DetailItem icon={Users} label="Kategori Karyawan" value={data.kategori_karyawan} variant="indigo" />
                <DetailItem icon={Users} label="Subtipe Kontrak" value={data.subtipe_kontrak} variant="slate" badge />
                <DetailItem icon={BookOpen} label="Divisi / Kategori Mengajar" value={data.divisi === "all" ? "Semua Divisi" : data.divisi} variant="amber" badge />
                <DetailItem icon={Info} label="Jenis Pengajuan" value={data.jenis} variant="slate" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none shadow-premium ring-1 ring-slate-100 overflow-hidden py-0">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-emerald-50 rounded-xl">
                  <Clock className="size-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Aturan Kuota & Waktu</h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5 tracking-tight">Batasan frekuensi dan waktu pengajuan</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-2">
                <DetailItem icon={Clock} label="Periode Perhitungan" value={data.periode} variant="emerald" />
                <DetailItem icon={Clock} label="Maksimal Pengajuan" value={data.maksimal_pengajuan ? `${data.maksimal_pengajuan} Kali per ${data.periode}` : "Tanpa Batas"} variant="blue" />
                <DetailItem icon={Clock} label="Minimal Hari Sebelum" value={`H-${data.minimal_hari_pengajuan} (Minimal ${data.minimal_hari_pengajuan} hari)`} variant="amber" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none shadow-premium ring-1 ring-slate-100 overflow-hidden py-0">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-rose-50 rounded-xl">
                  <Banknote className="size-4 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Kebijakan Potongan</h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5 tracking-tight">Konsekuensi finansial terhadap pengajuan</p>
                </div>
              </div>
              
              <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tipe Potongan</p>
                    <Badge variant="outline" className="h-8 px-4 text-xs font-bold uppercase bg-white border-slate-200">
                      {data.potongan_tipe.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="space-y-4">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Nilai Potongan</p>
                    <p className="text-2xl font-black text-slate-900 leading-none">
                      {data.potongan_tipe === "none" ? "Rp 0" : 
                       data.potongan_tipe === "flat" ? `Rp ${Number(data.potongan_nilai).toLocaleString("id-ID")}` : 
                       `${data.potongan_nilai}x Gaji`}
                    </p>
                  </div>
                </div>
                
                <Separator className="my-6 bg-slate-100" />
                
                <div className="flex items-start gap-3">
                  <Info className="size-4 text-slate-400 mt-0.5" />
                  <p className="text-xs text-slate-500 leading-relaxed italic">
                    {data.potongan_tipe === "none" ? "Tidak ada potongan gaji untuk jenis pengajuan ini." : 
                     data.potongan_tipe === "flat" ? "Potongan akan dikenakan secara tetap (flat) setiap kali pengajuan dilakukan." : 
                     "Potongan dihitung berdasarkan rasio harian gaji pokok sesuai dengan koefisien yang ditentukan."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
