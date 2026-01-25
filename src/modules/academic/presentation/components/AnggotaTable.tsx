
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash } from "lucide-react";
import { KelasEnrollment } from "@/modules/academic/domain/types";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog";

interface AnggotaTableProps {
  enrollments: KelasEnrollment[]; // The structure returned by API with pivot
  onRemove: (enrollmentId: number) => void;
  // permission check can be passed here
}

export function AnggotaTable({ enrollments, onRemove }: AnggotaTableProps) {
  if (!enrollments.length) {
      return <div className="p-8 text-center text-muted-foreground border rounded-lg border-dashed">Belum ada anggota di kelas ini.</div>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Murid / Kode</TableHead>
            <TableHead>Paket</TableHead>
            <TableHead>Status Member</TableHead>
            <TableHead>Tgl Masuk</TableHead>
            <TableHead className="w-[100px]">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {enrollments.map((enr) => {
              const pivot = enr.pivot;
              const status = pivot?.status_anggota || 'Unknown';
              return (
                <TableRow key={enr.id}>
                    <TableCell>
                        <div className="flex flex-col">
                            <span className="font-medium">{enr.murid?.nama_lengkap}</span>
                            <span className="text-xs text-muted-foreground mono">No HP: {enr.murid?.no_hp || '-'}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                        <span className="text-xs text-muted-foreground">
                            {/* Assuming enrollment has program loaded for display or just ID */}
                            Enrollment #{enr.id} 
                        </span>
                    </TableCell>
                    <TableCell>
                        <Badge variant={status === 'Aktif' ? 'default' : 'secondary'}>{status}</Badge>
                    </TableCell>
                    <TableCell>
                        {pivot?.tanggal_masuk || '-'}
                    </TableCell>
                    <TableCell>
                        {status === 'Aktif' && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Keluarkan Anggota?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Apakah Anda yakin ingin mengeluarkan {enr.murid?.nama_lengkap} dari kelas ini?
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onRemove(enr.id)} className="bg-destructive hover:bg-destructive/90">
                                        Ya, Keluarkan
                                    </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </TableCell>
                </TableRow>
              )
          })}
        </TableBody>
      </Table>
    </div>
  );
}
