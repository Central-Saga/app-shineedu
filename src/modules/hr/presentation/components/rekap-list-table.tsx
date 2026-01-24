"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, DollarSign, Loader2, UserCheck } from "lucide-react";
import Link from "next/link";
import { RekapBulananItem } from "@/modules/hr/infrastructure/rekap.service";
import { Skeleton } from "@/components/ui/skeleton";

interface RekapListTableProps {
  data: RekapBulananItem[];
  meta: any;
  params: any;
  loading?: boolean;
}

export function RekapListTable({ data, meta, params, loading = false }: RekapListTableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-[900px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Karyawan</TableHead>
            <TableHead>Ringkasan Kehadiran</TableHead>
            <TableHead>Sesi Mengajar</TableHead>
            <TableHead className="text-right w-[150px]">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
             Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                </TableRow>
             ))
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center h-48 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                    <UserCheck className="size-10 text-slate-200" />
                    <p className="font-medium">Tidak ada data rekap untuk periode ini.</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => {
              const totalIzin = (item.absensi.izin || 0) + (item.cuti.izin_disetujui || 0);
              const totalSakit = (item.absensi.sakit || 0) + (item.cuti.sakit_disetujui || 0);
              const totalCuti = (item.cuti.cuti_disetujui || 0);

              return (
                <TableRow key={item.employee.id} className="hover:bg-slate-50/50 transition-colors border-slate-100">
                    <TableCell className="py-4">
                    <div className="flex flex-col gap-1">
                        <span className="font-bold text-slate-800">{item.employee.nama}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-muted-foreground">{item.employee.kode_karyawan}</span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-slate-200 text-slate-600 bg-slate-50/50">
                                {item.employee.kategori_karyawan}
                            </Badge>
                        </div>
                    </div>
                    </TableCell>
                    <TableCell>
                    <div className="flex gap-6 py-1">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-tight">Hadir</span>
                            <span className="font-bold text-emerald-600 text-base">{item.absensi.hadir} <span className="text-[10px] font-normal text-slate-400">Hari</span></span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                             <span className="text-[10px] uppercase font-bold text-slate-400 tracking-tight">Izin/Cuti</span>
                             <span className="font-bold text-amber-600 text-base">{totalIzin + totalCuti}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                             <span className="text-[10px] uppercase font-bold text-slate-400 tracking-tight">Sakit</span>
                             <span className="font-bold text-rose-600 text-base">{totalSakit}</span>
                        </div>
                    </div>
                    </TableCell>
                    <TableCell>
                    <div className="flex gap-6 py-1">
                        <div className="flex flex-col gap-0.5">
                             <span className="text-[10px] uppercase font-bold text-slate-400 tracking-tight">Terlaksana</span>
                             <span className="font-bold text-indigo-600 text-base">{item.jadwal.sesi_terlaksana}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                             <span className="text-[10px] uppercase font-bold text-slate-400 tracking-tight">Mengganti</span>
                             <span className="font-bold text-blue-600 text-base">{item.jadwal.sesi_menggantikan}</span>
                        </div>
                    </div>
                    </TableCell>
                    <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full" title="Lihat Detail Rekap">
                        <Link href={`/rekap-bulanan/${item.employee.id}?bulan=${params.bulan}&tahun=${params.tahun}`}>
                            <Eye className="size-4" />
                        </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild className="h-8 px-3 rounded-full hover:border-emerald-600 hover:text-emerald-600" title="Preview Gaji">
                        <Link href={`/gaji/preview/${item.employee.id}?bulan=${params.bulan}&tahun=${params.tahun}`}>
                            <DollarSign className="size-3.5 mr-1" /> Gaji
                        </Link>
                        </Button>
                    </div>
                    </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
