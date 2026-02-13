"use client";

import { useState } from "react";
import Image from "next/image";
import type { Program } from "../../domain/entities";
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
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash2, ImageIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProgramTableProps {
  data: Program[];
  loading?: boolean;
  onEdit: (item: Program) => void;
  onDelete: (item: Program) => void;
  onHighlightChange?: (item: Program, value: boolean) => Promise<void>;
  canEdit: boolean;
  canDelete: boolean;
}

export function ProgramTable({
  data,
  loading = false,
  onEdit,
  onDelete,
  onHighlightChange,
  canEdit,
  canDelete,
}: ProgramTableProps) {
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const colCount = onHighlightChange ? 8 : 7;

  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-[800px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[72px]">Gambar</TableHead>
            <TableHead>Kode</TableHead>
            <TableHead>Nama</TableHead>
            <TableHead>Jenjang</TableHead>
            <TableHead>Status</TableHead>
            {onHighlightChange && (
              <TableHead className="text-center w-[100px]">Landing</TableHead>
            )}
            <TableHead>Terakhir Update</TableHead>
            <TableHead className="w-[100px]">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-10 w-14" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                {onHighlightChange && <TableCell><Skeleton className="h-6 w-12" /></TableCell>}
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
                <TableCell>
                  {item.image ? (
                    <div className="relative w-12 h-10 rounded overflow-hidden bg-muted shrink-0">
                      <Image
                        src={item.image}
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized={item.image.startsWith("http")}
                        sizes="48px"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{item.kode}</TableCell>
                <TableCell>
                    <div className="flex flex-col">
                        <span className="font-medium">{item.nama}</span>
                        {item.deskripsi && <span className="text-xs text-muted-foreground truncate max-w-[200px]">{item.deskripsi}</span>}
                    </div>
                </TableCell>
                <TableCell>
                    <div className="flex flex-wrap gap-1">
                        {item.jenjangs?.map(j => (
                            <Badge key={j.id} variant="secondary" className="text-xs">
                                {j.kode}
                            </Badge>
                        ))}
                        {(!item.jenjangs || item.jenjangs.length === 0) && "-"}
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
                {onHighlightChange && (
                  <TableCell className="text-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex justify-center">
                          <Switch
                            checked={!!item.is_highlight}
                            disabled={togglingId === item.id}
                            onCheckedChange={async (checked) => {
                              setTogglingId(item.id);
                              try {
                                await onHighlightChange(item, checked);
                              } finally {
                                setTogglingId(null);
                              }
                            }}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {item.is_highlight ? "Tampil di landing home" : "Tidak tampil di landing"}
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                )}
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
