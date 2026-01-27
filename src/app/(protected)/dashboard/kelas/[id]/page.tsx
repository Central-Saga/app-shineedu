"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Info,
  Infinity as InfinityIcon
} from "lucide-react";
import { DetailKelasClient } from "@/modules/academic/presentation/components/DetailKelasClient";

function DetailItem({ icon: Icon, label, value, badge, variant = "primary" }: { icon: React.ElementType, label: string, value: React.ReactNode, badge?: boolean, variant?: any }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <div className="mt-0.5 p-2 rounded-lg bg-secondary text-secondary-foreground shrink-0">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground font-medium mb-0.5">{label}</p>
        <div className="">
          {badge && value ? (
            <Badge variant="outline" className="font-semibold">{value}</Badge>
          ) : (
            <div className="text-sm font-semibold text-foreground">{value || "-"}</div>
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
          <Skeleton className="h-64 rounded-lg" />
          <div className="lg:col-span-2 space-y-6">
             <Skeleton className="h-64 rounded-lg" />
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
    <div className="w-full pb-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.back()} className="h-9 w-9">
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight">Detail Kelas</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="font-mono text-[10px] px-2 py-0 border">
                 {kelas.kode_kelas || "N/A"}
              </Badge>
              <Badge variant={kelas.status === "Aktif" ? "outline" : "secondary"} className={kelas.status === "Aktif" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : ""}>
                {kelas.status}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canUpdate && (
            <Button asChild>
              <Link href={`/dashboard/kelas/${kelas.id}/edit`}>
                <Pencil className="mr-2 size-4" />
                Edit Data Kelas
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Info Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center pb-6 border-b mb-4">
                 <div className="size-16 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 mb-4 border">
                    <School className="size-8" />
                 </div>
                 <h2 className="text-xl font-bold">{kelas.nama_kelas}</h2>
                 <p className="text-sm text-muted-foreground mt-1 font-medium">
                    {kelas.program?.nama || "-"} • {kelas.jenjang?.nama || "-"}
                 </p>
                 <div className="flex gap-2 mt-4">
                    <Badge variant="outline">{kelas.tipe_kelas}</Badge>
                    {kelas.mode_private && <Badge variant="outline">{kelas.mode_private}</Badge>}
                 </div>
              </div>

              <div className="space-y-1">
                 <DetailItem icon={Users} label="Kapasitas Anggota" value={`${kelas.enrollments_count || 0} / ${kelas.kapasitas || "Unlimited"}`} />
                 <DetailItem 
                    icon={Calendar} 
                    label="Periode" 
                    value={
                        <div className="flex items-center gap-1.5">
                            <span>{kelas.periode_mulai ? formatDate(kelas.periode_mulai) : '-'}</span>
                            <span className="text-muted-foreground font-normal">s/d</span>
                            {kelas.periode_selesai ? (
                                <span>{formatDate(kelas.periode_selesai)}</span>
                            ) : (
                                <InfinityIcon className="size-3.5 text-muted-foreground" />
                            )}
                        </div>
                    } 
                 />
                 <DetailItem icon={Building2} label="Ruangan" value={kelas.ruangan_default} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-4 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Info className="size-4" /> Catatan
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
               <div className="p-3 bg-slate-50 rounded-lg text-sm text-muted-foreground leading-relaxed italic border border-slate-100">
                  {kelas.catatan || "Tidak ada catatan untuk kelas ini."}
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
