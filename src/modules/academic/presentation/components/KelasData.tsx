
"use client";

import { ColumnDef, Row } from "@tanstack/react-table";
import { Kelas } from "@/modules/academic/domain/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, MoreHorizontal, Pencil, Trash, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

interface KelasTableColumnsProps {
  onDelete: (id: number) => void;
}

export const getColumns = ({ onDelete }: KelasTableColumnsProps): ColumnDef<Kelas>[] => [
  {
    accessorKey: "kode_kelas",
    header: "Kode",
    cell: ({ row }) => <span className="font-medium mono text-xs">{row.getValue("kode_kelas")}</span>,
  },
  {
    accessorKey: "nama_kelas",
    header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Nama Kelas
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
    },
    cell: ({ row }) => <div className="font-semibold">{row.getValue("nama_kelas")}</div>,
  },
  {
    id: "context",
    header: "Program / Jenjang",
    cell: ({ row }) => (
      <div className="flex flex-col text-xs">
        <span className="font-medium">{row.original.program?.nama || "-"}</span>
        <span className="text-muted-foreground">{row.original.jenjang?.nama || "-"}</span>
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
            <div className="flex flex-col space-y-1">
                <Badge variant="outline" className="w-fit">{tipe}</Badge>
                {tipe === 'PRIVATE' && mode && (
                    <span className="text-[10px] text-muted-foreground">{mode}</span>
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
      let className = "border-slate-300 bg-slate-50 text-slate-700"; // default/draft
      
      switch(status) {
          case 'Aktif': 
            className = "border-emerald-300 bg-emerald-50 text-emerald-700";
            break;
          case 'Selesai': 
            className = "border-blue-300 bg-blue-50 text-blue-700";
            break;
          case 'Non Aktif': 
            className = "border-rose-200 bg-rose-50 text-rose-700";
            break;
      }

      return <Badge variant="outline" className={className}>{status}</Badge>;
    },
  },
  {
    accessorKey: "enrollments_count",
    header: "Anggota",
    cell: ({ row }) => {
        const count = row.original.enrollments_count || 0;
        const kap = row.original.kapasitas;
        
        return (
            <div className="flex items-center gap-1">
                <span className="font-mono">{count}</span>
                {kap && <span className="text-muted-foreground text-xs">/ {kap}</span>}
            </div>
        ) 
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const kelas = row.original;
      
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/kelas/${kelas.id}`}>
                <Eye className="mr-2 h-4 w-4" /> Detail
              </Link>
            </DropdownMenuItem>
             <DropdownMenuItem asChild>
              <Link href={`/dashboard/kelas/${kelas.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
               className="text-destructive focus:text-destructive"
               onClick={() => onDelete(kelas.id)}
            >
              <Trash className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
