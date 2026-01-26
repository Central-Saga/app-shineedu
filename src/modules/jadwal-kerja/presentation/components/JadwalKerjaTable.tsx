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
import { Eye, Pencil, Trash2, User, Clock, MapPin } from "lucide-react";

interface JadwalKerjaTableProps {
  items: JadwalKerja[];
  loading?: boolean;
  onView: (item: JadwalKerja) => void;
  onEdit: (item: JadwalKerja) => void;
  onDelete: (item: JadwalKerja) => void;
  onStatusChange?: (item: JadwalKerja, newStatus: "Aktif" | "Non Aktif") => void;
  canUpdate: boolean;
  canDelete: boolean;
}

export function JadwalKerjaTable({
  items,
  loading = false,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  canUpdate,
  canDelete,
}: JadwalKerjaTableProps) {
  const colCount = 6;

  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-[1000px]">
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">Mata Pelajaran</TableHead>
            <TableHead>Hari / Sesi</TableHead>
            <TableHead>Waktu</TableHead>
            <TableHead>Pengajar</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[120px] text-right pr-6">Aksi</TableHead>
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
                <TableCell className="pl-6">
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">{item.mata_pelajaran}</span>
                    {item.ruangan_kelas && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="size-3" /> {item.ruangan_kelas}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{item.hari}</span>
                    <span className="text-[10px] text-muted-foreground">Sesi {item.nomor_sesi || "-"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-sm font-mono text-slate-600">
                    <Clock className="size-3.5 text-slate-400" />
                    <span>{item.jam_mulai}</span>
                    <span className="text-slate-300">-</span>
                    <span>{item.jam_selesai}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-slate-50 border flex items-center justify-center text-slate-400 shrink-0">
                        <User className="size-4" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm">{item.guru_pengajar?.user?.name || "-"}</span>
                        <span className="text-[10px] text-muted-foreground">{item.guru_pengajar?.kode_karyawan || 'No ID'}</span>
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
                <TableCell className="text-right pr-6">
                  <div className="flex items-center justify-end gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onView(item);
                          }}
                          className="text-slate-500 hover:text-rose-600 hover:bg-rose-50 relative z-10 cursor-pointer"
                        >
                          <Eye className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Lihat Detail</TooltipContent>
                    </Tooltip>

                    {canUpdate && onStatusChange && (
                      <Switch
                        checked={item.status === "Aktif"}
                        onCheckedChange={(c: boolean) => 
                          onStatusChange(item, c ? "Aktif" : "Non Aktif")
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
