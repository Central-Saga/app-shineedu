"use client";

import { Enrollment } from "@/modules/enrollment/domain/entities";
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
import { Pencil, Eye, Trash } from "lucide-react";
import { useState } from "react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Switch } from "@/components/ui/switch";

interface EnrollmentTableProps {
  data: Enrollment[];
  loading?: boolean;
  onView: (item: Enrollment) => void;
  onEdit: (item: Enrollment) => void;
  onDelete: (id: number) => void;
  onStatusChange?: (id: number, status: string) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

export function EnrollmentTable({
  data,
  loading = false,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  canUpdate = true,
  canDelete = true,
}: EnrollmentTableProps) {
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  const colCount = 7;

  return (
    <>
      <div className="w-full overflow-x-auto">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Murid</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Jenjang / Paket</TableHead>
              <TableHead>Harga</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount} className="h-24 text-center text-muted-foreground">
                  Tidak ada data enrollment.
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.kode_enrollment || "-"}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900">{item.murid?.nama_lengkap}</span>
                      <span className="text-muted-foreground text-xs">{item.murid?.no_hp}</span>
                    </div>
                  </TableCell>
                  <TableCell>{item.program?.nama}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{item.jenjang?.nama}</span>
                      <span className="text-xs text-muted-foreground">{item.paket?.nama}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(item.harga_final))}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        item.status === "Aktif"
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : item.status === "Pause"
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-slate-200 bg-slate-50 text-slate-700"
                      }
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {canUpdate && onStatusChange && (
                        <Switch 
                            checked={item.status === "Aktif"}
                            onCheckedChange={(checked) => {
                                onStatusChange(item.id, checked ? "Aktif" : "Selesai");
                            }}
                            className="scale-75 shrink-0 mr-1"
                        />
                      )}
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onView(item)}
                            className="text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                          >
                            <Eye className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Detail</TooltipContent>
                      </Tooltip>

                      {canUpdate && (
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
                              onClick={() => setDeleteId(item.id)}
                              className="text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                            >
                              <Trash className="size-4" />
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

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Data enrollment akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
