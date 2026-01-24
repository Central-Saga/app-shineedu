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
import { authStore } from "@/modules/auth/infrastructure/auth.store";

export default function GajiPage() {
    const { allowed } = usePermissionGuard("gaji.view");
    const canManage = authStore.hasPermission("gaji.manage");
    const searchParams = useSearchParams();
    const { setItems } = useBreadcrumbStore();
    const router = useRouter();

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
            { label: "Gaji Bulanan" },
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
            toast.error("Gagal memuat data gaji");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, [allowed, bulan, tahun, q, page]);

    async function handleSync() {
        if (!confirm("Generate ulang data gaji untuk periode ini? Data draft yang belum dibayar akan diperbarui.")) return;
        
        setGenerating(true);
        try {
            await payrollService.generatePayroll(bulan, tahun);
            toast.success("Sinkronisasi gaji berhasil!");
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
                title="Gaji Bulanan"
                description={`Data penggajian periode ${bulan}/${tahun}`}
                actions={
                    canManage && (
                        <Button onClick={handleSync} disabled={generating || loading}>
                            <RefreshCw className={`mr-2 h-4 w-4 ${generating ? "animate-spin" : ""}`} />
                            {generating ? "Memproses..." : "Sinkronisasi / Generate"}
                        </Button>
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
