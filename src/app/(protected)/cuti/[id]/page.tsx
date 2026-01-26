"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  getCutiDetail,
  approveCuti,
  rejectCuti 
} from "@/modules/cuti/infrastructure/cuti.repository";
import type { Cuti } from "@/modules/cuti/domain/entities";
import { NotFoundError } from "@/shared/infrastructure/api/errors";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { 
  ArrowLeft,
  Calendar,
  Clock,
  User,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  Paperclip,
  Briefcase
} from "lucide-react";

function DetailItem({ icon: Icon, label, value, badge }: { icon: React.ElementType, label: string, value: string | React.ReactNode, badge?: boolean }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <div className="mt-0.5 p-2 rounded-lg bg-secondary text-secondary-foreground shrink-0 text-slate-500">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground font-medium mb-0.5">{label}</p>
        <div className="truncate">
          {badge && typeof value === 'string' ? (
            <Badge variant="outline" className="font-semibold capitalize">
              {value}
            </Badge>
          ) : (
            <div className="text-sm font-semibold text-foreground">{value || "-"}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CutiDetailPage() {
  const { allowed } = usePermissionGuard("cuti.view");
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [cuti, setCuti] = useState<Cuti | any>(null);
  const [loading, setLoading] = useState(true);

  const { setItems } = useBreadcrumbStore();

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Pengajuan Cuti", href: "/cuti" },
      { label: "Detail Pengajuan" },
    ]);
  }, [setItems]);

  const fetchData = useCallback(async () => {
    try {
      const data = await getCutiDetail(id);
      setCuti(data);
    } catch (e) {
      if (e instanceof NotFoundError) {
        toast.error("Data pengajuan tidak ditemukan");
        router.replace("/cuti");
      } else {
        toast.error("Gagal memuat data pengajuan");
      }
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (!allowed || !id || Number.isNaN(id)) return;
    fetchData();
  }, [allowed, id, fetchData]);

  async function handleApprove() {
    try {
      setLoading(true);
      await approveCuti(id);
      toast.success("Pengajuan disetujui");
      fetchData();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      toast.error(e.message || "Gagal menyetujui pengajuan");
      setLoading(false);
    }
  }

  async function handleReject() {
     try {
       setLoading(true);
       await rejectCuti(id);
       toast.success("Pengajuan ditolak");
       fetchData();
     // eslint-disable-next-line @typescript-eslint/no-explicit-any
     } catch (e: any) {
       toast.error(e.message || "Gagal menolak pengajuan");
       setLoading(false);
     }
  }

  if (!allowed) return null;

  if (loading && !cuti) {
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

  if (!cuti) return null;

  const startDate = new Date(cuti.start_date || cuti.tanggal);
  const endDate = cuti.end_date ? new Date(cuti.end_date) : startDate;

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'disetujui': return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 capitalize">{status}</Badge>;
      case 'ditolak': return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 capitalize">{status}</Badge>;
      case 'diajukan': return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 capitalize">{status}</Badge>;
      default: return <Badge variant="secondary" className="capitalize">{status}</Badge>;
    }
  }

  return (
    <div className="w-full pb-10 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.back()} className="h-9 w-9">
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight">Detail Pengajuan Cuti</h1>
            <div className="flex items-center gap-2 mt-1">
               <Badge variant="secondary" className="font-mono text-[10px] px-2 py-0 border">
                 {cuti.jenis}
               </Badge>
               {getStatusBadge(cuti.status)}
            </div>
          </div>
        </div>
        
        {cuti.status === "diajukan" && (
          <div className="flex items-center gap-2">
            <Button variant="destructive" onClick={handleReject} disabled={loading}>
              <XCircle className="mr-2 size-4" />
              Tolak
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleApprove} disabled={loading}>
              <CheckCircle2 className="mr-2 size-4" />
              Setujui
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Requester Profile */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center pb-6 border-b mb-4">
                 <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4 border">
                   <User className="size-10" />
                 </div>
                 <h2 className="text-xl font-bold">{cuti.karyawan_nama || cuti.karyawan?.user?.name || "-"}</h2>
                 <p className="text-sm text-muted-foreground mt-1 font-medium">
                   {cuti.karyawan?.kode_karyawan || "-"}
                 </p>
                 <div className="flex flex-wrap justify-center gap-2 mt-4">
                    <Badge variant="outline">
                      {cuti.karyawan?.divisi || "Karyawan"}
                    </Badge>
                 </div>
              </div>
              <div className="space-y-1">
                 <DetailItem icon={Briefcase} label="Divisi" value={cuti.karyawan?.divisi} />
                 <DetailItem icon={Briefcase} label="Jabatan" value={cuti.karyawan?.jabatan} />
              </div>
            </CardContent>
          </Card>

          {cuti.bukti_pendukung_url && (
            <Card>
                <CardHeader className="py-4 border-b">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Paperclip className="size-4" /> Dokumen Pendukung
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="aspect-video bg-slate-50 rounded-lg overflow-hidden border flex items-center justify-center relative group mb-4">
                        { }
                        {cuti.bukti_pendukung_url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                        <img 
                            src={cuti.bukti_pendukung_url} 
                            alt="Bukti Cuti" 
                            className="object-cover w-full h-full"
                        />
                        ) : (
                        <div className="flex flex-col items-center text-slate-400">
                            <FileText className="size-8 mb-2" />
                            <p className="text-xs font-medium uppercase">File Dokumen</p>
                        </div>
                        )}
                    </div>
                    <Button asChild variant="outline" className="w-full">
                        <a href={cuti.bukti_pendukung_url} target="_blank" rel="noreferrer" download>
                        <Download className="mr-2 size-4" />
                        Download
                        </a>
                    </Button>
                </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Leave Details */}
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader className="py-4 border-b">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Calendar className="size-4" /> Detail Jadwal Cuti
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
                        <DetailItem 
                            icon={Calendar} 
                            label="Tanggal Mulai" 
                            value={format(startDate, "eeee, dd MMMM yyyy", { locale: idLocale })} 
                        />
                        <DetailItem 
                            icon={Calendar} 
                            label="Tanggal Selesai" 
                            value={format(endDate, "eeee, dd MMMM yyyy", { locale: idLocale })} 
                        />
                        <DetailItem 
                            icon={Clock} 
                            label="Total Durasi" 
                            value={`${differenceInDays(endDate, startDate) + 1} Hari`} 
                        />
                         <DetailItem 
                            icon={FileText} 
                            label="Tipe Potongan" 
                            value={cuti.potongan_tipe === 'none' ? 'Tidak Ada' : cuti.potongan_tipe} 
                            badge
                        />
                         <DetailItem 
                            icon={User} 
                            label="Disetujui Oleh" 
                            value={cuti.approver_name || cuti.approver?.name || "-"} 
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="py-4 border-b">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <FileText className="size-4" /> Keterangan / Alasan
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="p-4 bg-slate-50/50 rounded-lg border text-sm text-slate-600 leading-relaxed">
                        {cuti.keterangan || cuti.catatan || "Tidak ada keterangan tambahan."}
                    </div>

                    {cuti.potongan_nilai && Number(cuti.potongan_nilai) > 0 && (
                        <div className="mt-4 flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100 text-amber-800 text-sm">
                            <AlertCircle className="size-5 shrink-0" />
                            <div>
                                <p className="font-semibold mb-1">Informasi Potongan Gaji</p>
                                <p>Pengajuan ini akan memotong gaji sebesar <span className="font-bold">Rp {Number(cuti.potongan_nilai).toLocaleString('id-ID')}</span></p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
