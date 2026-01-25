"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { KelasFormWrapper } from "@/modules/academic/presentation/components/KelasFormWrapper";
import { listJenjang, listProgram } from "@/modules/catalog/infrastructure/catalog.repository";
import { Program } from "@/modules/catalog/domain/entities";

import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";

export default function CreateKelasPage() {
    const { setItems } = useBreadcrumbStore();
    const [loading, setLoading] = useState(true);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [jenjangs, setJenjangs] = useState<{ id: number; nama: string }[]>([]);

    useEffect(() => {
        setItems([
            { label: "Dashboard", href: "/dashboard" },
            { label: "Kelas", href: "/dashboard/kelas" },
            { label: "Buat Kelas" },
        ]);

        const fetchData = async () => {
            try {
                const [progRes, jenjRes] = await Promise.all([
                    listProgram({ per_page: 100 }),
                    listJenjang({ per_page: 100 })
                ]);
                setPrograms(progRes.items);
                setJenjangs(jenjRes.items.map(j => ({ id: j.id, nama: j.nama })));
            } catch (e) {
                toast.error("Gagal memuat data katalog");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [setItems]);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Buat Kelas Baru"
                description="Tambahkan kelas akademik baru ke dalam sistem"
            />
            
            <div className="mt-6">
                <KelasFormWrapper 
                    programs={programs}
                    jenjangs={jenjangs}
                />
            </div>
        </div>
    );
}
