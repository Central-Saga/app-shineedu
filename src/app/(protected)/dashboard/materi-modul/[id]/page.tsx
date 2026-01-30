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
import { materiRepository } from "@/modules/learning/infrastructure/materi.repository";
import { authStore } from "@/modules/auth/infrastructure/auth.store";
import type { MateriModul } from "@/modules/learning/domain/entities";
import { toast } from "sonner";
import { 
  BookOpen, 
  Pencil, 
  ArrowLeft,
  Info,
  CheckCircle2,
  XCircle,
  Tag
} from "lucide-react";
import { MateriItemList } from "@/modules/learning/presentation/components/MateriItemList";

function DetailItem({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <div className="mt-0.5 p-2 rounded-lg bg-secondary text-secondary-foreground shrink-0">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground font-medium mb-0.5">{label}</p>
        <div className="text-sm font-semibold text-foreground">{value || "-"}</div>
      </div>
    </div>
  );
}

export default function DetailMateriModulPage({ params }: { params: Promise<{ id: string }> }) {
  const { allowed } = usePermissionGuard("materials.view");
  const resolvedParams = use(params);
  const id = Number(resolvedParams.id);
  const router = useRouter();
  const [modul, setModul] = useState<MateriModul | null>(null);
  const [loading, setLoading] = useState(true);

  const canUpdate = authStore.hasPermission("materials.update");
  const { setItems } = useBreadcrumbStore();

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Materi Modul", href: "/dashboard/materi-modul" },
      { label: "Detail Modul" },
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
        const data = await materiRepository.getById(id);
        setModul(data);
      } catch (error) {
        console.error("Error fetching modul:", error);
        toast.error("Gagal memuat data modul");
        router.replace("/dashboard/materi-modul");
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

  if (!modul) return (
     <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="size-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
           <BookOpen className="size-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Modul Tidak Ditemukan</h2>
        <p className="text-slate-400 mt-2">Data yang Anda cari mungkin sudah dihapus atau ID tidak valid.</p>
        <Button variant="link" className="mt-4 text-rose-600 border-none hover:no-underline" onClick={() => router.replace("/dashboard/materi-modul")}>
           <ArrowLeft className="mr-2 size-4" /> Kembali ke Daftar Modul
        </Button>
     </div>
  );

  return (
    <div className="w-full pb-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.back()} className="h-9 w-9">
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight">Detail Materi Modul</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={modul.is_active ? "outline" : "secondary"} className={modul.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : ""}>
                {modul.is_active ? (
                  <>
                    <CheckCircle2 className="size-3 mr-1" />
                    Aktif
                  </>
                ) : (
                  <>
                    <XCircle className="size-3 mr-1" />
                    Nonaktif
                  </>
                )}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canUpdate && (
            <Button asChild>
              <Link href={`/dashboard/materi-modul/${modul.id}/edit`}>
                <Pencil className="mr-2 size-4" />
                Edit Modul
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
                    <BookOpen className="size-8" />
                 </div>
                 <h2 className="text-xl font-bold">{modul.title}</h2>
                 <p className="text-sm text-muted-foreground mt-1 font-medium">
                    {modul.program?.nama || "-"} • {modul.jenjang?.nama || "-"}
                 </p>
              </div>

              <div className="space-y-1">
                 <DetailItem 
                   icon={Tag} 
                   label="Program" 
                   value={modul.program?.nama || "Semua Program"} 
                 />
                 <DetailItem 
                   icon={Tag} 
                   label="Jenjang" 
                   value={modul.jenjang?.nama || "Semua Jenjang"} 
                 />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-4 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Info className="size-4" /> Deskripsi
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
               <div className="p-3 bg-slate-50 rounded-lg text-sm text-muted-foreground leading-relaxed italic border border-slate-100">
                  {modul.description || "Tidak ada deskripsi untuk modul ini."}
               </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Items List */}
        <div className="lg:col-span-2">
           <MateriItemList modulId={modul.id} />
        </div>
      </div>
    </div>
  );
}
