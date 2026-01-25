"use client";

import type { Murid } from "../../domain/entities";
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
import { Pencil, Eye } from "lucide-react";

function formatDate(s: string | null | undefined): string {
  if (!s) return "-";
  try {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? String(s) : d.toLocaleDateString("id-ID");
  } catch {
    return String(s);
  }
}

interface MuridTableProps {
  data: Murid[];
  loading?: boolean;
  onView: (e: Murid) => void;
  onEdit: (e: Murid) => void;
  onStatusChange?: (e: Murid, newStatus: "Aktif" | "Non Aktif") => void;
  canUpdate?: boolean;
}

export function MuridTable({
  data,
  loading = false,
  onView,
  onEdit,
  onStatusChange,
  canUpdate = true,
}: MuridTableProps) {
  const colCount = 8;

  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-[900px]">
        <TableHeader>
          <TableRow>
            <TableHead>Kode</TableHead>
            <TableHead>Nama / Jenjang</TableHead>
            <TableHead>No HP</TableHead>
            <TableHead>Sekolah Asal</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Dibuat</TableHead>
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
                <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16" /></TableCell>
              </TableRow>
            ))
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={colCount}
                className="h-24 text-center text-muted-foreground"
              >
                Tidak ada data.
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {item.kode_murid || "-"}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-900">{item.nama_lengkap}</span>
                    <span className="text-muted-foreground text-xs">
                       {item.jenjang?.nama ?? "-"} {item.kelas_sekolah ? `(${item.kelas_sekolah})` : ""}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{item.no_hp}</TableCell>
                <TableCell>
                  {item.sekolah_asal || "-"}
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
                <TableCell className="text-muted-foreground text-sm">
                  {formatDate(item.created_at)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {canUpdate && onStatusChange && (
                      <Switch
                        checked={item.status === "Aktif"}
                        onCheckedChange={(c: boolean) => 
                          onStatusChange(item, c ? "Aktif" : "Non Aktif")
                        }
                        className="scale-75 shrink-0 mr-1"
                      />
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onView(item)}
                          className="text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                        >
                          <Eye className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Detail</TooltipContent>
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
