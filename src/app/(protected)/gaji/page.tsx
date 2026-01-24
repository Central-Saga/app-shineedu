"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { MonthYearSelect } from "@/modules/hr/presentation/components/month-year-select";
import { RekapListTable } from "@/modules/hr/presentation/components/rekap-list-table";
import { rekapService, RekapBulananItem } from "@/modules/hr/infrastructure/rekap.service";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { Info } from "lucide-react";
import { toast } from "sonner";

export default function GajiPage() {
    const { allowed } = usePermissionGuard("gaji.view");
    const searchParams = useSearchParams();
    const { setItems } = useBreadcrumbStore();

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<RekapBulananItem[]>([]);
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

    useEffect(() => {
        if (!allowed) return;

        async function loadData() {
            setLoading(true);
            try {
                const result = await rekapService.getRekapList({
                    bulan,
                    tahun,
                    q,
                    page,
                });
                setData(result.data);
                setMeta(result.meta);
            } catch (error) {
                toast.error("Gagal memuat data karyawan");
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [allowed, bulan, tahun, q, page]);

    if (!allowed) return null;

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Gaji Bulanan"
                description={`Preview perhitungan gaji periode ${bulan}/${tahun}`}
            />

            <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl flex items-start gap-3 text-sm">
                <Info className="size-5 shrink-0 mt-0.5" />
                <div>
                   <p className="font-semibold text-blue-900 mb-1">Mode Preview Payroll</p>
                   <p>Sistem merangkum estimasi gaji berdasarkan realisasi jadwal yang sudah disetujui. Pilih karyawan di bawah untuk melihat rincian.</p>
                </div>
            </div>

            <Card>
                <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-end">
                    <MonthYearSelect defaultMonth={bulan} defaultYear={tahun} className="w-full md:w-auto" />
                </CardContent>
            </Card>

            <RekapListTable 
                data={data} 
                meta={meta} 
                params={{ q, bulan, tahun }} 
                loading={loading}
            />
        </div>
    );
}
