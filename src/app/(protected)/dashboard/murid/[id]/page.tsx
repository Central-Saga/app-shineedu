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
import { getMurid } from "@/modules/murid/infrastructure/murid.repository";
import { authStore } from "@/modules/auth/infrastructure/auth.store";
import type { Murid } from "@/modules/murid/domain/entities";
import { toast } from "sonner";
import { 
  User, 
  GraduationCap, 
  Phone, 
  MapPin, 
  Calendar, 
  Pencil, 
  ArrowLeft,
  Mail,
  Heart,
  StickyNote,
  Users,
  School,
  IdCard,
  Building2,
  Info
} from "lucide-react";

function DetailItem({ icon: Icon, label, value, badge, variant = "rose" }: { icon: React.ElementType, label: string, value: string | null | undefined, badge?: boolean, variant?: "rose" | "blue" | "amber" | "emerald" | "slate" | "indigo" }) {
  const variantClasses = {
    rose: "bg-rose-50 text-rose-500",
    blue: "bg-blue-50 text-blue-500",
    amber: "bg-amber-50 text-amber-500",
    emerald: "bg-emerald-50 text-emerald-500",
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

export default function MuridDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { allowed } = usePermissionGuard("student.view");
  const resolvedParams = use(params);
  const id = Number(resolvedParams.id);
  const router = useRouter();
  const [murid, setMurid] = useState<Murid | null>(null);
  const [loading, setLoading] = useState(true);

  const canUpdate = authStore.hasPermission("student.update");
  const { setItems } = useBreadcrumbStore();

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Murid", href: "/dashboard/murid" },
      { label: "Detail Murid" },
    ]);
  }, [setItems]);

  useEffect(() => {
    // Robust check for ID
    if (!allowed || id === undefined || id === null || Number.isNaN(id)) {
        if (allowed && (id === undefined || id === null || Number.isNaN(id))) {
            setLoading(false);
        }
        return;
    }
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getMurid(id);
        setMurid(data);
      } catch (e: any) {
        console.error("Error fetching murid:", e);
        toast.error("Gagal memuat data murid: " + (e.message || "Terjadi kesalahan"));
        router.replace("/dashboard/murid");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [allowed, id, router]);

  if (!allowed) return null;

  if (loading) {
    return (
      <div className="w-full space-y-8 animate-pulse">
        <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-7 w-64" />
                <Skeleton className="h-4 w-40" />
            </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[400px] rounded-3xl" />
          <div className="lg:col-span-2 space-y-6">
             <Skeleton className="h-48 rounded-2xl" />
             <Skeleton className="h-48 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!murid) return (
     <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="size-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
           <User className="size-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Murid Tidak Ditemukan</h2>
        <p className="text-slate-400 mt-2">Data yang Anda cari mungkin sudah dihapus atau ID tidak valid.</p>
        <Button variant="link" className="mt-4 text-rose-600 border-none hover:no-underline" onClick={() => router.replace("/dashboard/murid")}>
           <ArrowLeft className="mr-2 size-4" /> Kembali ke Daftar Murid
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
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-10 w-10 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all">
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex flex-col">
          <h1 className="text-2xl font-black tracking-tight text-slate-800 leading-tight">
            Detail Murid
          </h1>
          <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
            <span className="font-mono text-xs font-bold text-rose-600 tracking-wider bg-rose-50 px-2 py-0.5 rounded-md uppercase">
               {murid.kode_murid || "NO-CODE"}
            </span> 
            <span className="text-slate-200">|</span>
            <Badge variant="outline" className={murid.status === "Aktif" ? "border-emerald-200 bg-emerald-50/50 text-emerald-600 h-5 px-2 text-[10px] font-bold uppercase tracking-wider" : "border-rose-100 bg-rose-50/50 text-rose-600 h-5 px-2 text-[10px] font-bold uppercase tracking-wider"}>
              {murid.status}
            </Badge>
          </div>
        </div>
        <div className="ml-auto">
          {canUpdate && (
            <Button asChild className="rounded-full px-6 h-10 bg-rose-700 hover:bg-rose-800 shadow-lg shadow-rose-200 transition-all scale-100 hover:scale-[1.02] active:scale-95">
              <Link href={`/dashboard/murid/${murid.id}/edit`}>
                <Pencil className="mr-2 size-4" />
                Edit Profil Siswa
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Summary Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-[2.5rem] border-none shadow-premium overflow-hidden ring-1 ring-slate-100 p-0">
            <div className="h-32 bg-linear-to-br from-rose-700 via-rose-600 to-amber-500" />
            <div className="px-8 pb-10 -mt-14 text-center relative z-10">
              <div className="inline-flex p-1.5 bg-white rounded-3xl shadow-xl mb-4 ring-8 ring-white/40">
                <div className="size-24 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                  <User className="size-12" />
                </div>
              </div>
              <h2 className="text-2xl font-black text-slate-800 leading-tight mb-1.5">
                {murid.nama_lengkap}
              </h2>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mb-8">
                 {murid.jenjang?.nama || "-"} {murid.kelas_sekolah ? `• ${murid.kelas_sekolah}` : ""}
              </p>
              
              <div className="flex flex-wrap justify-center gap-2 mb-10">
                <Badge variant="secondary" className="bg-rose-50 text-rose-700 h-7 px-4 text-[10px] rounded-full font-black uppercase tracking-widest border-transparent">
                  STUDENT
                </Badge>
                {murid.jenis_kelamin && (
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 h-7 px-4 text-[10px] rounded-full font-black uppercase tracking-widest border-transparent">
                    {murid.jenis_kelamin === "L" ? "LAKI-LAKI" : "PEREMPUAN"}
                  </Badge>
                )}
              </div>

              <div className="space-y-3">
                 <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 group transition-all hover:bg-white hover:shadow-md">
                    <div className="size-10 bg-white rounded-xl flex items-center justify-center text-rose-600 shadow-sm">
                       <Phone className="size-5" />
                    </div>
                    <div className="text-left">
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">WhatsApp</p>
                       <p className="text-sm font-bold text-slate-700">{murid.no_hp || "-"}</p>
                    </div>
                 </div>
                 
                 <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 group transition-all hover:bg-white hover:shadow-md">
                    <div className="size-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                       <Mail className="size-5" />
                    </div>
                    <div className="text-left">
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Email</p>
                       <p className="text-sm font-bold text-slate-700 truncate max-w-[180px]">{murid.email || "-"}</p>
                    </div>
                 </div>
              </div>
            </div>
          </Card>

          <Card className="rounded-3xl border-none shadow-premium ring-1 ring-slate-100 overflow-hidden py-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6 px-1">
                <div className="p-2.5 bg-rose-50 rounded-2xl shadow-sm text-rose-600">
                   <MapPin className="size-5" />
                </div>
                <div>
                   <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Domisili</h3>
                   <p className="text-[10px] text-slate-400 font-bold">Informasi alamat siswa</p>
                </div>
              </div>
              <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 min-h-[100px]">
                 <p className="text-sm text-slate-600 font-semibold leading-relaxed">
                    {murid.alamat || "Alamat belum dilengkapi."}
                 </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Detailed Info */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="rounded-3xl border-none shadow-premium ring-1 ring-slate-100 overflow-hidden py-0">
                <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-6 px-1">
                        <div className="p-2.5 bg-blue-50 rounded-2xl shadow-sm text-blue-600">
                            <GraduationCap className="size-5" />
                        </div>
                        <div>
                           <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Akademik</h3>
                           <p className="text-[10px] text-slate-400 font-bold">Informasi sekolah & jenjang</p>
                        </div>
                    </div>
                    <div className="space-y-1 px-1">
                        <DetailItem icon={IdCard} label="Jenjang Terdaftar" value={murid.jenjang?.nama} variant="blue" />
                        <DetailItem icon={School} label="Nama Sekolah Asal" value={murid.sekolah_asal} variant="blue" />
                        <DetailItem icon={GraduationCap} label="Tingkatan / Kelas" value={murid.kelas_sekolah} variant="blue" />
                        <DetailItem icon={Calendar} label="Tanggal Lahir" value={formatDate(murid.tanggal_lahir)} variant="blue" />
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-3xl border-none shadow-premium ring-1 ring-slate-100 overflow-hidden py-0">
                <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-6 px-1">
                        <div className="p-2.5 bg-amber-50 rounded-2xl shadow-sm text-amber-600">
                            <Users className="size-5" />
                        </div>
                        <div>
                           <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Wali Murid</h3>
                           <p className="text-[10px] text-slate-400 font-bold">Kontak orang tua / penanggung jawab</p>
                        </div>
                    </div>
                    <div className="space-y-1 px-1">
                        <DetailItem icon={User} label="Nama Lengkap Wali" value={murid.nama_wali} variant="amber" />
                        <DetailItem icon={Phone} label="Nomor HP Wali" value={murid.no_hp_wali} variant="amber" />
                        <DetailItem icon={Mail} label="Alamat Email Wali" value={murid.email_wali} variant="amber" />
                        <DetailItem icon={Users} label="Hubungan Keluarga" value={murid.hubungan_wali} variant="amber" />
                    </div>
                </CardContent>
            </Card>
          </div>

          <Card className="rounded-3xl border-none shadow-premium ring-1 ring-slate-100 overflow-hidden py-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6 px-1">
                <div className="p-2.5 bg-emerald-50 rounded-2xl shadow-sm text-emerald-600">
                   <StickyNote className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Informasi Medis & Khusus</h3>
                  <p className="text-[10px] text-slate-400 font-bold">Hal penting yang perlu diperhatikan pengajar</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-1">
                 <div className="p-5 bg-rose-50/50 rounded-2xl border border-rose-100/50">
                    <div className="flex items-center gap-2 mb-3">
                       <Heart className="size-3.5 text-rose-500" />
                       <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Kebutuhan Khusus</h4>
                    </div>
                    <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                       {murid.kebutuhan_khusus || "Tidak ada kebutuhan khusus yang dilaporkan."}
                    </p>
                 </div>
                 
                 <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                    <div className="flex items-center gap-2 mb-3">
                       <Info className="size-3.5 text-blue-500" />
                       <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Catatan Tambahan</h4>
                    </div>
                    <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                       {murid.catatan_khusus || "Tidak ada catatan tambahan."}
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
