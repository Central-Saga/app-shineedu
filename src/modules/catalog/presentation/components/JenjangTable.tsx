"use client";

import type { Jenjang } from "../../domain/entities";
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

interface JenjangTableProps {
  data: Jenjang[];
  loading?: boolean;
  onEdit: (item: Jenjang) => void;
  onDelete: (item: Jenjang) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function JenjangTable({
  data,
  loading = false,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: JenjangTableProps) {
  const colCount = 5;

  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-[600px]">
        <TableHeader>
          <TableRow>
            <TableHead>Kode</TableHead>
            <TableHead>Nama</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Terakhir Update</TableHead>
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
                  {new Date(item.updated_at).toLocaleDateString("id-ID")}
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
