"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { MonthYearSelect } from "@/modules/hr/presentation/components/month-year-select";
import { PayrollTable } from "@/modules/hr/presentation/components/payroll-table";
import { payrollService, Payroll } from "@/modules/hr/infrastructure/payroll.service";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { authStore, useAuthStore } from "@/modules/auth/infrastructure/auth.store";
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

export default function GajiPage() {
    const { allowed } = usePermissionGuard("gaji.view");
    const canManage = useAuthStore((state) => authStore.hasPermission("gaji.manage"));
    const searchParams = useSearchParams();
    const { setItems } = useBreadcrumbStore();

    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [data, setData] = useState<Payroll[]>([]);
    const [meta, setMeta] = useState({
        current_page: 1,
        per_page: 15,
        total: 0,
        last_page: 1,
    });

    const now = new Date();
    const bulan = parseInt(searchParams.get("bulan") || String(now.getMonth() + 1));
    const tahun = parseInt(searchParams.get("tahun") || String(now.getFullYear()));
    const q = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1");

    useEffect(() => {
        setItems([
            { label: "Dashboard", href: "/dashboard" },
            { label: "Payroll" },
        ]);
    }, [setItems]);

    async function loadData() {
        if (!allowed) return;
        setLoading(true);
        try {
            const result = await payrollService.getPayrolls({
                bulan,
                tahun,
                q,
                page,
            });
            setData(result.data);
            setMeta(result.meta);
        } catch (error) {
            toast.error("Gagal memuat data payroll");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, [allowed, bulan, tahun, q, page]);

    async function handleSync() {
        setGenerating(true);
        try {
            await payrollService.generatePayroll(bulan, tahun);
            toast.success("Sinkronisasi payroll berhasil!");
            loadData();
        } catch (error: any) {
            toast.error(error?.message || "Gagal melakukan sinkronisasi");
        } finally {
            setGenerating(false);
        }
    }

    if (!allowed) return null;

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Payroll"
                description={`Data pengupahan karyawan periode ${bulan}/${tahun}`}
                actions={
                    canManage && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button disabled={generating || loading}>
                                    <RefreshCw className={`mr-2 h-4 w-4 ${generating ? "animate-spin" : ""}`} />
                                    {generating ? "Memproses..." : "Sinkronisasi / Generate"}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Generate Ulang Payroll?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Apakah Anda yakin ingin men-generate ulang data payroll untuk periode <b>{bulan}/{tahun}</b>? 
                                        <br/><br/>
                                        Data draft yang belum dibayar akan diperbarui berdasarkan data absensi terbaru. Data yang sudah dibayar tidak akan berubah.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleSync} className="bg-indigo-600 hover:bg-indigo-700">
                                        Ya, Sinkronkan Data
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )
                }
            />

            <Card>
                <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-end">
                    <MonthYearSelect defaultMonth={bulan} defaultYear={tahun} className="w-full md:w-auto" />
                </CardContent>
            </Card>

            <PayrollTable 
                data={data} 
                meta={meta} 
                params={{ q, bulan, tahun }} 
                loading={loading}
            />
        </div>
    );
}
