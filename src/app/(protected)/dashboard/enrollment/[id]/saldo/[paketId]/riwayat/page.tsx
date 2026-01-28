"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  Clock, 
  User, 
  History, 
  Loader2, 
  ChevronLeft,
  Package,
  Calendar,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";

import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import { enrollmentRepository } from "@/modules/enrollment/infrastructure/enrollment.repository";
import { saldoPertemuanApi, LedgerItem } from "@/lib/api/saldo-pertemuan";
import { cn } from "@/lib/utils";

function DetailItem({ icon: Icon, label, value, badge }: { icon: React.ElementType, label: string, value: React.ReactNode, badge?: boolean }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <div className="mt-0.5 p-2 rounded-lg bg-secondary text-secondary-foreground shrink-0">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground font-medium mb-0.5">{label}</p>
        <div className="">
          {badge && value ? (
            <Badge variant="outline" className="font-semibold text-[11px]">{value}</Badge>
          ) : (
            <div className="text-sm font-semibold text-foreground">{value || "-"}</div>
          )}
        </div>
      </div>
    </div>
  );
}

import { Suspense } from "react";

function RiwayatSaldoContent({ 
  params 
}: { 
  params: Promise<{ id: string, paketId: string }> 
}) {
  const { allowed } = usePermissionGuard("enrollment.view");
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const enrollmentId = Number(resolvedParams.id);
  const paketMuridId = Number(resolvedParams.paketId);
  const isAll = searchParams.get("all") === "true";
  const targetPaketId = searchParams.get("paket_id") ? Number(searchParams.get("paket_id")) : undefined;
  
  const router = useRouter();

  const [enrollment, setEnrollment] = useState<any>(null);
  const [data, setData] = useState<LedgerItem[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [page, setPage] = useState(1);
  const [saldoSummary, setSaldoSummary] = useState<{ saldo_current: number } | null>(null);

  const { setItems } = useBreadcrumbStore();

  useEffect(() => {
    if (enrollment) {
      setItems([
        { label: "Dashboard", href: "/dashboard" },
        { label: "Enrollment", href: "/dashboard/enrollment" },
        { label: enrollment.kode_enrollment, href: `/dashboard/enrollment/${enrollmentId}` },
        { label: "Riwayat Saldo" },
      ]);
    } else {
      setItems([
        { label: "Dashboard", href: "/dashboard" },
        { label: "Enrollment", href: "/dashboard/enrollment" },
        { label: "Detail Enrollment", href: `/dashboard/enrollment/${enrollmentId}` },
        { label: "Riwayat Saldo" },
      ]);
    }
  }, [setItems, enrollment, enrollmentId]);

  const fetchLedger = useCallback(async (p: number) => {
    setLoadingLedger(true);
    try {
      const res = await saldoPertemuanApi.getLedger(
        paketMuridId, 
        p, 
        isAll ? enrollmentId : undefined, 
        isAll ? targetPaketId : undefined
      );
      setData(res.data || []);
      setMeta(res.meta);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat riwayat ledger");
    } finally {
      setLoadingLedger(false);
    }
  }, [paketMuridId, isAll, enrollmentId, targetPaketId]);

  const fetchData = useCallback(async () => {
    if (!allowed || !enrollmentId) return;
    try {
      const enrollmentData = await enrollmentRepository.getEnrollment(enrollmentId);
      setEnrollment(enrollmentData);
      
      // Fetch saldo summary to show totals
      const saldoData = await saldoPertemuanApi.getSaldoEnrollment(enrollmentId);
      
      const filteredSaldo = isAll && targetPaketId 
        ? saldoData.filter(s => Number(s.paket_id) === Number(targetPaketId))
        : saldoData.filter(s => Number(s.id) === Number(paketMuridId));
      
      const summary = filteredSaldo.reduce((acc, curr) => ({
        saldo_current: acc.saldo_current + Number(curr.saldo_current),
      }), { saldo_current: 0 });
      
      (window as any)._saldoSummary = summary; // Quick hack or use state
      setSaldoSummary(summary);

      await fetchLedger(1);
    } catch {
      toast.error("Gagal memuat data");
      router.replace(`/dashboard/enrollment/${enrollmentId}`);
    } finally {
      setLoading(false);
    }
  }, [allowed, enrollmentId, fetchLedger, router, isAll, targetPaketId, paketMuridId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchLedger(newPage);
  };

  const formatDate = (s: string | null | undefined) => {
    if (!s) return "-";
    try {
      const d = new Date(s);
      return isNaN(d.getTime()) ? String(s) : d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    } catch {
      return String(s);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'TOPUP': return <Badge variant="default" className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 uppercase text-[10px]">Topup</Badge>;
      case 'USE': return <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200 uppercase text-[10px]">Terpakai</Badge>;
      case 'ADJUST': return <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 uppercase text-[10px]">Adjust</Badge>;
      case 'EXPIRE': return <Badge variant="destructive" className="bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 uppercase text-[10px]">Hangus</Badge>;
      default: return <Badge variant="outline" className="uppercase text-[10px]">{type}</Badge>;
    }
  };

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
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

  return (
    <div className="w-full pb-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.back()} className="h-9 w-9">
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight">
              Riwayat {isAll ? "Gabungan " : ""}Saldo
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="font-mono text-[10px] px-2 py-0 border">
                 {enrollment?.kode_enrollment || "N/A"}
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                {data[0]?.paket_murid?.paket?.nama || enrollment?.paket?.nama || "Paket"}
              </Badge>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                {enrollment?.status || "Aktif"}
              </Badge>
            </div>
          </div>
        </div>
        
        {isAll && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-2 flex items-center gap-3">
            <div className="text-xs text-emerald-600 font-medium uppercase tracking-wider">Status</div>
            <div className="text-sm font-bold text-emerald-700">Teragregasi</div>
          </div>
        )}
      </div>

      {saldoSummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex flex-col gap-1">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Sisa Saldo Saat Ini</span>
            <div className="text-2xl font-black text-emerald-700">{saldoSummary.saldo_current} <span className="text-xs font-normal">Pertemuan</span></div>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col gap-1">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Tipe Paket</span>
            <div className="text-sm font-bold text-blue-800 truncate">{enrollment?.paket?.nama || "Reguler"}</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status Enrollment</span>
            <div className="text-sm font-bold text-slate-700">{enrollment?.status || "Aktif"}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Student Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center pb-6 border-b mb-4">
                 <div className="size-16 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 mb-4 border">
                    <User className="size-8" />
                 </div>
                 <h2 className="text-xl font-bold">{enrollment?.murid?.nama_lengkap || "-"}</h2>
                 <p className="text-sm text-muted-foreground mt-1 font-medium">
                    {enrollment?.murid?.kode_murid || "BELUM ADA KODE"}
                 </p>
                 <div className="flex gap-2 mt-4">
                    <Button asChild variant="outline" size="sm" className="h-8 text-xs font-bold">
                        <Link href={`/dashboard/murid/${enrollment?.murid?.id || enrollment?.murid_id}`}>
                            Lihat Profil
                        </Link>
                    </Button>
                 </div>
              </div>

              <div className="space-y-1">
                 <DetailItem icon={GraduationCap} label="Jenjang" value={enrollment?.jenjang?.nama} />
                 <DetailItem icon={BookOpen} label="Program" value={enrollment?.program?.nama} />
                 <DetailItem icon={Package} label="Tipe Paket" value={enrollment?.paket?.nama} />
                 <DetailItem 
                    icon={Calendar} 
                    label="Periode Mulai" 
                    value={enrollment?.tanggal_mulai ? formatDate(enrollment.tanggal_mulai) : '-'} 
                 />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Ledger Log */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <History className="size-4 text-primary" /> Log Aktivitas Saldo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="min-h-[400px]">
                {loadingLedger ? (
                  <div className="flex flex-col items-center justify-center py-32 gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-primary/30" />
                    <p className="text-xs text-muted-foreground">Menghubungkan ke pusat data...</p>
                  </div>
                ) : data.length > 0 ? (
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow className="hover:bg-transparent capitalize">
                        <TableHead className="w-[180px] font-bold py-4 px-6 text-[11px] tracking-wider text-muted-foreground">Waktu & Tanggal</TableHead>
                        <TableHead className="font-bold py-4 text-[11px] tracking-wider text-muted-foreground">Tipe</TableHead>
                        <TableHead className="text-right font-bold py-4 text-[11px] tracking-wider text-muted-foreground">Qty</TableHead>
                        <TableHead className="font-bold py-4 px-6 text-[11px] tracking-wider text-muted-foreground">Keterangan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.map((item) => (
                        <TableRow key={item.id} className="hover:bg-slate-50/30 transition-colors">
                          <TableCell className="py-4 px-6">
                            <div className="font-bold text-sm">
                                {format(new Date(item.tanggal), "dd MMM yyyy")}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1 mt-1">
                                <Clock className="size-3" />
                                {format(new Date(item.created_at), "HH:mm:ss")}
                            </div>
                          </TableCell>
                          <TableCell className="py-4 font-medium">{getTypeBadge(item.type)}</TableCell>
                          <TableCell className={cn(
                              "py-4 text-right font-bold text-base",
                              item.qty > 0 ? "text-emerald-600" : "text-rose-600"
                          )}>
                            {item.qty > 0 ? `+${item.qty}` : item.qty}
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <div className="text-xs font-medium text-slate-700 leading-relaxed">
                                {item.reason || "-"}
                            </div>
                            {item.created_by && (
                                <div className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1.5 font-medium">
                                    <div className="size-4 rounded-full bg-slate-100 flex items-center justify-center border text-[8px]">
                                        <User className="size-2.5" />
                                    </div>
                                    <span>{item.created_by.name}</span>
                                </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-32 text-center">
                    <div className="p-4 bg-slate-50 rounded-full mb-4">
                       <History className="size-8 text-slate-200" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">Tidak Ada Aktivitas</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                       Belum ada riwayat transaksi atau aktivitas saldo yang tercatat untuk paket ini.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>

            {meta && meta.last_page > 1 && (
              <div className="p-4 border-t bg-slate-50/30 flex items-center justify-between px-6">
                <p className="text-[11px] text-muted-foreground font-medium">
                    Halaman <span className="text-foreground font-bold">{meta.current_page}</span> dari <span className="text-foreground font-bold">{meta.last_page}</span>
                </p>
                <Pagination className="w-auto mx-0">
                  <PaginationContent>
                    <PaginationItem>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page <= 1}
                        className="h-8 text-[11px] font-bold"
                      >
                        <ChevronLeft className="size-4 mr-1" />
                        Prev
                      </Button>
                    </PaginationItem>
                    
                    <PaginationItem>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page >= meta.last_page}
                        className="h-8 text-[11px] font-bold ml-2"
                      >
                        Next
                        <ChevronLeft className="size-4 ml-1 rotate-180" />
                      </Button>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </Card>
          
          <div className="flex justify-center flex-col items-center gap-2 pt-4">
              <Link href={`/dashboard/enrollment/${enrollmentId}`}>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary gap-2 font-bold text-xs">
                    <ArrowLeft className="size-3" />
                    Kembali ke Detail Enrollment
                </Button>
              </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RiwayatSaldoPage({ 
  params 
}: { 
  params: Promise<{ id: string, paketId: string }> 
}) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-32"><Loader2 className="animate-spin" /></div>}>
        <RiwayatSaldoContent params={params} />
    </Suspense>
  );
}
