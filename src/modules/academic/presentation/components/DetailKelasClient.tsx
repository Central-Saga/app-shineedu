
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { academicApi } from "@/modules/academic/infrastructure/api";
import { Kelas, KelasEnrollment } from "@/modules/academic/domain/types"; // Import member type
import { AnggotaTable } from "./AnggotaTable";
import { AddAnggotaSheet } from "./AddAnggotaSheet";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import Link from "next/link";

interface DetailKelasClientProps {
    kelas: Kelas;
}

export function DetailKelasClient({ kelas }: DetailKelasClientProps) {
    const router = useRouter();
    // Use local state for immediate updates, or just refresh router
    const [enrollments, setEnrollments] = useState<KelasEnrollment[]>(kelas.enrollments || []);

    const handleRemoveMember = async (enrollmentId: number) => {
        try {
            await academicApi.removeKelasMember(kelas.id, enrollmentId);
            toast.success("Anggota berhasil dikeluarkan");
            // Optimistic update
            setEnrollments(prev => prev.filter(e => e.id !== enrollmentId));
            router.refresh();
        } catch (e: any) {
            toast.error(e.message || "Gagal menghapus anggota");
        }
    };

    const handleSuccessAdd = () => {
        // Since we don't have the new member data without refetch, easiest is hard refresh
        router.refresh(); 
        // Or fetch details again. 
        // Ideally we fetch list.
        // For now relying on router refresh to reload RSC.
    };

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                     <CardTitle>Daftar Anggota</CardTitle>
                     <CardDescription>Siswa yang terdaftar di kelas ini</CardDescription>
                </div>
                 <div className="flex gap-2">
                     <Button variant="outline" size="sm" asChild>
                         <Link href={`/dashboard/kelas/${kelas.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit Kelas
                         </Link>
                     </Button>
                    <AddAnggotaSheet 
                        kelasId={kelas.id}
                        programId={kelas.program_id}
                        jenjangId={kelas.jenjang_id}
                        onSuccess={handleSuccessAdd}
                    />
                 </div>
            </CardHeader>
            <CardContent>
                <AnggotaTable 
                    enrollments={enrollments} 
                    onRemove={handleRemoveMember} 
                />
            </CardContent>
        </Card>
    );
}
