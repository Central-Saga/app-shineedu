"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { academicApi } from "@/modules/academic/infrastructure/api";
import { Kelas, KelasEnrollment } from "@/modules/academic/domain/types";
import { AnggotaTable } from "./AnggotaTable";
import { AddAnggotaSheet } from "./AddAnggotaSheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DetailKelasClientProps {
    kelas: Kelas;
}

export function DetailKelasClient({ kelas }: DetailKelasClientProps) {
    const router = useRouter();
    const [enrollments, setEnrollments] = useState<KelasEnrollment[]>(kelas.enrollments || []);

    useEffect(() => {
        setEnrollments(kelas.enrollments || []);
    }, [kelas.enrollments]);


    const refreshData = async () => {
        try {
            const res = await academicApi.getKelasDetail(kelas.id);
            if (res.success && res.data) {
                setEnrollments(res.data.enrollments || []);
            }
        } catch (e) {
            console.error("Gagal refresh data:", e);
        }
    };

    const handleRemoveMember = async (enrollmentId: number) => {
        try {
            await academicApi.removeKelasMember(kelas.id, enrollmentId);
            toast.success("Anggota berhasil dikeluarkan");
            await refreshData();
            router.refresh();
        } catch (e: any) {
            toast.error(e.message || "Gagal menghapus anggota");
        }
    };

    const handleSuccessAdd = () => {
        refreshData();
        router.refresh(); 
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b py-4">
                <div>
                     <CardTitle className="text-lg font-bold">Daftar Anggota</CardTitle>
                     <p className="text-sm text-muted-foreground mt-0.5">Siswa aktif yang terdaftar di kelas</p>
                </div>
                 <div className="flex gap-2">
                    <AddAnggotaSheet 
                        kelasId={kelas.id}
                        programId={kelas.program_id}
                        jenjangId={kelas.jenjang_id}
                        onSuccess={handleSuccessAdd}
                    />
                 </div>
            </CardHeader>
            <CardContent className="pt-6">
                <AnggotaTable 
                    enrollments={enrollments} 
                    onRemove={handleRemoveMember} 
                />
            </CardContent>
        </Card>
    );
}
