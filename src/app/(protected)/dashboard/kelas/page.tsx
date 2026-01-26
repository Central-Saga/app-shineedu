"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { academicApi } from "@/modules/academic/infrastructure/api";
import { KelasListClient } from "@/modules/academic/presentation/components/KelasListClient";
import { toast } from "sonner";
import type { Kelas } from "@/modules/academic/domain/types";
import { DataTablePaginationMeta } from "@/shared/presentation/components/table/DataTablePagination";
import { Loader2 } from "lucide-react";

const DEFAULT_META: DataTablePaginationMeta = {
    current_page: 1,
    last_page: 1,
    total: 0,
    from: 0,
    to: 0,
    per_page: 15
};

export default function KelasPage() {
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<Kelas[]>([]);
    const [meta, setMeta] = useState<DataTablePaginationMeta>(DEFAULT_META);
    const [programs, setPrograms] = useState<any[]>([]);
    const [jenjangs, setJenjangs] = useState<any[]>([]);
    const [stats, setStats] = useState({ total: 0, active: 0, finished: 0 });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const page = Number(searchParams.get("page")) || 1;
            const per_page = Number(searchParams.get("per_page")) || 15;
            const q = searchParams.get("q") || "";
            const status = searchParams.get("status") || undefined;
            const program_id = searchParams.get("program_id") || undefined;
            const jenjang_id = searchParams.get("jenjang_id") || undefined;
            const tipe_kelas = searchParams.get("tipe_kelas") || undefined;

            const [kelasRes, programsRes, jenjangsRes, statsTotal, statsActive, statsFinished] = await Promise.all([
                academicApi.getKelasList({ page, per_page, q, status, program_id, jenjang_id, tipe_kelas }),
                academicApi.getPrograms(),
                academicApi.getJenjangs(),
                academicApi.getKelasList({ per_page: 1 }),
                academicApi.getKelasList({ per_page: 1, status: 'Aktif' }),
                academicApi.getKelasList({ per_page: 1, status: 'Selesai' })
            ]);

            setData(kelasRes.data || []);
            setMeta(kelasRes.meta || DEFAULT_META);
            setPrograms(programsRes.data || []);
            setJenjangs(jenjangsRes.data || []);
            setStats({
                total: statsTotal.meta?.total || 0,
                active: statsActive.meta?.total || 0,
                finished: statsFinished.meta?.total || 0
            });
        } catch (e: any) {
            toast.error(e.message || "Gagal memuat data kelas");
        } finally {
            setLoading(false);
        }
    }, [searchParams]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <KelasListClient
            data={data}
            meta={meta}
            stats={stats}
            programs={programs}
            jenjangs={jenjangs}
            loading={loading}
        />
    );
}
