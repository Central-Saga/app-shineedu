"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { KelasFormWrapper } from "@/modules/academic/presentation/components/KelasFormWrapper";
import { listJenjang, listProgram } from "@/modules/catalog/infrastructure/catalog.repository";
import { Program } from "@/modules/catalog/domain/entities";

export default function CreateKelasPage() {
    const [loading, setLoading] = useState(true);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [jenjangs, setJenjangs] = useState<{ id: number; nama: string }[]>([]);

    useEffect(() => {
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
    }, []);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Buat Kelas Baru"
                description="Tambahkan kelas baru ke dalam sistem"
                backUrl="/dashboard/kelas"
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
