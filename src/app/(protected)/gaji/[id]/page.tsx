"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { payrollService, Payroll } from "@/modules/hr/infrastructure/payroll.service";
import { 
  Printer, 
  Banknote, 
  ArrowLeft,
  CreditCard,
  TrendingUp,
  MinusCircle,
  Briefcase,
  CheckCircle,
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { toast } from "sonner";
import { formatCurrency } from "@/shared/infrastructure/utils/format";
import { authStore } from "@/modules/auth/infrastructure/auth.store";

interface PageProps {
  params: Promise<{ id: string }>;
}

function DetailItem({ icon: Icon, label, value, colorClass }: { icon: React.ElementType, label: string, value: string | number | null | undefined, colorClass?: string }) {
  // We ignore colorClass now to standardize, or use it to subtly color the icon box if really needed.
  // Standard implementation matches other pages:
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-200">
      <div className="mt-0.5 p-2 rounded-lg bg-secondary text-secondary-foreground shrink-0 text-slate-500">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground font-medium mb-0.5">{label}</p>
        <div className="text-sm font-semibold text-foreground">{value || "-"}</div>
      </div>
    </div>
  );
}

export default function PayrollDetailPage({ params }: PageProps) {
    const { id } = use(params);
    const { allowed } = usePermissionGuard("gaji.view");
    const canManage = authStore.hasPermission("gaji.manage");
    const router = useRouter();
    const { setItems } = useBreadcrumbStore();

    const [loading, setLoading] = useState(true);
    const [payroll, setPayroll] = useState<Payroll | null>(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        setItems([
            { label: "Dashboard", href: "/dashboard" },
            { label: "Gaji Bulanan", href: "/gaji" },
            { label: "Detail Gaji" },
        ]);
    }, [setItems]);

    async function loadData() {
        if (!allowed) return;
        setLoading(true);
        try {
            const result = await payrollService.getPayrollDetail(parseInt(id));
            setPayroll(result);
        } catch (e: any) {
            toast.error("Gagal memuat detail gaji");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, [allowed, id]);

    async function handleMarkAsPaid() {
        setProcessing(true);
        try {
            await payrollService.updateStatus(parseInt(id), "paid");
            toast.success("Status berhasil diperbarui");
            loadData();
        } catch (e) {
            toast.error("Gagal memperbarui status");
        } finally {
            setProcessing(false);
        }
    }

    async function handleDownload() {
        if (!payroll) return;
        setProcessing(true);
        try {
            const filename = `slip_gaji_${payroll.employee.user?.name || payroll.employee.kode_karyawan}_${payroll.bulan}_${payroll.tahun}.pdf`;
            await payrollService.downloadSlip(payroll.id, filename);
            toast.success("Mempersiapkan download slip...");
        } catch (e) {
            toast.error("Gagal mendownload slip gaji");
        } finally {
            setProcessing(false);
        }
    }

    if (!allowed) return null;

    if (loading || !payroll) {
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

    const isPaid = payroll.status === "paid" || payroll.status === "transferred";

    return (
        <div className="w-full pb-10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" onClick={() => router.back()} className="h-9 w-9">
                        <ArrowLeft className="size-4" />
                    </Button>
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-bold tracking-tight">Slip Gaji</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="font-mono text-[10px] px-2 py-0 border">
                                Periode {payroll.bulan}/{payroll.tahun}
                            </Badge>
                            <Badge variant={isPaid ? "outline" : "secondary"} className={isPaid ? "bg-emerald-50 text-emerald-700 border-emerald-200" : ""}>
                                {payroll.status.toUpperCase()}
                            </Badge>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                     {canManage && !isPaid && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button disabled={processing} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                    <CheckCircle className="mr-2 size-4" />
                                    Tandai Lunas
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Konfirmasi Pembayaran</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Apakah Anda yakin ingin menandai gaji periode {payroll.bulan}/{payroll.tahun} untuk <b>{payroll.employee.user?.name}</b> sebagai sudah dibayar?
                                        <br/><br/>
                                        Tindakan ini akan mencatat tanggal pembayaran hari ini.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleMarkAsPaid} className="bg-emerald-600 hover:bg-emerald-700">
                                        Ya, Sudah Dibayar
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                     )}
                     <Button variant="outline" onClick={handleDownload} disabled={processing}>
                        <Printer className="mr-2 size-4" />
                        Download Slip
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Summary Card */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center text-center pb-6 border-b mb-4">
                                <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4 border">
                                    <Banknote className="size-10" />
                                </div>
                                <h2 className="text-xl font-bold">{payroll.employee.user?.name || (payroll.employee as any).nama}</h2>
                                <p className="text-sm text-muted-foreground mt-1 font-medium">
                                    {payroll.employee.kode_karyawan}
                                </p>
                                <div className="flex flex-wrap justify-center gap-2 mt-4">
                                    <Badge variant="outline">
                                        {payroll.employee.kategori_karyawan}
                                    </Badge>
                                </div>
                            </div>

                             <div className="bg-slate-900 rounded-lg p-5 text-white mb-2">
                                <div className="flex items-center gap-2 mb-2 text-slate-400">
                                    <Wallet className="size-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Take Home Pay</span>
                                </div>
                                <p className="text-3xl font-bold tracking-tight">
                                    {formatCurrency(Number(payroll.gaji_bersih))}
                                </p>
                                <p className="text-xs text-slate-500 font-medium mt-1">Gaji bersih yang diterima</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Detailed Info */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="py-4 border-b">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <TrendingUp className="size-4" /> Pendapatan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
                                <DetailItem icon={CreditCard} label="Gaji Pokok" value={formatCurrency(Number(payroll.gaji_pokok))} />
                                <DetailItem icon={Briefcase} label="Fee Sesi Selesai" value={formatCurrency(Number(payroll.total_fee_mengajar))} />
                                
                                {payroll.detail_pendapatan?.map((p: any, idx: number) => (
                                    p.jenis !== 'Gaji Pokok' && p.jenis !== 'Fee Mengajar' && (
                                        <DetailItem key={idx} icon={TrendingUp} label={p.jenis} value={formatCurrency(Number(p.nilai))} />
                                    )
                                ))}
                            </div>
                            <div className="mt-4 pt-4 border-t flex justify-between items-center">
                                <span className="text-sm font-bold">Total Kotor</span>
                                <span className="text-lg font-bold text-emerald-600">
                                    {formatCurrency(Number(payroll.gaji_pokok) + Number(payroll.total_fee_mengajar))}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="py-4 border-b">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <MinusCircle className="size-4" /> Potongan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {(!payroll.detail_potongan || payroll.detail_potongan.length === 0) ? (
                                <div className="py-6 text-center bg-slate-50 border border-dashed rounded-lg mb-4">
                                    <p className="text-xs text-slate-400 italic">Tidak ada potongan pada periode ini</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
                                    {payroll.detail_potongan.map((p: any, idx: number) => (
                                        <DetailItem 
                                            key={idx} 
                                            icon={MinusCircle} 
                                            label={`${p.jenis} (${p.jumlah_hari} hari)`} 
                                            value={`-${formatCurrency(p.total)}`} 
                                        />
                                    ))}
                                </div>
                            )}
                            <div className="mt-4 pt-4 border-t flex justify-between items-center">
                                <span className="text-sm font-bold">Total Potongan</span>
                                <span className="text-lg font-bold text-rose-600">-{formatCurrency(Number(payroll.total_potongan))}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
