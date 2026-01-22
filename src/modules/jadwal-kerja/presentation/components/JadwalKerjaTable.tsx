"use client";

import type { JadwalKerja } from "../../domain/entities";
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
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Trash2 } from "lucide-react";

interface JadwalKerjaTableProps {
  items: JadwalKerja[];
  loading?: boolean;
  onEdit: (item: JadwalKerja) => void;
  onDelete: (item: JadwalKerja) => void;
  onStatusChange?: (item: JadwalKerja, newStatus: "aktif" | "nonaktif") => void;
  canUpdate: boolean;
  canDelete: boolean;
}

export function JadwalKerjaTable({
  items,
  loading = false,
  onEdit,
  onDelete,
  onStatusChange,
  canUpdate,
  canDelete,
}: JadwalKerjaTableProps) {
  const colCount = 8;

  const formatCurrency = (val: string | number) => {
    const n = typeof val === "string" ? parseFloat(val) : val;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(n);
  };

  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-[1000px]">
        <TableHeader>
          <TableRow>
            <TableHead>Kategori</TableHead>
            <TableHead>Mata Pelajaran</TableHead>
            <TableHead>Hari / Sesi</TableHead>
            <TableHead>Waktu</TableHead>
            <TableHead>Pengajar</TableHead>
            <TableHead>Tarif</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[120px]">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: colCount }).map((__, j) => (
                  <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>
                ))}
              </TableRow>
            ))
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={colCount}
                className="h-24 text-center text-muted-foreground"
              >
                Tidak ada data.
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Badge variant="secondary" className="capitalize">
                    {item.kategori.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{item.mata_pelajaran}</TableCell>
                <TableCell>
                  {item.hari} / Sesi {item.nomor_sesi}
                </TableCell>
                <TableCell>
                  {item.jam_mulai} - {item.jam_selesai}
                </TableCell>
                <TableCell>
                  {item.guru_pengajar?.user?.name ?? "-"}
                </TableCell>
                <TableCell>{formatCurrency(item.tarif)}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      item.status === "aktif"
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border-rose-200 bg-rose-50 text-rose-700"
                    }
                  >
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {canUpdate && onStatusChange && (
                      <Switch
                        checked={item.status === "aktif"}
                        onCheckedChange={(c: boolean) => 
                          onStatusChange(item, c ? "aktif" : "nonaktif")
                        }
                        className="scale-75 shrink-0 mr-1"
                      />
                    )}
                    
                    {canUpdate && (
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
