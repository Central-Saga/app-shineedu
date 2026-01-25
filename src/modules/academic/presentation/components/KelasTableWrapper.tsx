
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DataTable } from "./DataTable";
import { getColumns } from "./KelasData";
import { academicApi } from "@/modules/academic/infrastructure/api";
import { Kelas } from "@/modules/academic/domain/types";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface KelasTableWrapperProps {
    data: Kelas[];
}

export function KelasTableWrapper({ data }: KelasTableWrapperProps) {
    const router = useRouter();
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await academicApi.deleteKelas(deleteId);
            toast.success("Kelas berhasil dihapus");
            router.refresh();
        } catch (e: any) {
            toast.error(e.message || "Gagal menghapus kelas");
        } finally {
            setDeleteId(null);
        }
    };

    const columns = getColumns({
        onDelete: (id) => setDeleteId(id),
    });

    return (
        <>
            <DataTable columns={columns} data={data} />
            
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Kelas?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini tidak dapat dibatalkan. Data kelas dan riwayatnya mungkin akan hilang atau diarsipkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
