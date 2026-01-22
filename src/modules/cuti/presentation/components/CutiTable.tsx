
"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, Pencil, Trash, Check, X } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { Cuti } from "../../domain/entities";

interface CutiTableProps {
  items: Cuti[];
  loading: boolean;
  onEdit: (item: Cuti) => void;
  onDelete: (item: Cuti) => void;
  canUpdate: boolean;
  canDelete: boolean;
  canApprove?: boolean;
  onApprove?: (item: Cuti) => void;
  onReject?: (item: Cuti) => void;
}

export function CutiTable({
  items,
  loading,
  onEdit,
  onDelete,
  canUpdate,
  canDelete,
  canApprove,
  onApprove,
  onReject,
}: CutiTableProps) {
  const [deleteData, setDeleteData] = useState<Cuti | null>(null);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Memuat data...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Tidak ada data cuti ditemukan.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <div className="min-w-[800px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Karyawan</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Disetujui Oleh</TableHead>
                <TableHead>Catatan</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.tanggal
                      ? format(new Date(item.tanggal), "dd MMMM yyyy", { locale: idLocale })
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{item.karyawan?.user?.name || item.karyawan?.kode_karyawan}</div>
                    <div className="text-xs text-muted-foreground">{item.karyawan?.kode_karyawan}</div>
                  </TableCell>
                  <TableCell className="capitalize">{item.jenis}</TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} />
                  </TableCell>
                  <TableCell>
                    {item.approver?.name || item.disetujui_oleh || "-"}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={item.catatan || ""}>
                     {item.catatan || "-"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                        {canUpdate && (
                          <DropdownMenuItem onClick={() => onEdit(item)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                        )}
                        {canApprove && item.status === "diajukan" && (
                          <>
                            <DropdownMenuItem onClick={() => onApprove?.(item)}>
                              <Check className="mr-2 h-4 w-4 text-green-600" /> Setujui
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onReject?.(item)}>
                              <X className="mr-2 h-4 w-4 text-red-600" /> Tolak
                            </DropdownMenuItem>
                          </>
                        )}
                        {canDelete && (
                          <DropdownMenuItem
                            onClick={() => setDeleteData(item)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash className="mr-2 h-4 w-4" /> Hapus
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

       <AlertDialog open={!!deleteData} onOpenChange={(open) => !open && setDeleteData(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pengajuan Cuti?</AlertDialogTitle>
            <AlertDialogDescription>
              Data cuti tanggal <b>{deleteData?.tanggal}</b> akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (deleteData) onDelete(deleteData);
                setDeleteData(null);
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    diajukan: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
    disetujui: "bg-green-100 text-green-700 hover:bg-green-200",
    ditolak: "bg-red-100 text-red-700 hover:bg-red-200",
    dibatalkan: "bg-gray-100 text-gray-700 hover:bg-gray-200",
  };
  return (
    <Badge className={styles[status] || "bg-gray-100 text-gray-700"} variant="secondary">
      {status.toUpperCase()}
    </Badge>
  );
}
