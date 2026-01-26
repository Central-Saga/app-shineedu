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
import { Trash, Users, User, ArrowUpRight } from "lucide-react";
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
import Link from "next/link";

interface AnggotaTableProps {
  enrollments: KelasEnrollment[];
  onRemove: (enrollmentId: number) => void;
}

export function AnggotaTable({ enrollments, onRemove }: AnggotaTableProps) {
  if (!enrollments.length) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-lg bg-muted/20">
        <Users className="size-8 text-muted-foreground mb-3" />
        <h3 className="font-semibold">Belum Ada Anggota</h3>
        <p className="text-sm text-muted-foreground mt-1">Silakan tambahkan siswa ke kelas ini.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">Siswa / Peserta</TableHead>
            <TableHead>Enrollment</TableHead>
            <TableHead>Tgl Masuk</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px] text-right pr-6">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {enrollments.map((enr) => {
              const pivot = enr.pivot;
              const status = pivot?.status_anggota || 'Aktif';
              return (
                <TableRow key={enr.id}>
                    <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground shrink-0">
                                <User className="size-4" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-semibold text-sm">{enr.murid?.nama_lengkap}</span>
                                <span className="text-xs text-muted-foreground">{enr.murid?.no_hp || '-'}</span>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>
                        <Link 
                            href={`/dashboard/enrollment/${enr.id}`}
                            className="text-xs font-medium text-rose-600 hover:underline"
                        >
                            #{enr.kode_enrollment || enr.id}
                        </Link>
                    </TableCell>
                    <TableCell>
                        <span className="text-sm">
                             {pivot?.tanggal_masuk || '-'}
                        </span>
                    </TableCell>
                    <TableCell>
                        <Badge variant={status === 'Aktif' ? 'outline' : 'secondary'} className={status === 'Aktif' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : ""}>
                            {status}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                >
                                    <Trash className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Keluarkan Anggota?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Apakah Anda yakin ingin mengeluarkan <span className="font-semibold text-slate-900">{enr.murid?.nama_lengkap}</span> dari kelas ini?
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onRemove(enr.id)} className="bg-rose-600 hover:bg-rose-700">
                                    Ya, Keluarkan
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                </TableRow>
              )
          })}
        </TableBody>
      </Table>
    </div>
  );
}
