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
import { ConfirmDeleteDialog } from "@/shared/presentation/components/ConfirmDeleteDialog";
import { MoreHorizontal, Pencil, Trash, Check, X, FileText, Ban } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { Cuti } from "../../domain/entities";
import { useAuthStore } from "@/modules/auth/infrastructure/auth.store";

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
  onCancel?: (item: Cuti) => void;
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
  onCancel,
}: CutiTableProps) {
  const [deleteData, setDeleteData] = useState<Cuti | null>(null);
  const [cancelData, setCancelData] = useState<Cuti | null>(null);
  const { user } = useAuthStore();
  const currentUserId = user?.id;

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
              {items.map((item) => {
                const isOwner = currentUserId && item.karyawan?.user?.id === currentUserId;
                const showCancel = onCancel && (isOwner || canApprove) && (item.status === 'diajukan' || item.status === 'disetujui');

                return (
                <TableRow key={item.id}>
                  <TableCell className="py-4">
                    <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-slate-700">
                           {item.start_date ? format(new Date(item.start_date), "dd MMMM yyyy", { locale: idLocale }) : (item.tanggal ? format(new Date(item.tanggal), "dd MMMM yyyy", { locale: idLocale }) : "-")}
                        </span>
                        {item.end_date && format(new Date(item.end_date), "yyyy-MM-dd") !== format(new Date(item.start_date || item.tanggal || ""), "yyyy-MM-dd") && (
                           <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter flex items-center gap-1">
                              s/d {format(new Date(item.end_date), "dd MMMM yyyy", { locale: idLocale })}
                           </span>
                        )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-900">{item.karyawan?.user?.name || item.karyawan?.kode_karyawan}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{item.karyawan?.kode_karyawan}</div>
                  </TableCell>
                  <TableCell className="capitalize">{item.jenis}</TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} />
                  </TableCell>
                  <TableCell>
                    {item.approver?.name || (item as any).approver_name || (item.status === 'diajukan' ? "-" : (item.disetujui_oleh ? `User #${item.disetujui_oleh}` : "-"))}
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
                        {(item.bukti_url || (item as any).bukti_pendukung_url) && (
                          <DropdownMenuItem onClick={() => window.open(item.bukti_url || (item as any).bukti_pendukung_url, "_blank")}>
                            <FileText className="mr-2 h-4 w-4" /> Lihat Bukti
                          </DropdownMenuItem>
                        )}
                        {canUpdate && (
                          <DropdownMenuItem onClick={() => onEdit(item)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                        )}
                        {showCancel && (
                           <DropdownMenuItem onClick={() => setCancelData(item)} className="text-orange-600 focus:text-orange-700">
                             <Ban className="mr-2 h-4 w-4" /> Batalkan
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
                        {canDelete && item.status === 'diajukan' && (
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
              );})}
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
        title="Hapus Pengajuan Cuti?"
        description={`Apakah Anda yakin ingin menghapus data pengajuan cuti ${deleteData?.karyawan?.user?.name || "Karyawan"} untuk tanggal ${deleteData?.tanggal || deleteData?.start_date || ""}?`}
      />

      <AlertDialog open={!!cancelData} onOpenChange={(open) => !open && setCancelData(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan Pengajuan?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin membatalkan pengajuan cuti ini? Status akan berubah menjadi <b>Dibatalkan</b>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Kembali</AlertDialogCancel>
            <AlertDialogAction
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={() => {
                if (cancelData && onCancel) onCancel(cancelData);
                setCancelData(null);
              }}
            >
              Ya, Batalkan
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
