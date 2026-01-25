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
import { enrollmentRepository } from "@/modules/enrollment/infrastructure/enrollment.repository";
import { authStore } from "@/modules/auth/infrastructure/auth.store";
import { Enrollment } from "@/modules/enrollment/domain/entities";
import { toast } from "sonner";
import { 
  User, 
  BookOpen, 
  Phone, 
  Calendar, 
  Pencil, 
  ArrowLeft,
  GraduationCap,
  Package,
  Users,
  Briefcase,
  FileText,
  DollarSign,
  Info,
  History
} from "lucide-react";

function DetailItem({ icon: Icon, label, value, badge, variant = "rose" }: { icon: React.ElementType, label: string, value: string | null | undefined, badge?: boolean, variant?: "rose" | "blue" | "amber" | "emerald" | "indigo" | "slate" }) {
  const variantClasses = {
    rose: "bg-rose-50 text-rose-500",
    blue: "bg-blue-50 text-blue-500",
    amber: "bg-amber-50 text-amber-500",
    emerald: "bg-emerald-50 text-emerald-500",
    indigo: "bg-indigo-50 text-indigo-500",
    slate: "bg-slate-50 text-slate-500"
  };

  return (
    <div className="flex items-start gap-3 py-2.5 border-b last:border-0 border-slate-50/80">
      <div className={`mt-0.5 p-1.5 rounded-md shrink-0 ${variantClasses[variant]}`}>
        <Icon className="size-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">{label}</p>
        <div className="">
          {badge && value ? (
            <Badge variant="secondary" className={`${variantClasses[variant].replace('text-', 'bg-').replace('500', '50/50')} ${variantClasses[variant]} border-none h-5 px-2 text-[10px] font-bold`}>
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

const formatCurrency = (val: number | string | null | undefined) => {
  if (val === null || val === undefined) return "Rp 0";
  const num = typeof val === 'string' ? parseFloat(val) : val;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(num);
};

export default function EnrollmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { allowed } = usePermissionGuard("enrollment.view");
  const resolvedParams = use(params);
  const id = Number(resolvedParams.id);
  const router = useRouter();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);

  const canUpdate = authStore.hasPermission("enrollment.update");
  const { setItems } = useBreadcrumbStore();

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Enrollment", href: "/dashboard/enrollment" },
      { label: "Detail Enrollment" },
    ]);
  }, [setItems]);

  useEffect(() => {
    if (!allowed || !id || Number.isNaN(id)) return;
    
    const fetchData = async () => {
      try {
        const data = await enrollmentRepository.getEnrollment(id);
        setEnrollment(data);
      } catch {
        toast.error("Gagal memuat data enrollment");
        router.replace("/dashboard/enrollment");
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
        <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 md:col-span-2 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!enrollment) return null;

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
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-9 w-9 text-slate-400 hover:text-rose-600">
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold tracking-tight text-slate-800 leading-tight">
            Pendaftaran: {enrollment.kode_enrollment || `#${enrollment.id}`}
          </h1>
          <div className="flex items-center gap-2 text-sm text-slate-400 mt-0.5">
            <span className="font-medium text-rose-600 font-mono text-xs uppercase tracking-wider">{enrollment.kode_enrollment}</span> 
            <span className="text-slate-200">|</span>
            <Badge variant="outline" className={enrollment.status === "Aktif" ? "border-emerald-200 bg-emerald-50/30 text-emerald-600 h-4 px-1.5 text-[10px]" : "border-rose-100 bg-rose-50/30 text-rose-600 h-4 px-1.5 text-[10px]"}>
              {enrollment.status}
            </Badge>
          </div>
        </div>
        <div className="ml-auto">
          {canUpdate && (
            <Button asChild className="rounded-full px-5 h-9 bg-rose-700 hover:bg-rose-800 shadow-sm shadow-rose-200">
              <Link href={`/dashboard/enrollment/${enrollment.id}/edit`}>
                <Pencil className="mr-2 size-3.5" />
                Edit Pendaftaran
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Premium Profile Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-3xl border-none shadow-premium overflow-hidden ring-1 ring-slate-100 p-0">
            <div className="h-24 bg-linear-to-br from-rose-700 via-rose-600 to-rose-500" />
            <div className="px-6 pb-8 -mt-10 text-center relative z-10">
              <div className="inline-flex p-1 bg-white rounded-2xl shadow-md mb-3 ring-4 ring-white/50">
                <div className="size-16 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300">
                  <User className="size-8" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-slate-800 leading-tight mb-1">
                {enrollment.murid?.nama_lengkap || "-"}
              </h2>
              <p className="text-xs text-slate-400 font-bold tracking-widest uppercase mb-6">
                 {enrollment.murid?.kode_murid || "BELUM ADA KODE"}
              </p>
              
              <div className="flex justify-center gap-1.5 mb-6">
                <Badge variant="secondary" className="bg-rose-50 text-rose-700 h-6 px-3 text-[10px] rounded-full font-bold uppercase tracking-wider">
                  {enrollment.status}
                </Badge>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 h-6 px-3 text-[10px] rounded-full font-bold uppercase tracking-wider">
                  {enrollment.jenjang?.nama}
                </Badge>
              </div>

              <Button asChild variant="outline" size="sm" className="w-full text-[10px] h-9 rounded-xl border-slate-200 text-slate-600 font-bold uppercase tracking-wider hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200">
                <Link href={`/dashboard/murid/${enrollment.murid?.id || enrollment.murid_id}`}>
                   <User className="mr-2 size-3" />
                   Lihat Profil Lengkap Siswa
                </Link>
              </Button>
            </div>
          </Card>

          <Card className="rounded-2xl border-none shadow-premium ring-1 ring-slate-100 overflow-hidden py-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-2.5 mb-5 px-1">
                <div className="p-2 bg-emerald-50 rounded-xl">
                   <DollarSign className="size-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Informasi Biaya</h3>
                </div>
              </div>
              <div className="space-y-1 px-1">
                <div className="py-4 px-4 bg-emerald-500 rounded-2xl mb-4 text-white shadow-lg shadow-emerald-100">
                   <p className="text-[10px] text-emerald-100 font-bold uppercase tracking-widest mb-1.5 opacity-80">Biaya Per Bulan</p>
                   <p className="text-2xl font-black">{formatCurrency(enrollment.harga_final)}</p>
                </div>
                <DetailItem icon={Users} label="Kapasitas" value={`${enrollment.jumlah_siswa} Siswa`} variant="emerald" />
                <DetailItem icon={Package} label="Tipe Paket" value={enrollment.paket?.nama} variant="emerald" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Enrollment Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-2xl border-none shadow-premium ring-1 ring-slate-100 overflow-hidden py-0">
                <CardContent className="p-6">
                    <div className="flex items-center gap-2.5 mb-5 px-1">
                        <div className="p-2 bg-blue-50 rounded-xl">
                            <GraduationCap className="size-4 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Katalog Layanan</h3>
                          <p className="text-[10px] text-slate-400 mt-0.5">Rincian materi dan tingkatan</p>
                        </div>
                    </div>
                    <div className="space-y-0.5 px-1">
                        <DetailItem icon={GraduationCap} label="Jenjang (Level)" value={enrollment.jenjang?.nama} variant="blue" />
                        <DetailItem icon={BookOpen} label="Mata Pelajaran (Program)" value={enrollment.program?.nama} variant="blue" />
                        <DetailItem icon={Package} label="Paket Belajar" value={enrollment.paket?.nama} variant="blue" />
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-2xl border-none shadow-premium ring-1 ring-slate-100 overflow-hidden py-0">
                <CardContent className="p-6">
                    <div className="flex items-center gap-2.5 mb-5 px-1">
                        <div className="p-2 bg-amber-50 rounded-xl">
                            <Calendar className="size-4 text-amber-600" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Periode Belajar</h3>
                          <p className="text-[10px] text-slate-400 mt-0.5">Timeline pelaksanaan bimbingan</p>
                        </div>
                    </div>
                    <div className="space-y-0.5 px-1">
                        <DetailItem icon={Calendar} label="Tanggal Mulai" value={formatDate(enrollment.tanggal_mulai)} variant="amber" />
                        <DetailItem icon={History} label="Tanggal Selesai" value={formatDate(enrollment.tanggal_selesai)} variant="amber" />
                        <DetailItem icon={Briefcase} label="Status Sekarang" value={enrollment.status} variant="amber" badge />
                    </div>
                </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl border-none shadow-premium ring-1 ring-slate-100 overflow-hidden py-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-2.5 mb-5 px-1">
                <div className="p-2 bg-slate-50 rounded-xl">
                   <Info className="size-4 text-slate-600" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Catatan Tambahan</h3>
                </div>
              </div>
              <div className="px-1 min-h-[60px]">
                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 italic text-slate-500 text-sm leading-relaxed">
                   {enrollment.catatan || "Tidak ada catatan tambahan untuk pendaftaran ini."}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
