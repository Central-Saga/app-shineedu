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
      <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/30">
        <div className="size-12 bg-white rounded-2xl flex items-center justify-center text-slate-300 shadow-sm mb-4">
           <Users className="size-6" />
        </div>
        <h3 className="text-slate-800 font-bold uppercase tracking-widest text-[10px]">Belum Ada Anggota</h3>
        <p className="text-slate-400 text-xs mt-1">Silakan tambahkan siswa ke kelas ini.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm bg-white">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-slate-50/50">
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-6">Siswa / Peserta</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Enrollment</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tgl Masuk</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</TableHead>
            <TableHead className="w-[80px] text-right pr-6"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {enrollments.map((enr) => {
              const pivot = enr.pivot;
              const status = pivot?.status_anggota || 'Aktif';
              return (
                <TableRow key={enr.id} className="group hover:bg-slate-50/50 transition-colors">
                    <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="size-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                <User className="size-4" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-slate-700 text-sm tracking-tight">{enr.murid?.nama_lengkap}</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{enr.murid?.no_hp || '-'}</span>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>
                        <Link 
                            href={`/dashboard/enrollment/${enr.id}`}
                            className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-rose-600 hover:text-rose-700 transition-colors bg-rose-50 px-2 py-1 rounded-md"
                        >
                            #{enr.kode_enrollment || enr.id}
                            <ArrowUpRight className="size-3" />
                        </Link>
                    </TableCell>
                    <TableCell>
                        <span className="text-xs font-semibold text-slate-500">
                             {pivot?.tanggal_masuk || '-'}
                        </span>
                    </TableCell>
                    <TableCell>
                        <Badge variant="outline" className={status === 'Aktif' ? "border-emerald-200 bg-emerald-50 text-emerald-600 h-5 px-2 text-[10px] font-bold uppercase rounded-lg" : "border-rose-100 bg-rose-50 text-rose-600 h-5 px-2 text-[10px] font-bold uppercase rounded-lg"}>
                            {status}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
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
