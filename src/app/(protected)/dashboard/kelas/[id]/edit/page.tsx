"use client";

import { useState, useEffect, use } from "react";
import { notFound } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { academicApi } from "@/modules/academic/infrastructure/api";
import { KelasFormWrapper } from "@/modules/academic/presentation/components/KelasFormWrapper";
import { Loader2 } from "lucide-react";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";

export default function EditKelasPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const id = Number(resolvedParams.id);
    const [loading, setLoading] = useState(true);
    const [initialData, setInitialData] = useState<any>(null);
    const [programs, setPrograms] = useState<any[]>([]);
    const [jenjangs, setJenjangs] = useState<any[]>([]);
    const { setItems } = useBreadcrumbStore();

    useEffect(() => {
        setItems([
            { label: "Dashboard", href: "/dashboard" },
            { label: "Kelas", href: "/dashboard/kelas" },
            { label: "Edit Kelas" },
        ]);
    }, [setItems]);

    useEffect(() => {
        if (isNaN(id)) return;

        const fetchData = async () => {
            try {
                const [kelasRes, programsRes, jenjangsRes] = await Promise.all([
                    academicApi.getKelasDetail(id),
                    academicApi.getPrograms(),
                    academicApi.getJenjangs()
                ]);

                if (!kelasRes.success || !kelasRes.data) {
                    toast.error(kelasRes.message || "Kelas tidak ditemukan");
                    return; 
                }

                setInitialData(kelasRes.data);
                setPrograms(programsRes.data || []);
                setJenjangs(jenjangsRes.data || []);
            } catch (error) {
                console.error(error);
                toast.error("Gagal memuat data kelas");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (isNaN(id)) return notFound();

    if (loading) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
            </div>
        );
    }

    if (!initialData) {
        return (
            <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-2">
                <h2 className="text-xl font-bold text-slate-800">Kelas Tidak Ditemukan</h2>
                <p className="text-slate-500">Data kelas mungkin sudah dihapus atau Anda tidak memiliki akses.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
             <PageHeader
                title="Edit Kelas"
                description={`Perbarui informasi dan konfigurasi kelas ${initialData.nama_kelas}`}
            />
            
            <div className="mt-6">
                <KelasFormWrapper 
                    initialData={initialData}
                    programs={programs}
                    jenjangs={jenjangs}
                    isEdit={true}
                    kelasId={id}
                />
            </div>
        </div>
    );
}
