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
import { getMurid } from "@/modules/murid/infrastructure/murid.repository";
import { authStore } from "@/modules/auth/infrastructure/auth.store";
import { Murid } from "@/modules/murid/domain/entities";
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
  Info,
  BookOpen
} from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MuridLogbookList } from "@/features/sesi/components/MuridLogbookList";

function DetailItem({ icon: Icon, label, value, badge }: { icon: React.ElementType, label: string, value: string | null | undefined, badge?: boolean }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <div className="mt-0.5 p-2 rounded-lg bg-secondary text-secondary-foreground shrink-0 text-slate-500">
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

export default function MuridDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { allowed } = usePermissionGuard("student.view");
  const resolvedParams = use(params);
  const id = Number(resolvedParams.id);
  const router = useRouter();
  const [murid, setMurid] = useState<Murid | null>(null);
  const [loading, setLoading] = useState(true);

  const canUpdate = authStore.hasPermission("student.update");
  const canViewLogbook = authStore.hasPermission("session.logbook.manage") || authStore.hasPermission("session.view");
  const { setItems } = useBreadcrumbStore();

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Murid", href: "/dashboard/murid" },
      { label: "Detail Murid" },
    ]);
  }, [setItems]);

  useEffect(() => {
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
      } catch (e: unknown) {
        const error = e as Error;
        console.error("Error fetching murid:", error);
        toast.error("Gagal memuat data murid: " + (error.message || "Terjadi kesalahan"));
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
    <div className="w-full pb-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.back()} className="h-9 w-9">
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight">Detail Murid</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="font-mono text-[10px] px-2 py-0 border">
                 {murid.kode_murid || "N/A"}
              </Badge>
              <Badge variant={murid.status === "Aktif" ? "outline" : "secondary"} className={murid.status === "Aktif" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : ""}>
                {murid.status}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canUpdate && (
            <Button asChild>
              <Link href={`/dashboard/murid/${murid.id}/edit`}>
                <Pencil className="mr-2 size-4" />
                Edit Profil Siswa
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
                    <User className="size-10" />
                 </div>
                 <h2 className="text-xl font-bold">{murid.nama_lengkap}</h2>
                 <p className="text-sm text-muted-foreground mt-1 font-medium">
                    {murid.jenjang?.nama || "-"} {murid.kelas_sekolah ? `• ${murid.kelas_sekolah}` : ""}
                 </p>
                 <div className="flex flex-wrap justify-center gap-2 mt-4">
                   <Badge variant="outline">STUDENT</Badge>
                   {murid.jenis_kelamin && (
                     <Badge variant="outline">
                       {murid.jenis_kelamin === "L" ? "LAKI-LAKI" : "PEREMPUAN"}
                     </Badge>
                   )}
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="size-8 bg-secondary rounded-lg flex items-center justify-center text-muted-foreground shrink-0">
                       <Phone className="size-4" />
                    </div>
                    <div>
                       <p className="text-xs text-muted-foreground font-medium mb-0.5">WhatsApp</p>
                       <p className="text-sm font-semibold">{murid.no_hp || "-"}</p>
                    </div>
                 </div>
                 
                 <div className="flex items-center gap-3">
                    <div className="size-8 bg-secondary rounded-lg flex items-center justify-center text-muted-foreground shrink-0">
                       <Mail className="size-4" />
                    </div>
                    <div>
                       <p className="text-xs text-muted-foreground font-medium mb-0.5">Email</p>
                       <p className="text-sm font-semibold truncate max-w-[180px]">{murid.email || "-"}</p>
                    </div>
                 </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-4 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <MapPin className="size-4" /> Domisili
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
               <div className="p-3 bg-slate-50 rounded-lg text-sm text-muted-foreground leading-relaxed border border-slate-100">
                  {murid.alamat || "Alamat belum dilengkapi."}
               </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Detailed Info with Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="profil" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="profil">Profil Lengkap</TabsTrigger>
              {canViewLogbook && <TabsTrigger value="logbook">Riwayat Logbook</TabsTrigger>}
            </TabsList>

            <TabsContent value="profil" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="py-4 border-b">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <GraduationCap className="size-4" /> Akademik
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="space-y-1">
                            <DetailItem icon={IdCard} label="Jenjang Terdaftar" value={murid.jenjang?.nama} />
                            <DetailItem icon={School} label="Nama Sekolah Asal" value={murid.sekolah_asal} />
                            <DetailItem icon={GraduationCap} label="Tingkatan / Kelas" value={murid.kelas_sekolah} />
                            <DetailItem icon={Calendar} label="Tanggal Lahir" value={formatDate(murid.tanggal_lahir)} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="py-4 border-b">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Users className="size-4" /> Wali Murid
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="space-y-1">
                            <DetailItem icon={User} label="Nama Lengkap Wali" value={murid.nama_wali} />
                            <DetailItem icon={Phone} label="Nomor HP Wali" value={murid.no_hp_wali} />
                            <DetailItem icon={Mail} label="Alamat Email Wali" value={murid.email_wali} />
                            <DetailItem icon={Users} label="Hubungan Keluarga" value={murid.hubungan_wali} />
                        </div>
                    </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="py-4 border-b">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <StickyNote className="size-4" /> Informasi Medis & Khusus
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-rose-600 font-medium text-xs uppercase tracking-wider">
                          <Heart className="size-3.5" /> Kebutuhan Khusus
                        </div>
                        <div className="p-3 bg-rose-50 rounded-lg text-sm text-muted-foreground leading-relaxed border border-rose-100">
                          {murid.kebutuhan_khusus || "Tidak ada kebutuhan khusus yang dilaporkan."}
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-blue-600 font-medium text-xs uppercase tracking-wider">
                          <Info className="size-3.5" /> Catatan Tambahan
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg text-sm text-muted-foreground leading-relaxed border border-blue-100">
                          {murid.catatan_khusus || "Tidak ada catatan tambahan."}
                        </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="logbook">
              <Card>
                <CardHeader className="py-4 border-b">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <BookOpen className="size-4" /> Riwayat Perkembangan Belajar
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <MuridLogbookList muridId={murid.id} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
