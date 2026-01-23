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
import { Pencil, Eye } from "lucide-react";

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
  onView: (e: Employee) => void;
  onEdit: (e: Employee) => void;
  onStatusChange?: (e: Employee, newStatus: "aktif" | "nonaktif") => void;
  canUpdate: boolean;
}

export function EmployeeTable({
  employees,
  loading = false,
  onView,
  onEdit,
  onStatusChange,
  canUpdate,
}: EmployeeTableProps) {
  const colCount = 8;

  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-[900px]">
        <TableHeader>
          <TableRow>
            <TableHead>Kode</TableHead>
            <TableHead>Nama / Email</TableHead>
            <TableHead>Divisi</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Tipe Gaji</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Dibuat</TableHead>
            <TableHead className="w-[140px]">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                <TableCell><Skeleton className="h-6 w-32" /></TableCell>
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
                    <span className="font-medium text-slate-900">{em.user?.name ?? "-"}</span>
                    {em.user?.email && (
                      <span className="text-muted-foreground text-xs">
                        {em.user.email}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {em.divisi ? (
                    <Badge variant="outline" className="text-slate-600 border-slate-200">
                      {em.divisi}
                    </Badge>
                  ) : "-"}
                </TableCell>
                <TableCell>
                  {em.kategori_karyawan ? (
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-100 capitalize">
                      {em.kategori_karyawan}
                    </Badge>
                  ) : "-"}
                </TableCell>
                <TableCell>
                  {em.tipe_gaji ? (
                    <Badge variant="outline" className="text-slate-600 border-slate-200 capitalize">
                      {em.tipe_gaji.replace("_", " ")}
                    </Badge>
                  ) : "-"}
                </TableCell>
                <TableCell>
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
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDate(em.created_at)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {canUpdate && onStatusChange && (
                      <Switch
                        checked={em.status === "aktif"}
                        onCheckedChange={(c: boolean) => 
                          onStatusChange(em, c ? "aktif" : "nonaktif")
                        }
                        className="scale-75 shrink-0 mr-1"
                      />
                    )}
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onView(em)}
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
                            onClick={() => onEdit(em)}
                            className="text-slate-500 hover:text-amber-600 hover:bg-amber-50"
                          >
                            <Pencil className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit</TooltipContent>
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
  );
}
