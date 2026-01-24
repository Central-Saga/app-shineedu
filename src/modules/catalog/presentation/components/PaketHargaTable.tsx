"use client";

import type { PaketHarga } from "../../domain/entities";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Trash2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PaketHargaTableProps {
  data: PaketHarga[];
  loading?: boolean;
  onEdit: (item: PaketHarga) => void;
  onDelete: (item: PaketHarga) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function PaketHargaTable({
  data,
  loading = false,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: PaketHargaTableProps) {
  const colCount = 8;
  
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "∞";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "∞";
      return format(date, "dd/MM/yyyy");
    } catch (e) {
      return "∞";
    }
  };

  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-[1000px]">
        <TableHeader>
          <TableRow>
            <TableHead>Program</TableHead>
            <TableHead>Jenjang</TableHead>
            <TableHead>Paket</TableHead>
            <TableHead>Jumlah Siswa</TableHead>
            <TableHead>Harga</TableHead>
            <TableHead>Efektif</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
              </TableRow>
            ))
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colCount} className="h-24 text-center text-muted-foreground">
                Tidak ada data.
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.program?.nama || "-"}</TableCell>
                <TableCell>{item.jenjang?.nama || "-"}</TableCell>
                <TableCell>{item.paket?.nama || "-"}</TableCell>
                <TableCell>
                    {item.min_siswa} - {item.max_siswa} Siswa
                </TableCell>
                <TableCell className="font-semibold text-slate-800">
                    {formatCurrency(item.harga)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                    <div className="flex flex-col">
                        <span>Mulai: {formatDate(item.effective_from)}</span>
                        <span>Sampai: {formatDate(item.effective_to)}</span>
                    </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      item.status === "Aktif"
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border-rose-200 bg-rose-50 text-rose-700"
                    }
                  >
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {canEdit && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(item)}
                            className="text-slate-500 hover:text-amber-600 hover:bg-amber-50"
                          >
                            <Pencil className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit</TooltipContent>
                      </Tooltip>
                    )}
                    {canDelete && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(item)}
                            className="text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Hapus</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
