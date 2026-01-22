
"use client";

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
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { Absensi } from "../../domain/entities";
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
import { useState } from "react";

interface AbsensiTableProps {
  items: Absensi[];
  loading: boolean;
  onEdit: (item: Absensi) => void;
  onDelete: (item: Absensi) => void;
  canUpdate: boolean;
  canDelete: boolean;
}

export function AbsensiTable({
  items,
  loading,
  onEdit,
  onDelete,
  canUpdate,
  canDelete,
}: AbsensiTableProps) {
  const [deleteData, setDeleteData] = useState<Absensi | null>(null);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Memuat data...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Tidak ada data absensi ditemukan.
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
                <TableHead>Status</TableHead>
                <TableHead>Jam Masuk</TableHead>
                <TableHead>Jam Pulang</TableHead>
                <TableHead>Durasi (Menit)</TableHead>
                <TableHead>Sumber</TableHead>
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
                    <div className="font-medium">{item.karyawan?.user?.name || item.karyawan?.kode_karyawan || "-"}</div>
                    <div className="text-xs text-muted-foreground">{item.karyawan?.kode_karyawan}</div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item.status_kehadiran} />
                  </TableCell>
                  <TableCell>{item.jam_masuk || "-"}</TableCell>
                  <TableCell>{item.jam_pulang || "-"}</TableCell>
                  <TableCell>{item.durasi_menit ?? "-"}</TableCell>
                  <TableCell className="capitalize">{item.sumber_absen || "-"}</TableCell>
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
            <AlertDialogTitle>Apakah anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Data absensi tanggal <b>{deleteData?.tanggal}</b> untuk{" "}
              <b>{deleteData?.karyawan?.user?.name || "Karyawan"}</b> akan dihapus permanen.
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
    hadir: "bg-green-100 text-green-700 hover:bg-green-200",
    izin: "bg-blue-100 text-blue-700 hover:bg-blue-200",
    cuti: "bg-purple-100 text-purple-700 hover:bg-purple-200",
    sakit: "bg-orange-100 text-orange-700 hover:bg-orange-200",
    alpha: "bg-red-100 text-red-700 hover:bg-red-200",
  };
  return (
    <Badge className={styles[status] || "bg-gray-100 text-gray-700"} variant="secondary">
      {status.toUpperCase()}
    </Badge>
  );
}
