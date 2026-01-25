
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
import { MoreHorizontal, Pencil, Trash, Eye } from "lucide-react";
import type { PengaturanCuti } from "../../domain/entities";
import { ConfirmDeleteDialog } from "@/shared/presentation/components/ConfirmDeleteDialog";

interface PengaturanCutiTableProps {
  items: PengaturanCuti[];
  loading: boolean;
  onEdit: (item: PengaturanCuti) => void;
  onDelete: (item: PengaturanCuti) => void;
  onView: (item: PengaturanCuti) => void;
  canUpdate: boolean;
  canDelete: boolean;
}

export function PengaturanCutiTable({
  items,
  loading,
  onEdit,
  onDelete,
  onView,
  canUpdate,
  canDelete,
}: PengaturanCutiTableProps) {
  const [deleteData, setDeleteData] = useState<PengaturanCuti | null>(null);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Memuat aturan...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Tidak ada aturan cuti ditemukan.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <div className="min-w-[1000px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kategori</TableHead>
                <TableHead>Subtipe</TableHead>
                <TableHead>Divisi</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead>Maks Pengajuan</TableHead>
                <TableHead>Min Hari</TableHead>
                <TableHead>Potongan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="capitalize">{item.kategori_karyawan}</TableCell>
                  <TableCell className="capitalize">
                    {item.subtipe_kontrak ? item.subtipe_kontrak.replace("_", " ") : "-"}
                  </TableCell>
                  <TableCell className="capitalize">
                    <Badge variant="outline">
                      {item.divisi === "all" ? "Semua" : item.divisi?.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{item.jenis}</TableCell>
                  <TableCell className="capitalize">{item.periode || "-"}</TableCell>
                  <TableCell>
                    {item.maksimal_pengajuan ? `${item.maksimal_pengajuan}x` : "Unlimited"}
                  </TableCell>
                  <TableCell>{item.minimal_hari_pengajuan} hari</TableCell>
                   <TableCell>
                    {item.potongan_tipe === "none" ? (
                      <Badge variant="outline">None</Badge>
                    ) : (
                      <div className="flex flex-col text-xs">
                         <span className="capitalize">{item.potongan_tipe.replace("_", " ")}</span>
                         <span className="font-semibold">
                            {item.potongan_tipe === "flat" 
                             ? `Rp ${Number(item.potongan_nilai).toLocaleString('id-ID')}`
                             : `${item.potongan_nilai}x Gaji`}
                         </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                     <Badge variant={item.aktif ? "secondary" : "destructive"}>
                        {item.aktif ? "Aktif" : "Nonaktif"}
                     </Badge>
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
                        <DropdownMenuItem onClick={() => onView(item)}>
                          <Eye className="mr-2 h-4 w-4" /> Detail
                        </DropdownMenuItem>
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

      <ConfirmDeleteDialog
        isOpen={!!deleteData}
        onOpenChange={(open) => !open && setDeleteData(null)}
        onConfirm={() => {
          if (deleteData) onDelete(deleteData);
          setDeleteData(null);
        }}
        title="Hapus Aturan Cuti?"
        description="Apakah Anda yakin ingin menghapus aturan cuti ini? Aturan ini akan dihapus permanen dan tidak berlaku lagi untuk perhitungan cuti."
      />
    </>
  );
}
