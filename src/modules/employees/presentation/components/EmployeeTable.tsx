"use client";

import type { Employee } from "../../domain/entities";
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
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Trash2 } from "lucide-react";

function formatDate(s: string | null | undefined): string {
  if (!s) return "-";
  try {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? String(s) : d.toLocaleDateString("id-ID");
  } catch {
    return String(s);
  }
}

interface EmployeeTableProps {
  employees: Employee[];
  loading?: boolean;
  onEdit: (e: Employee) => void;
  onDelete: (e: Employee) => void;
  onStatusChange?: (e: Employee, newStatus: "aktif" | "nonaktif") => void;
  canUpdate: boolean;
  canDelete: boolean;
}

export function EmployeeTable({
  employees,
  loading = false,
  onEdit,
  onDelete,
  onStatusChange,
  canUpdate,
  canDelete,
}: EmployeeTableProps) {
  const hasActions = canUpdate || canDelete;
  const colCount = hasActions ? 7 : 6;

  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-[800px]">
        <TableHeader>
          <TableRow>
            <TableHead>Kode</TableHead>
            <TableHead>Nama / Email</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Tipe Gaji</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Dibuat</TableHead>
            {hasActions && (
              <TableHead className="w-[120px]">Aksi</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-6 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-40" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-28" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-24" />
                </TableCell>
                {hasActions && (
                  <TableCell>
                    <Skeleton className="h-6 w-24" />
                  </TableCell>
                )}
              </TableRow>
            ))
          ) : employees.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={colCount}
                className="h-24 text-center text-muted-foreground"
              >
                Tidak ada data.
              </TableCell>
            </TableRow>
          ) : (
            employees.map((em) => (
              <TableRow key={em.id}>
                <TableCell className="font-medium">
                  {em.kode_karyawan}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{em.user?.name ?? "-"}</span>
                    {em.user?.email && (
                      <span className="text-muted-foreground text-xs">
                        {em.user.email}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>{em.kategori_karyawan ?? "-"}</TableCell>
                <TableCell>{em.tipe_gaji ?? "-"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        em.status === "aktif"
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : "border-rose-200 bg-rose-50 text-rose-700"
                      }
                    >
                      {em.status}
                    </Badge>
                    {canUpdate && onStatusChange && (
                      <Switch
                        checked={em.status === "aktif"}
                        onCheckedChange={(c) =>
                          onStatusChange(em, c ? "aktif" : "nonaktif")
                        }
                        className="scale-75 shrink-0"
                      />
                    )}
                  </div>
                </TableCell>
                <TableCell>{formatDate(em.created_at)}</TableCell>
                {hasActions && (
                  <TableCell>
                    <div className="flex gap-1">
                      {canUpdate && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEdit(em)}
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
                              onClick={() => onDelete(em)}
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Hapus</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
