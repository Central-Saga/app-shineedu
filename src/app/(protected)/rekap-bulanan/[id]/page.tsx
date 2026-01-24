"use client";

import { useEffect, useState, use } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { rekapService } from "@/modules/hr/infrastructure/rekap.service";
import { 
  ChevronLeft, 
  Clock, 
  XCircle, 
  CheckCircle, 
  Loader2, 
  CalendarDays, 
  Briefcase, 
  CalendarCheck,
  User,
  Activity,
  UserCheck,
  ArrowLeft,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MonthYearSelect } from "@/modules/hr/presentation/components/month-year-select";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";

interface PageProps {
  params: Promise<{ id: string }>;
}

function DetailItem({ icon: Icon, label, value, colorClass = "bg-slate-50 text-slate-500" }: { icon: React.ElementType, label: string, value: string | number | null | undefined, colorClass?: string }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b last:border-0 border-slate-50/80">
      <div className={`mt-0.5 p-1.5 ${colorClass} rounded-md shrink-0`}>
        <Icon className="size-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-slate-700 font-bold text-sm leading-tight">{value ?? 0}</p>
      </div>
    </div>
  );
}

export default function RekapBulananDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { allowed } = usePermissionGuard("rekap_bulanan.view");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setItems } = useBreadcrumbStore();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const bulan = parseInt(searchParams.get("bulan") || String(now.getMonth() + 1));
  const tahun = parseInt(searchParams.get("tahun") || String(now.getFullYear()));

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Rekap Bulanan", href: "/rekap-bulanan" },
      { label: "Detail Rekap" },
    ]);
  }, [setItems]);

  useEffect(() => {
    if (!allowed) return;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const result = await rekapService.getRekapDetail(parseInt(id), { bulan, tahun });
        setData(result);
      } catch (e: any) {
        setError(e.message || "Data detail tidak tersedia (501)");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [allowed, id, bulan, tahun]);

  if (!allowed) return null;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-8">
            <Skeleton className="size-9 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 md:col-span-2 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pb-10">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-9 w-9 text-slate-400 hover:text-rose-600">
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold tracking-tight text-slate-800 leading-tight">
            Rekap Bulanan Karyawan
          </h1>
          <div className="flex items-center gap-2 text-sm text-slate-400 mt-0.5">
            <span className="font-medium text-xs uppercase tracking-widest">Periode {bulan}/{tahun}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-3xl border-none shadow-premium overflow-hidden ring-1 ring-slate-100 p-0">
            <div className="h-28 bg-linear-to-br from-slate-800 to-slate-900" />
            <div className="px-6 pb-8 -mt-12 text-center relative z-10">
              <div className="inline-flex p-1 bg-white rounded-2xl shadow-md mb-3 ring-4 ring-white/50">
                <div className="size-20 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300">
                  <User className="size-10" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 leading-tight mb-1">
                {data?.employee?.nama || "-"}
              </h2>
              <p className="text-sm text-slate-400 font-medium mb-6">
                 {data?.employee?.kode_karyawan || "-"}
              </p>
              
              <div className="flex flex-wrap justify-center gap-1.5">
                <Badge variant="secondary" className="bg-slate-100 text-slate-700 h-6 px-3 text-xs rounded-full border-transparent font-semibold uppercase">
                  {data?.employee?.tipe_gaji}
                </Badge>
                <Badge variant="secondary" className="bg-rose-50 text-rose-700 h-6 px-3 text-xs rounded-full border-transparent font-semibold capitalize">
                  {data?.employee?.kategori_karyawan}
                </Badge>
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border-none shadow-sm ring-1 ring-slate-100 overflow-hidden py-0">
            <CardContent className="p-5">
              <div className="flex items-center gap-2.5 mb-4 px-1">
                <div className="p-1.5 bg-slate-50 rounded-md">
                  <Calendar className="size-3.5 text-slate-600" />
                </div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-tight">Pilih Periode</h3>
              </div>
              <MonthYearSelect defaultMonth={bulan} defaultYear={tahun} className="w-full" />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Detailed Info */}
        <div className="lg:col-span-2 space-y-6">
           {error ? (
                <div className="p-12 text-center border-2 border-dashed rounded-2xl bg-slate-50 border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Gagal Memuat Detail</h3>
                    <p className="text-slate-400 mb-6 max-w-sm mx-auto font-medium text-sm">{error}</p>
                    <Button variant="outline" asChild>
                        <Link href="/rekap-bulanan">Kembali ke Daftar</Link>
                    </Button>
                </div>
           ) : (
                <>
                    {/* Kehadiran Section */}
                    <Card className="rounded-2xl border-none shadow-premium ring-1 ring-slate-100 overflow-hidden py-0">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-2.5 mb-4 px-1">
                                <div className="p-1.5 bg-emerald-50 rounded-md">
                                    <UserCheck className="size-3.5 text-emerald-600" />
                                </div>
                                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-tight">Ringkasan Kehadiran</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0.5 px-1">
                                <DetailItem icon={CheckCircle} label="Total Hadir" value={data.absensi?.hadir} colorClass="bg-emerald-50 text-emerald-600" />
                                <DetailItem icon={Clock} label="Durasi Kerja (Jam)" value={data.absensi?.total_durasi_menit ? Math.round(data.absensi.total_durasi_menit / 60) : 0} colorClass="bg-blue-50 text-blue-600" />
                                <DetailItem icon={Activity} label="Izin (Absensi)" value={data.absensi?.izin} colorClass="bg-slate-100 text-slate-400" />
                                <DetailItem icon={XCircle} label="Sakit (Absensi)" value={data.absensi?.sakit} colorClass="bg-rose-50 text-rose-500" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Cuti Section */}
                    <Card className="rounded-2xl border-none shadow-premium ring-1 ring-slate-100 overflow-hidden py-0">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-2.5 mb-4 px-1">
                                <div className="p-1.5 bg-amber-50 rounded-md">
                                    <CalendarCheck className="size-3.5 text-amber-600" />
                                </div>
                                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-tight">Status Cuti & Izin HR</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0.5 px-1">
                                <DetailItem icon={CalendarCheck} label="Cuti Disetujui" value={data.cuti?.cuti_disetujui} colorClass="bg-amber-50 text-amber-600" />
                                <DetailItem icon={CalendarCheck} label="Izin Berbayar" value={data.cuti?.izin_disetujui} colorClass="bg-amber-50 text-amber-600" />
                                <DetailItem icon={Activity} label="Sakit Approval" value={data.cuti?.sakit_disetujui} colorClass="bg-slate-100 text-slate-400" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Jadwal Section */}
                    <Card className="rounded-2xl border-none shadow-premium ring-1 ring-slate-100 overflow-hidden py-0">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-2.5 mb-4 px-1">
                                <div className="p-1.5 bg-indigo-50 rounded-md">
                                    <Briefcase className="size-3.5 text-indigo-600" />
                                </div>
                                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-tight">Kinerja Sesi Belajar</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-0.5 px-1">
                                <DetailItem icon={Briefcase} label="Sesi Terlaksana" value={data.jadwal?.sesi_terlaksana} colorClass="bg-indigo-50 text-indigo-600" />
                                <DetailItem icon={Briefcase} label="Menggantikan" value={data.jadwal?.sesi_menggantikan} colorClass="bg-indigo-50 text-indigo-600" />
                                <DetailItem icon={Briefcase} label="Digantikan" value={data.jadwal?.sesi_digantikan} colorClass="bg-slate-100 text-slate-400" />
                            </div>
                        </CardContent>
                    </Card>
                </>
           )}
        </div>
      </div>
    </div>
  );
}
