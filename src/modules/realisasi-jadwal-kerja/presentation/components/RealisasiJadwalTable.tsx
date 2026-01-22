"use client";

import type { RealisasiJadwal } from "../../domain/entities";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Pencil, Trash2 } from "lucide-react";

function formatDate(s: string | null | undefined): string {
  if (!s) return "-";
  try {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? String(s) : d.toLocaleDateString("id-ID");
  } catch {
    return String(s);
  }
}

interface RealisasiJadwalTableProps {
  items: RealisasiJadwal[];
  loading?: boolean;
  onView: (item: RealisasiJadwal) => void;
  onEdit: (item: RealisasiJadwal) => void;
  onDelete: (item: RealisasiJadwal) => void;
  canUpdate: boolean;
  canDelete: boolean;
}

export function RealisasiJadwalTable({
  items,
  loading = false,
  onView,
  onEdit,
  onDelete,
  canUpdate,
  canDelete,
}: RealisasiJadwalTableProps) {
  const colCount = 7;

  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-[1000px]">
        <TableHeader>
          <TableRow>
            <TableHead>Tanggal</TableHead>
            <TableHead>Jadwal (Mata Pelajaran)</TableHead>
            <TableHead>Pengajar</TableHead>
            <TableHead>Pengganti</TableHead>
            <TableHead>Sumber</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Aksi</TableHead>
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
                <TableCell className="font-medium">{formatDate(item.tanggal)}</TableCell>
                <TableCell>
                  {item.jadwal_kerja?.mata_pelajaran ?? "-"}
                  <div className="text-xs text-muted-foreground">
                    {item.jadwal_kerja?.hari} | {item.jadwal_kerja?.jam_mulai}-{item.jadwal_kerja?.jam_selesai}
                  </div>
                </TableCell>
                <TableCell>
                  {item.guru_pengajar?.user?.name ?? item.jadwal_kerja?.guru_pengajar?.user?.name ?? "-"}
                </TableCell>
                <TableCell>
                  {item.guru_pengganti?.user?.name ?? "-"}
                </TableCell>
                <TableCell>{item.sumber ?? "-"}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      item.status === "disetujui"
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : item.status === "ditolak"
                        ? "border-rose-200 bg-rose-50 text-rose-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                    }
                  >
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onView(item)}
                          className="text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Eye className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Lihat Detail</TooltipContent>
                    </Tooltip>

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
