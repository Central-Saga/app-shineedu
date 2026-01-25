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
import { formatCurrency } from "@/lib/utils"; // Assuming helper exists, or I use Intl
import { usePermission } from "@/hooks/use-permission"; // Assuming hook exists

interface EnrollmentTableColumnsProps {
  onDelete: (id: number) => void;
}

export const getColumns = ({ onDelete }: EnrollmentTableColumnsProps): ColumnDef<Enrollment>[] => [
  {
    accessorKey: "kode_enrollment",
    header: "Kode",
    cell: ({ row }) => <span className="font-medium">{row.getValue("kode_enrollment") || "-"}</span>,
  },
  {
    accessorKey: "murid.nama_lengkap",
    header: "Murid",
    cell: ({ row }) => <div>{row.original.murid?.nama_lengkap}</div>,
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
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      // Adjust variant logic as needed
      let variant: "default" | "secondary" | "destructive" | "outline" = "default";
      if (status === "Aktif") variant = "default"; // or success color if available
      else if (status === "Pause") variant = "secondary";
      else if (status === "Selesai") variant = "outline";
      else if (status === "Cancel") variant = "destructive";

      return <Badge variant={variant}>{status}</Badge>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const enrollment = row.original;
      // const canUpdate = usePermission("enrollment.update");
      // const canDelete = usePermission("enrollment.delete");
      // For column definitions, passing hooks strictly might be tricky if not in component. 
      // Often columns are defined inside the component or accepted hooks as args if needed.
      // But typically actions are simple links or callbacks.
      
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
      );
    },
  },
];
