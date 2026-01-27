"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Enrollment } from "@/modules/enrollment/domain/entities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils"; 
import { Switch } from "@/components/ui/switch";

interface EnrollmentTableColumnsProps {
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: string) => void;
}

export const getColumns = ({ onDelete, onStatusChange }: EnrollmentTableColumnsProps): ColumnDef<Enrollment>[] => [
  {
    accessorKey: "kode_enrollment",
    header: "Kode",
    cell: ({ row }) => <span className="font-medium">{row.getValue("kode_enrollment") || "-"}</span>,
  },
  {
    accessorKey: "murid.nama_lengkap",
    header: "Murid",
    cell: ({ row }) => (
      <Link href={`/dashboard/enrollment/${row.original.id}`} className="hover:underline">
        {row.original.murid?.nama_lengkap}
      </Link>
    ),
  },
  {
    id: "produk",
    header: "Produk",
    cell: ({ row }) => (
      <div className="text-sm">
        <div className="font-medium">{row.original.program?.nama}</div>
        <div className="text-muted-foreground text-xs">
          {row.original.jenjang?.nama} - {row.original.paket?.nama}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "harga_final",
    header: "Harga",
    cell: ({ row }) => formatCurrency(Number(row.getValue("harga_final"))),
  },
  {
    accessorKey: "biaya_pendaftaran_amount",
    header: "Biaya Pendaftaran",
    cell: ({ row }) => {
      const amount = Number(row.original.biaya_pendaftaran_amount || 0);
      const status = row.original.biaya_pendaftaran_status;
      
      let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
      if (status === "PAID") variant = "default";
      if (status === "UNPAID") variant = "destructive";
      if (status === "WAIVED") variant = "secondary";

      return (
        <div className="flex items-center gap-2">
           <span className="text-sm">{amount > 0 ? formatCurrency(amount) : "-"}</span>
           <Badge variant={variant} className="text-[10px] px-1 h-5">{status}</Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      
      let variant: "default" | "secondary" | "destructive" | "outline" = "default";
      if (status === "Aktif") variant = "default"; 
      else if (status === "Pause") variant = "secondary";
      else if (status === "Selesai") variant = "outline";
      else if (status === "Cancel") variant = "destructive";

      return (
        <Badge variant={variant}>{status}</Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const enrollment = row.original;
      const isAktif = enrollment.status === "Aktif";
      
      return (
        <div className="flex items-center gap-1">
          <Switch 
            checked={isAktif} 
            onCheckedChange={(checked) => {
              onStatusChange(enrollment.id, checked ? "Aktif" : "Selesai");
            }}
            className="scale-75 shrink-0 mr-1"
          />
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
                <Link href={`/dashboard/enrollment/${enrollment.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(enrollment.id)}
              >
                <Trash className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
