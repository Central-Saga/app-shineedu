
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { KelasForm } from "./KelasForm";
import { academicApi } from "@/modules/academic/infrastructure/api";
import { CreateKelasValues } from "@/modules/academic/domain/schemas";
import { Program } from "@/modules/catalog/domain/entities";

interface Option {
    id: number;
    nama: string;
}

interface KelasFormWrapperProps {
    initialData?: any;
    programs: Program[];
    jenjangs: Option[];
    isEdit?: boolean;
    kelasId?: number;
}
export function KelasFormWrapper({ initialData, programs, jenjangs, isEdit, kelasId }: KelasFormWrapperProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = async (values: CreateKelasValues) => {
        setIsLoading(true);
        try {
            if (isEdit && kelasId) {
                await academicApi.updateKelas(kelasId, values);
                toast.success("Kelas berhasil diperbarui");
            } else {
                await academicApi.createKelas(values);
                toast.success("Kelas berhasil dibuat");
            }
            router.push("/dashboard/kelas");
            router.refresh();
        } catch (e: any) {
            toast.error(e.message || "Gagal menyimpan kelas");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KelasForm
            initialData={initialData}
            programs={programs}
            jenjangs={jenjangs}
            onSubmit={onSubmit}
            isLoading={isLoading}
            isEdit={!!isEdit}
        />
    );
}
