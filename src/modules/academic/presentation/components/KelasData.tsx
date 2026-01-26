"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Kelas } from "@/modules/academic/domain/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, MoreHorizontal, Pencil, Trash, Eye, Users } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";

interface KelasTableColumnsProps {
  onDelete: (id: number) => void;
  onStatusChange: (item: Kelas, newStatus: string) => void;
}

export const getColumns = ({ onDelete, onStatusChange }: KelasTableColumnsProps): ColumnDef<Kelas>[] => [
  {
    accessorKey: "kode_kelas",
    header: "Kode",
    cell: ({ row }) => <span className="font-medium mono text-xs">{row.getValue("kode_kelas")}</span>,
  },
  {
    accessorKey: "nama_kelas",
    header: "Nama Kelas",
    cell: ({ row }) => (
        <div className="flex flex-col">
            <span className="font-semibold text-sm">{row.getValue("nama_kelas")}</span>
            <span className="text-xs text-muted-foreground">{row.original.program?.nama || "-"} • {row.original.jenjang?.nama || "-"}</span>
        </div>
    ),
  },
  {
    accessorKey: "tipe_kelas",
    header: "Tipe",
    cell: ({ row }) => {
        const tipe = row.getValue("tipe_kelas") as string;
        const mode = row.original.mode_private;
        return (
            <div className="flex flex-col gap-1">
                <Badge variant="secondary" className="w-fit font-medium">
                    {tipe}
                </Badge>
                {tipe === 'PRIVATE' && mode && (
                    <span className="text-[10px] text-muted-foreground ml-1">{mode}</span>
                )}
            </div>
        )
    }
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      let className = "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80"; // default
      
      switch(status) {
          case 'Aktif': 
            className = "border-transparent bg-emerald-100 text-emerald-700 hover:bg-emerald-100/80";
            break;
          case 'Selesai': 
            className = "border-transparent bg-blue-100 text-blue-700 hover:bg-blue-100/80";
            break;
          case 'Non Aktif': 
            className = "border-transparent bg-destructive/10 text-destructive hover:bg-destructive/20";
            break;
      }

      return <Badge variant="outline" className={`${className} border-0 font-medium`}>{status}</Badge>;
    },
  },
  {
    accessorKey: "enrollments_count",
    header: "Anggota",
    cell: ({ row }) => {
        const count = row.original.enrollments_count || 0;
        const kap = row.original.kapasitas;
        
        return (
            <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{count} Siswa</span>
                {kap && <span className="text-muted-foreground text-xs">/ {kap}</span>}
            </div>
        ) 
    }
  },
  {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => {
      const item = row.original;
      
      return (
        <div className="flex items-center gap-1">
          <Switch
            checked={item.status === "Aktif"}
            onCheckedChange={(checked) => 
                onStatusChange(item, checked ? "Aktif" : "Non Aktif")
            }
            className="scale-75 shrink-0 mr-1"
          />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 h-8 w-8"
              >
                <Link href={`/dashboard/kelas/${item.id}`}>
                    <Eye className="size-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Detail</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="text-slate-500 hover:text-amber-600 hover:bg-amber-50 h-8 w-8"
              >
                <Link href={`/dashboard/kelas/${item.id}/edit`}>
                    <Pencil className="size-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(item.id)}
                className="text-slate-500 hover:text-rose-600 hover:bg-rose-50 h-8 w-8"
              >
                <Trash className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Hapus</TooltipContent>
          </Tooltip>
        </div>
      );
    },
  },
];
