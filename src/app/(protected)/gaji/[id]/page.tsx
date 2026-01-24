"use client";

import { useEffect, useState, use } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { toast } from "sonner";
import { formatCurrency } from "@/shared/infrastructure/utils/format";
import { authStore } from "@/modules/auth/infrastructure/auth.store";

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
        <p className="text-slate-700 font-bold text-sm leading-tight">{value || "-"}</p>
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
        if (!confirm("Tandai gaji ini sebagai sudah dibayar/ditransfer?")) return;
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

    if (!allowed) return null;

    if (loading || !payroll) {
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

    const isPaid = payroll.status === "paid" || payroll.status === "transferred";

    return (
        <div className="w-full pb-10">
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-9 w-9 text-slate-400 hover:text-rose-600">
                    <ArrowLeft className="size-4" />
                </Button>
                <div className="flex flex-col">
                    <h1 className="text-xl font-bold tracking-tight text-slate-800 leading-tight">
                        Slip Gaji
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mt-0.5 font-medium">
                        <span className="uppercase tracking-widest text-xs">Periode {payroll.bulan}/{payroll.tahun}</span>
                        <span>•</span>
                        <Badge variant="outline" className={isPaid ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600"}>
                            {payroll.status.toUpperCase()}
                        </Badge>
                    </div>
                </div>
                <div className="ml-auto flex gap-2">
                     {canManage && !isPaid && (
                        <Button onClick={handleMarkAsPaid} disabled={processing} className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white">
                            <CheckCircle className="mr-2 size-4" />
                            Tandai Lunas
                        </Button>
                     )}
                     <Button variant="outline" className="rounded-full px-5 h-9 border-slate-200" disabled>
                        <Printer className="mr-2 size-3.5" />
                        Cetak Slip
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="rounded-3xl border-none shadow-premium overflow-hidden ring-1 ring-slate-100 p-0">
                        <div className="h-28 bg-linear-to-br from-indigo-600 to-violet-500" />
                        <div className="px-6 pb-8 -mt-12 text-center relative z-10">
                            <div className="inline-flex p-1 bg-white rounded-2xl shadow-md mb-3 ring-4 ring-white/50">
                                <div className="size-20 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300">
                                    <Banknote className="size-10" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 leading-tight mb-1">
                                {payroll.employee.nama}
                            </h2>
                            <p className="text-sm text-slate-400 font-medium mb-6">
                                {payroll.employee.kode_karyawan}
                            </p>
                            
                            <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 h-6 px-3 text-xs rounded-full border-transparent font-semibold uppercase">
                                {payroll.employee.kategori_karyawan}
                            </Badge>
                        </div>
                    </Card>

                    <Card className="rounded-2xl border shadow-lg bg-slate-900 text-white overflow-hidden">
                        <CardContent className="p-6">
                             <div className="flex items-center gap-2 mb-4">
                                <Wallet className="size-4 text-emerald-400" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Take Home Pay</span>
                             </div>
                             <p className="text-3xl font-black text-white mb-1">
                                {formatCurrency(Number(payroll.gaji_bersih))}
                             </p>
                             <p className="text-[10px] text-slate-500 font-medium">Gaji bersih yang diterima</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Payroll Details */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="rounded-2xl border-none shadow-premium ring-1 ring-slate-100 overflow-hidden py-0">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-2.5 mb-4 px-1">
                                <div className="p-1.5 bg-emerald-50 rounded-md">
                                    <TrendingUp className="size-3.5 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-tight">Pendapatan</h3>
                                    <p className="text-[10px] text-slate-400 mt-px">Rincian komponen penerimaan</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0.5 px-1">
                                <DetailItem icon={CreditCard} label="Gaji Pokok" value={formatCurrency(Number(payroll.gaji_pokok))} />
                                <DetailItem icon={Briefcase} label="Fee Sesi Selesai" value={formatCurrency(Number(payroll.total_fee_mengajar))} />
                                
                                {payroll.detail_pendapatan?.map((p: any, idx: number) => (
                                    p.jenis !== 'Gaji Pokok' && p.jenis !== 'Fee Mengajar' && (
                                        <DetailItem key={idx} icon={TrendingUp} label={p.jenis} value={formatCurrency(Number(p.nilai))} />
                                    )
                                ))}

                                <div className="md:col-span-2 mt-4 pt-4 border-t border-slate-100">
                                        <div className="flex justify-between items-center px-1">
                                            <span className="text-sm font-bold text-slate-800">Total Kotor</span>
                                            <span className="text-xl font-black text-emerald-600">
                                                {formatCurrency(Number(payroll.gaji_pokok) + Number(payroll.total_fee_mengajar))}
                                            </span>
                                        </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-none shadow-premium ring-1 ring-slate-100 overflow-hidden py-0">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-2.5 mb-4 px-1">
                                <div className="p-1.5 bg-rose-50 rounded-md">
                                    <MinusCircle className="size-3.5 text-rose-600" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-tight">Potongan</h3>
                                    <p className="text-[10px] text-slate-400 mt-px">Rincian pengurangan gaji</p>
                                </div>
                            </div>
                            <div className="px-1">
                                {(!payroll.detail_potongan || payroll.detail_potongan.length === 0) ? (
                                        <div className="py-6 text-center bg-slate-50 border border-dashed rounded-xl mb-4">
                                        <p className="text-xs text-slate-400 italic">Tidak ada potongan pada periode ini</p>
                                        </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0.5 mb-4">
                                        {payroll.detail_potongan.map((p: any, idx: number) => (
                                            <DetailItem 
                                                key={idx} 
                                                icon={MinusCircle} 
                                                label={`${p.jenis} (${p.jumlah_hari} hari)`} 
                                                value={`-${formatCurrency(p.total)}`} 
                                                colorClass="bg-rose-50 text-rose-500"
                                            />
                                        ))}
                                    </div>
                                )}
                                <div className="pt-4 border-t border-slate-100">
                                        <div className="flex justify-between items-center px-1">
                                            <span className="text-sm font-bold text-slate-800">Total Potongan</span>
                                            <span className="text-lg font-bold text-rose-600">-{formatCurrency(Number(payroll.total_potongan))}</span>
                                        </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
