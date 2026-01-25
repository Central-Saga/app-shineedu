import { Suspense } from "react";
import { Loader2 } from "lucide-react";

import { academicApi } from "@/modules/academic/infrastructure/api";
import { KelasListClient } from "@/modules/academic/presentation/components/KelasListClient";
import { DataTablePaginationMeta } from "@/shared/presentation/components/table/DataTablePagination";

const DEFAULT_META: DataTablePaginationMeta = {
    current_page: 1,
    last_page: 1,
    total: 0,
    from: 0,
    to: 0,
    per_page: 15
};

interface KelasPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function KelasPage({ searchParams }: KelasPageProps) {
    // Parse params
    const page = Number(searchParams.page) || 1;
    const per_page = Number(searchParams.per_page) || 15;
    const q = typeof searchParams.q === 'string' ? searchParams.q : "";
    const status = typeof searchParams.status === 'string' ? searchParams.status : undefined;
    const program_id = typeof searchParams.program_id === 'string' && searchParams.program_id !== 'all' ? searchParams.program_id : undefined;
    const jenjang_id = typeof searchParams.jenjang_id === 'string' && searchParams.jenjang_id !== 'all' ? searchParams.jenjang_id : undefined;
    const tipe_kelas = typeof searchParams.tipe_kelas === 'string' && searchParams.tipe_kelas !== 'all' ? searchParams.tipe_kelas : undefined;

    // Fetch data concurrently
    const [
        kelasRes,
        programsRes,
        jenjangsRes,
        statsTotal,
        statsActive,
        statsFinished
    ] = await Promise.all([
        academicApi.getKelasList({ page, per_page, q, status, program_id, jenjang_id, tipe_kelas }).catch(() => ({ data: [], meta: DEFAULT_META })),
        academicApi.getPrograms().catch(() => ({ data: [] })),
        academicApi.getJenjangs().catch(() => ({ data: [] })),
        academicApi.getKelasList({ per_page: 1 }).catch(() => ({ meta: { total: 0 } })),
        academicApi.getKelasList({ per_page: 1, status: 'Aktif' }).catch(() => ({ meta: { total: 0 } })),
        academicApi.getKelasList({ per_page: 1, status: 'Selesai' }).catch(() => ({ meta: { total: 0 } }))
    ]);

    const kelasData = kelasRes.data || [];
    const meta = kelasRes.meta || DEFAULT_META;
    const programs = programsRes.data || [];
    const jenjangs = jenjangsRes.data || [];

    const stats = {
        total: statsTotal.meta?.total || 0,
        active: statsActive.meta?.total || 0,
        finished: statsFinished.meta?.total || 0
    };

    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>}>
            <KelasListClient 
                data={kelasData}
                meta={meta}
                stats={stats}
                programs={programs}
                jenjangs={jenjangs}
            />
        </Suspense>
    );
}
