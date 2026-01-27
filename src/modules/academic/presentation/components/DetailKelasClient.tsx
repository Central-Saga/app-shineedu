"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { academicApi } from "@/modules/academic/infrastructure/api";
import { Kelas, KelasEnrollment } from "@/modules/academic/domain/types";
import { AnggotaTable } from "./AnggotaTable";
import { AddAnggotaSheet } from "./AddAnggotaSheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authStore } from "@/modules/auth/infrastructure/auth.store";
import { SesiList } from "@/features/sesi/components/SesiList";
import { SesiLogbookSummaryList } from "@/features/sesi/components/SesiLogbookSummaryList";
import { JadwalKelasTab } from "./JadwalKelasTab";

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

    const canViewSesi = authStore.hasPermission("session.view");

    return (
        <Tabs defaultValue="anggota" className="w-full">
            <TabsList className="mb-4">
                <TabsTrigger value="anggota">Daftar Anggota</TabsTrigger>
                <TabsTrigger value="jadwal">Jadwal</TabsTrigger>
                {canViewSesi && <TabsTrigger value="sesi">Sesi Pertemuan</TabsTrigger>}
                {canViewSesi && <TabsTrigger value="logbook">Logbook Summary</TabsTrigger>}
            </TabsList>

            <TabsContent value="anggota">
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
                                periodeMulai={kelas.periode_mulai}
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
            </TabsContent>

            <TabsContent value="jadwal">
                <JadwalKelasTab kelasId={kelas.id} kelas={kelas} />
            </TabsContent>
            
            {canViewSesi && (
                <TabsContent value="sesi">
                    <SesiList kelasId={kelas.id} />
                </TabsContent>
            )}

            {canViewSesi && (
                <TabsContent value="logbook">
                    <SesiLogbookSummaryList kelasId={kelas.id} />
                </TabsContent>
            )}
        </Tabs>
    );
}
