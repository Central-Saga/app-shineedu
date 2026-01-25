"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { academicApi } from "@/modules/academic/infrastructure/api";
import { authStore } from "@/modules/auth/infrastructure/auth.store";
import type { Kelas } from "@/modules/academic/domain/types";
import { toast } from "sonner";
import { 
  School, 
  Users, 
  Calendar, 
  Pencil, 
  ArrowLeft,
  Building2,
  Clock,
  Info
} from "lucide-react";
import { DetailKelasClient } from "@/modules/academic/presentation/components/DetailKelasClient";

function DetailItem({ icon: Icon, label, value, badge, variant = "rose" }: { icon: React.ElementType, label: string, value: string | null | undefined, badge?: boolean, variant?: "rose" | "blue" | "emerald" | "amber" | "indigo" | "slate" }) {
  const variantClasses = {
    rose: "bg-rose-50 text-rose-500",
    blue: "bg-blue-50 text-blue-500",
    emerald: "bg-emerald-50 text-emerald-500",
    amber: "bg-amber-50 text-amber-500",
    slate: "bg-slate-50 text-slate-500",
    indigo: "bg-indigo-50 text-indigo-500"
  };

  return (
    <div className="flex items-start gap-4 py-3 border-b last:border-0 border-slate-50/80">
      <div className={`mt-0.5 p-2 rounded-xl shrink-0 ${variantClasses[variant]} shadow-sm`}>
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{label}</p>
        <div className="">
          {badge && value ? (
            <Badge variant="secondary" className={`${variantClasses[variant].replace('text-', 'bg-').replace('500', '50/50')} ${variantClasses[variant]} border-none h-5 px-2 text-[10px] capitalize font-bold`}>
              {value}
            </Badge>
          ) : (
            <p className="text-slate-700 font-semibold text-sm leading-tight whitespace-pre-wrap">{value || "-"}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DetailKelasPage({ params }: { params: Promise<{ id: string }> }) {
  const { allowed } = usePermissionGuard("kelas.view");
  const resolvedParams = use(params);
  const id = Number(resolvedParams.id);
  const router = useRouter();
  const [kelas, setKelas] = useState<Kelas | null>(null);
  const [loading, setLoading] = useState(true);

  const canUpdate = authStore.hasPermission("kelas.update");
  const { setItems } = useBreadcrumbStore();

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Kelas", href: "/dashboard/kelas" },
      { label: "Detail Kelas" },
    ]);
  }, [setItems]);

  useEffect(() => {
    if (!allowed || isNaN(id)) {
        if (allowed && isNaN(id)) setLoading(false);
        return;
    }
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await academicApi.getKelasDetail(id);
        if (res.success && res.data) {
          setKelas(res.data);
        } else {
          throw new Error(res.message || "Gagal memuat data");
        }
      } catch (e: any) {
        console.error("Error fetching kelas:", e);
        toast.error("Gagal memuat data kelas: " + (e.message || "Terjadi kesalahan"));
        router.replace("/dashboard/kelas");
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
          <Skeleton className="h-64 rounded-2xl" />
          <div className="lg:col-span-2 space-y-6">
             <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!kelas) return (
     <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="size-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
           <School className="size-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Kelas Tidak Ditemukan</h2>
        <p className="text-slate-400 mt-2">Data yang Anda cari mungkin sudah dihapus atau ID tidak valid.</p>
        <Button variant="link" className="mt-4 text-rose-600 border-none hover:no-underline" onClick={() => router.replace("/dashboard/kelas")}>
           <ArrowLeft className="mr-2 size-4" /> Kembali ke Daftar Kelas
        </Button>
     </div>
  );

  const formatDate = (s: string | null | undefined) => {
    if (!s) return "-";
    try {
      const d = new Date(s);
      return Number.isNaN(d.getTime()) ? String(s) : d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    } catch {
      return String(s);
    }
  };

  return (
    <div className="w-full pb-10">
      <div className="flex items-center gap-4 mb-8 text-left">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl h-10 w-10 text-slate-400 hover:text-rose-600 bg-white border border-slate-200/60 shadow-sm hover:bg-slate-50">
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold tracking-tight text-slate-800 leading-tight">
            Detail Kelas
          </h1>
          <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
            <span className="font-mono text-xs font-bold text-rose-600 tracking-wider bg-rose-50 px-2.5 py-1 rounded-lg uppercase border border-rose-100/50">
               {kelas.kode_kelas || "NO-CODE"}
            </span> 
            <span className="text-slate-200">|</span>
            <Badge variant="outline" className={kelas.status === "Aktif" ? "border-emerald-200 bg-emerald-50/50 text-emerald-600 h-6 px-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg" : "border-slate-200 bg-slate-50/50 text-slate-500 h-6 px-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg"}>
              {kelas.status}
            </Badge>
          </div>
        </div>
        <div className="ml-auto">
          {canUpdate && (
            <Button asChild className="rounded-xl px-5 h-10 bg-rose-700 hover:bg-rose-800 shadow-lg shadow-rose-100 font-bold text-xs uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]">
              <Link href={`/dashboard/kelas/${kelas.id}/edit`}>
                <Pencil className="mr-2 size-3.5" />
                Edit Data Kelas
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Info Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-[2rem] border-none shadow-premium overflow-hidden ring-1 ring-slate-100 p-0">
            <div className="h-24 bg-linear-to-br from-rose-700 via-rose-600 to-amber-500" />
            <div className="px-6 pb-8 -mt-10 relative z-10">
              <div className="inline-flex p-1 bg-white rounded-2xl shadow-md mb-3 ring-4 ring-white/50">
                <div className="size-16 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300">
                  <School className="size-8" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-slate-800 leading-tight mb-1">
                {kelas.nama_kelas}
              </h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-6">
                 {kelas.program?.nama || "-"} • {kelas.jenjang?.nama || "-"}
              </p>
              
              <div className="flex flex-wrap gap-1.5 mb-8">
                <Badge variant="secondary" className="bg-rose-50 text-rose-700 h-6 px-3 text-[10px] rounded-full font-bold uppercase tracking-wider border-transparent">
                  {kelas.tipe_kelas}
                </Badge>
                {kelas.mode_private && (
                   <Badge variant="secondary" className="bg-amber-50 text-amber-700 h-6 px-3 text-[10px] rounded-full font-bold uppercase tracking-wider border-transparent">
                    {kelas.mode_private}
                  </Badge>
                )}
              </div>

              <div className="space-y-0.5 mt-4 border-t border-slate-50 pt-2">
                 <DetailItem icon={Users} label="Kapasitas Anggota" value={`${kelas.enrollments_count || 0} / ${kelas.kapasitas || "Unlimited"}`} variant="rose" />
                 <DetailItem icon={Clock} label="Periode" value={`${formatDate(kelas.periode_mulai)} - ${formatDate(kelas.periode_selesai)}`} variant="rose" />
                 <DetailItem icon={Building2} label="Ruangan" value={kelas.ruangan_default} variant="rose" />
              </div>
            </div>
          </Card>

           <Card className="rounded-2xl border-none shadow-premium ring-1 ring-slate-100 overflow-hidden py-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-2.5 mb-4 px-1">
                <div className="p-2 bg-slate-50 rounded-xl shadow-sm text-slate-600">
                   <Info className="size-4" />
                </div>
                <div>
                   <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Catatan</h3>
                </div>
              </div>
              <div className="px-1 min-h-[60px]">
                 <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 italic text-slate-500 text-sm leading-relaxed">
                    {kelas.catatan || "Tidak ada catatan untuk kelas ini."}
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Members List */}
        <div className="lg:col-span-2">
           <DetailKelasClient kelas={kelas} />
        </div>
      </div>
    </div>
  );
}
