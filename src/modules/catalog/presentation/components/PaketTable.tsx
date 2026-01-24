"use client";

import type { Paket } from "../../domain/entities";
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
import { Pencil, Trash2, Check, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PaketTableProps {
  data: Paket[];
  loading?: boolean;
  onEdit: (item: Paket) => void;
  onDelete: (item: Paket) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function PaketTable({
  data,
  loading = false,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: PaketTableProps) {
  const colCount = 8;

  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-[1000px]">
        <TableHeader>
          <TableRow>
            <TableHead>Kode</TableHead>
            <TableHead>Nama</TableHead>
            <TableHead>Tipe</TableHead>
            <TableHead>Pertemuan/Bulan</TableHead>
            <TableHead>Durasi (Menit)</TableHead>
            <TableHead>Fitur</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16" /></TableCell>
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
                <TableCell className="font-medium">{item.kode}</TableCell>
                <TableCell>{item.nama}</TableCell>
                <TableCell>
                    <Badge variant="secondary" className="capitalize">{item.tipe}</Badge>
                </TableCell>
                <TableCell>{item.pertemuan_per_bulan ?? "-"}</TableCell>
                <TableCell>{item.durasi_menit}</TableCell>
                <TableCell>
                    <div className="flex flex-col text-xs gap-1">
                        <div className="flex items-center gap-1">
                            {item.boleh_mix_mapel ? <Check className="size-3 text-emerald-600"/> : <X className="size-3 text-rose-500"/>}
                            <span>Mix Mapel {item.boleh_mix_mapel ? `(Max ${item.max_mapel})` : ""}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            {item.bisa_tambah_pertemuan ? <Check className="size-3 text-emerald-600"/> : <X className="size-3 text-rose-500"/>}
                            <span>Add-on Sesi</span>
                        </div>
                        <div className="flex items-center gap-1">
                            {item.bisa_ganti_hari ? <Check className="size-3 text-emerald-600"/> : <X className="size-3 text-rose-500"/>}
                            <span>Ganti Hari</span>
                        </div>
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
