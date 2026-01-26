
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { DataTablePagination, DataTablePaginationMeta } from "@/shared/presentation/components/table/DataTablePagination";
import { useCallback } from "react";

interface KelasPaginationProps {
    meta: DataTablePaginationMeta;
}

export function KelasPagination({ meta }: KelasPaginationProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const onPageChange = useCallback((page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", String(page));
        router.push(`?${params.toString()}`);
    }, [router, searchParams]);

    return <DataTablePagination meta={meta} onPageChange={onPageChange} />;
}
