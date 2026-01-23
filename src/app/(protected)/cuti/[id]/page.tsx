"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Calendar, 
  Clock, 
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileText,
  User,
  Paperclip,
  Download,
  AlertTriangle
} from "lucide-react";

function DetailItem({ icon: Icon, label, value, badge, variant = "blue" }: { icon: React.ElementType, label: string, value: string | React.ReactNode, badge?: boolean, variant?: "rose" | "amber" | "emerald" | "blue" | "slate" | "indigo" }) {
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
          {badge && typeof value === 'string' ? (
            <Badge variant="secondary" className={`${badgeClass} border-none h-5 px-2.5 text-[10px] font-bold capitalize`}>
              {value}
            </Badge>
          ) : (
            <div className="text-slate-700 font-semibold text-sm leading-tight">{value || "-"}</div>
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
     } catch (e: any) {
       toast.error(e.message || "Gagal menolak pengajuan");
       setLoading(false);
     }
  }

  if (!allowed) return null;

  if (loading && !cuti) {
    return (
      <div className="space-y-6">
        <PageHeader title="Detail Pengajuan" description="Memuat data..." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 md:col-span-2 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!cuti) return null;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "disetujui":
        return { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", label: "Disetujui" };
      case "diajukan":
        return { icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", label: "Diajukan" };
      case "ditolak":
        return { icon: XCircle, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200", label: "Ditolak" };
      case "dibatalkan":
        return { icon: AlertCircle, color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200", label: "Dibatalkan" };
      default:
        return { icon: AlertCircle, color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200", label: status };
    }
  };

  const statusConfig = getStatusConfig(cuti.status);
  const StatusIcon = statusConfig.icon;

  const startDate = new Date(cuti.start_date || cuti.tanggal);
  const endDate = cuti.end_date ? new Date(cuti.end_date) : startDate;

  return (
    <div className="w-full pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()} 
            className="rounded-full h-10 w-10 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">
              {cuti.karyawan_nama || cuti.karyawan?.user?.name || "Detail Pengajuan"}
            </h1>
            <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
              <span className="font-medium capitalize">{cuti.jenis}</span> 
              <span className="text-slate-200">|</span>
              <Badge 
                variant="outline" 
                className={`${statusConfig.border} ${statusConfig.bg} ${statusConfig.color} h-5 px-2 text-[10px] font-bold uppercase`}
              >
                {statusConfig.label}
              </Badge>
            </div>
          </div>
        </div>

        {cuti.status === "diajukan" && (
          <div className="flex gap-2">
            <Button variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-50 font-bold" onClick={handleReject}>
              Tolak
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 font-bold" onClick={handleApprove}>
              Setujui
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-8">
          <Card className="rounded-[2.5rem] border-none shadow-premium overflow-hidden ring-1 ring-slate-100 p-0">
            <div className={`h-32 bg-linear-to-br from-slate-600 to-slate-500`} />
            <div className="px-8 pb-10 -mt-14 text-center relative z-10">
              <div className="inline-flex p-1.5 bg-white rounded-3xl shadow-xl mb-4 ring-8 ring-white/50">
                <div className="size-24 bg-slate-50 rounded-[1.25rem] flex items-center justify-center">
                  <StatusIcon className={`size-10 ${statusConfig.color}`} />
                </div>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 leading-tight mb-1">
                {cuti.karyawan_nama || cuti.karyawan?.user?.name}
              </h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
                {cuti.karyawan?.kode_karyawan || "-"}
              </p>
              
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 h-7 px-4 text-xs rounded-full border-transparent font-bold capitalize">
                  {cuti.jenis}
                </Badge>
                {cuti.potongan_tipe && cuti.potongan_tipe !== 'none' && (
                  <Badge variant="secondary" className="bg-amber-50 text-amber-700 h-7 px-4 text-xs rounded-full border-transparent font-bold capitalize">
                    Potongan: {cuti.potongan_tipe}
                  </Badge>
                )}
              </div>
            </div>
          </Card>

          <Card className="rounded-3xl border-none shadow-premium ring-1 ring-slate-100 overflow-hidden py-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-50 rounded-xl">
                  <Paperclip className="size-4 text-blue-600" />
                </div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Dokumen Pendukung</h3>
              </div>
              
              {cuti.bukti_pendukung_url ? (
                <div className="space-y-4">
                   <div className="aspect-video bg-slate-50 rounded-2xl overflow-hidden ring-1 ring-slate-100 flex items-center justify-center relative group">
                      {cuti.bukti_pendukung_url.match(/\.(jpeg|jpg|gif|png)$/) ? (
                        <img 
                          src={cuti.bukti_pendukung_url} 
                          alt="Bukti Cuti" 
                          className="object-cover w-full h-full transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex flex-col items-center text-slate-300">
                          <FileText className="size-12 mb-2 opacity-50" />
                          <p className="text-[10px] font-bold uppercase">FILE DOKUMEN</p>
                        </div>
                      )}
                   </div>
                   <Button asChild variant="outline" className="w-full rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-bold">
                    <a href={cuti.bukti_pendukung_url} target="_blank" rel="noreferrer" download>
                      <Download className="mr-2 size-4" />
                      Download Dokumen
                    </a>
                  </Button>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-300">
                  <FileText className="size-12 mx-auto mb-2 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest">Tidak ada dokumen</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="rounded-3xl border-none shadow-premium ring-1 ring-slate-100 overflow-hidden py-0">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-indigo-50 rounded-xl">
                  <Calendar className="size-4 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Detail Waktu</h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5 tracking-tight">Rentang tanggal pengajuan</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-2">
                <DetailItem 
                  icon={Calendar} 
                  label="Tanggal Mulai" 
                  value={format(startDate, "eeee, dd MMMM yyyy", { locale: idLocale })} 
                  variant="emerald" 
                />
                <DetailItem 
                  icon={Calendar} 
                  label="Tanggal Selesai" 
                  value={format(endDate, "eeee, dd MMMM yyyy", { locale: idLocale })} 
                  variant="rose" 
                />
                <DetailItem 
                  icon={Clock} 
                  label="Total Durasi" 
                  value={`${differenceInDays(endDate, startDate) + 1} Hari`} 
                  variant="indigo" 
                />
                <DetailItem 
                   icon={User} 
                   label="Disetujui Oleh" 
                   value={cuti.approver_name || cuti.approver?.name || "-"} 
                   variant="slate" 
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none shadow-premium ring-1 ring-slate-100 overflow-hidden py-0">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-slate-50 rounded-xl">
                  <FileText className="size-4 text-slate-600" />
                </div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Alasan / Catatan</h3>
              </div>
              
              <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 text-slate-600 text-sm leading-relaxed italic">
                &quot;{cuti.keterangan || cuti.catatan || "Tidak ada catatan tambahan."}&quot;
              </div>

              {cuti.potongan_tipe && cuti.potongan_tipe !== 'none' && (
                <div className="mt-6 flex items-start gap-4 p-4 rounded-2xl bg-amber-50/50 border border-amber-100/50 text-amber-800">
                  <AlertTriangle className="size-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest mb-1">Informasi Potongan</p>
                    <p className="text-sm font-medium">
                      Pengajuan ini dikenakan potongan tipe <span className="font-bold uppercase tracking-tight">{cuti.potongan_tipe}</span>senilai <span className="font-bold">Rp {Number(cuti.potongan_nilai).toLocaleString('id-ID')}</span>.
                    </p>
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
