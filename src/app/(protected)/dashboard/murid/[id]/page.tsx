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
  School
} from "lucide-react";

function DetailItem({ icon: Icon, label, value, badge, variant = "rose" }: { icon: React.ElementType, label: string, value: string | null | undefined, badge?: boolean, variant?: "rose" | "blue" | "amber" | "emerald" }) {
  const variantClasses = {
    rose: "bg-rose-50 text-rose-500",
    blue: "bg-blue-50 text-blue-500",
    amber: "bg-amber-50 text-amber-500",
    emerald: "bg-emerald-50 text-emerald-500"
  };

  return (
    <div className="flex items-start gap-3 py-2 border-b last:border-0 border-slate-50/80">
      <div className={`mt-0.5 p-1.5 rounded-md shrink-0 ${variantClasses[variant]}`}>
        <Icon className="size-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">{label}</p>
        <div className="">
          {badge && value ? (
            <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none h-5 px-2 text-[10px] capitalize font-semibold">
              {value}
            </Badge>
          ) : (
            <p className="text-slate-700 font-medium text-sm leading-tight whitespace-pre-wrap">{value || "-"}</p>
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
    if (!allowed || !id || Number.isNaN(id)) return;
    
    const fetchData = async () => {
      try {
        const data = await getMurid(id);
        setMurid(data);
      } catch {
        toast.error("Gagal memuat data murid");
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

  if (!murid) return null;

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
            {murid.nama_lengkap}
          </h1>
          <div className="flex items-center gap-2 text-sm text-slate-400 mt-0.5">
            <span className="font-mono text-xs font-medium">{murid.kode_murid || "BELUM ADA KODE"}</span> 
            <span className="text-slate-200">|</span>
            <Badge variant="outline" className={murid.status === "Aktif" ? "border-emerald-200 bg-emerald-50/30 text-emerald-600 h-4 px-1.5 text-[10px]" : "border-rose-100 bg-rose-50/30 text-rose-600 h-4 px-1.5 text-[10px]"}>
              {murid.status}
            </Badge>
          </div>
        </div>
        <div className="ml-auto">
          {canUpdate && (
            <Button asChild className="rounded-full px-5 h-9 bg-rose-700 hover:bg-rose-800 shadow-sm shadow-rose-200">
              <Link href={`/dashboard/murid/${murid.id}/edit`}>
                <Pencil className="mr-2 size-3.5" />
                Edit Profil
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Summary Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-3xl border-none shadow-premium overflow-hidden ring-1 ring-slate-100 p-0">
            <div className="h-28 bg-linear-to-br from-rose-700 via-rose-600 to-amber-500" />
            <div className="px-6 pb-8 -mt-12 text-center relative z-10">
              <div className="inline-flex p-1 bg-white rounded-2xl shadow-md mb-3 ring-4 ring-white/50">
                <div className="size-20 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300">
                  <User className="size-10" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 leading-tight mb-1">
                {murid.nama_lengkap}
              </h2>
              <p className="text-sm text-slate-400 font-medium mb-6">
                 {murid.jenjang?.nama || "-"} {murid.kelas_sekolah ? `(${murid.kelas_sekolah})` : ""}
              </p>
              
              <div className="flex flex-wrap justify-center gap-1.5">
                <Badge variant="secondary" className="bg-rose-50 text-rose-700 h-6 px-3 text-xs rounded-full border-transparent font-semibold">
                  Siswa
                </Badge>
                {murid.jenis_kelamin && (
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 h-6 px-3 text-xs rounded-full border-transparent font-semibold">
                    {murid.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}
                  </Badge>
                )}
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border-none shadow-premium ring-1 ring-slate-100 overflow-hidden py-0">
            <CardContent className="p-5">
              <div className="flex items-center gap-2.5 mb-4 px-1">
                <div className="p-1.5 bg-rose-50 rounded-md">
                   <Phone className="size-3.5 text-rose-600" />
                </div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-tight">Kontak Murid</h3>
              </div>
              <div className="space-y-0.5 px-1">
                <DetailItem icon={Phone} label="Nomor WhatsApp" value={murid.no_hp} />
                <DetailItem icon={Mail} label="Email" value={murid.email} />
                <DetailItem icon={MapPin} label="Alamat" value={murid.alamat} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Detailed Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-2xl border-none shadow-premium ring-1 ring-slate-100 overflow-hidden py-0">
                <CardContent className="p-5">
                    <div className="flex items-center gap-2.5 mb-4 px-1">
                        <div className="p-1.5 bg-blue-50 rounded-md">
                            <GraduationCap className="size-3.5 text-blue-600" />
                        </div>
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-tight">Akademik</h3>
                    </div>
                    <div className="space-y-0.5 px-1">
                        <DetailItem icon={GraduationCap} label="Jenjang" value={murid.jenjang?.nama} variant="blue" />
                        <DetailItem icon={School} label="Sekolah Asal" value={murid.sekolah_asal} variant="blue" />
                        <DetailItem icon={School} label="Kelas di Sekolah" value={murid.kelas_sekolah} variant="blue" />
                        <DetailItem icon={Calendar} label="Tanggal Lahir" value={formatDate(murid.tanggal_lahir)} variant="blue" />
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-2xl border-none shadow-premium ring-1 ring-slate-100 overflow-hidden py-0">
                <CardContent className="p-5">
                    <div className="flex items-center gap-2.5 mb-4 px-1">
                        <div className="p-1.5 bg-amber-50 rounded-md">
                            <Users className="size-3.5 text-amber-600" />
                        </div>
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-tight">Orang Tua / Wali</h3>
                    </div>
                    <div className="space-y-0.5 px-1">
                        <DetailItem icon={User} label="Nama Wali" value={murid.nama_wali} variant="amber" />
                        <DetailItem icon={Phone} label="Nomor HP Wali" value={murid.no_hp_wali} variant="amber" />
                        <DetailItem icon={Mail} label="Email Wali" value={murid.email_wali} variant="amber" />
                        <DetailItem icon={Users} label="Hubungan" value={murid.hubungan_wali} variant="amber" />
                    </div>
                </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl border-none shadow-premium ring-1 ring-slate-100 overflow-hidden py-0">
            <CardContent className="p-5">
              <div className="flex items-center gap-2.5 mb-4 px-1">
                <div className="p-1.5 bg-emerald-50 rounded-md">
                   <StickyNote className="size-3.5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-tight">Informasi Tambahan</h3>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1.5 px-1">
                <DetailItem icon={Heart} label="Kebutuhan Khusus" value={murid.kebutuhan_khusus} variant="emerald" />
                <DetailItem icon={StickyNote} label="Catatan Khusus" value={murid.catatan_khusus} variant="emerald" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
