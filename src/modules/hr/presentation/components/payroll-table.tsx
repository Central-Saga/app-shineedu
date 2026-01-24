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
import { Eye, UserCheck } from "lucide-react";
import Link from "next/link";
import { Payroll } from "@/modules/hr/infrastructure/payroll.service";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/shared/infrastructure/utils/format";

interface PayrollTableProps {
  data: Payroll[];
  meta: any;
  params: any;
  loading?: boolean;
}

export function PayrollTable({ data, loading = false }: PayrollTableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-[900px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Karyawan</TableHead>
            <TableHead>Gaji Pokok</TableHead>
            <TableHead>Fee Mengajar</TableHead>
            <TableHead>Potongan</TableHead>
            <TableHead>Gaji Bersih</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right w-[100px]">Aksi</TableHead>
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
                    <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                </TableRow>
             ))
          ) : (!Array.isArray(data) || data.length === 0) ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center h-48 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                    <UserCheck className="size-10 text-slate-200" />
                    <p className="font-medium">Belum ada data gaji untuk periode ini.</p>
                    <p className="text-xs">Klik "Sinkronisasi" untuk generate gaji.</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => {
              return (
                <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors border-slate-100">
                    <TableCell className="py-4">
                    <div className="flex flex-col gap-1">
                        <span className="font-bold text-slate-800">{item.employee.user?.name || (item.employee as any).nama}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-muted-foreground">{item.employee.kode_karyawan}</span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-slate-200 text-slate-600 bg-slate-50/50">
                                {item.employee.kategori_karyawan}
                            </Badge>
                        </div>
                    </div>
                    </TableCell>
                    <TableCell>
                        <span className="font-medium text-slate-600">{formatCurrency(Number(item.gaji_pokok))}</span>
                    </TableCell>
                    <TableCell>
                        <span className="font-medium text-indigo-600">{formatCurrency(Number(item.total_fee_mengajar))}</span>
                    </TableCell>
                    <TableCell>
                        <span className="font-medium text-rose-600">-{formatCurrency(Number(item.total_potongan))}</span>
                    </TableCell>
                    <TableCell>
                        <span className="font-bold text-emerald-700 text-lg">{formatCurrency(Number(item.gaji_bersih))}</span>
                    </TableCell>
                    <TableCell>
                        <PayrollStatusBadge status={item.status} />
                    </TableCell>
                    <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full" title="Lihat Detail">
                        <Link href={`/gaji/${item.id}`}>
                            <Eye className="size-4" />
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

function PayrollStatusBadge({ status }: { status: string }) {
    const styles: any = {
        draft: "bg-slate-100 text-slate-600 border-slate-200",
        generated: "bg-blue-50 text-blue-700 border-blue-200",
        approved: "bg-indigo-50 text-indigo-700 border-indigo-200",
        paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
        transferred: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };

    const label: any = {
        draft: "Draft",
        generated: "Generated",
        approved: "Disetujui",
        paid: "Lunas",
        transferred: "Ditransfer",
    };

    return (
        <Badge variant="outline" className={`${styles[status] || styles.draft} font-normal`}>
            {label[status] || status}
        </Badge>
    );
}
