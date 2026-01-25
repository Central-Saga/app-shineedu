"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { academicApi } from "@/modules/academic/infrastructure/api";
import { Kelas, KelasEnrollment } from "@/modules/academic/domain/types";
import { AnggotaTable } from "./AnggotaTable";
import { AddAnggotaSheet } from "./AddAnggotaSheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import Link from "next/link";

interface DetailKelasClientProps {
    kelas: Kelas;
}

export function DetailKelasClient({ kelas }: DetailKelasClientProps) {
    const router = useRouter();
    const [enrollments, setEnrollments] = useState<KelasEnrollment[]>(kelas.enrollments || []);

    const handleRemoveMember = async (enrollmentId: number) => {
        try {
            await academicApi.removeKelasMember(kelas.id, enrollmentId);
            toast.success("Anggota berhasil dikeluarkan");
            setEnrollments(prev => prev.filter(e => e.id !== enrollmentId));
            router.refresh();
        } catch (e: any) {
            toast.error(e.message || "Gagal menghapus anggota");
        }
    };

    const handleSuccessAdd = () => {
        router.refresh(); 
    };

    return (
        <Card className="rounded-3xl border-none shadow-premium ring-1 ring-slate-100 overflow-hidden bg-white">
            <CardHeader className="flex flex-row items-center justify-between px-6 pt-6 pb-2">
                <div>
                     <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-widest">Daftar Anggota</CardTitle>
                     <p className="text-[10px] text-slate-400 font-bold mt-0.5">Siswa aktif yang terdaftar di kelas</p>
                </div>
                 <div className="flex gap-2">
                      <Button variant="outline" className="rounded-full h-9 px-4 text-[10px] font-bold uppercase tracking-wider border-none shadow-none ring-1 ring-slate-100 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all" asChild>
                          <Link href={`/dashboard/kelas/${kelas.id}/edit`}>
                             <Pencil className="mr-2 size-3" /> Edit Kelas
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
            <CardContent className="p-6 pt-4">
                <AnggotaTable 
                    enrollments={enrollments} 
                    onRemove={handleRemoveMember} 
                />
            </CardContent>
        </Card>
    );
}
