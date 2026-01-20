"use client";

import type { IdentityUser } from "../../../domain/entities";
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

interface UserTableProps {
  users: IdentityUser[];
  loading?: boolean;
  onEdit: (user: IdentityUser) => void;
  onDelete: (user: IdentityUser) => void;
  onStatusChange?: (user: IdentityUser, newStatus: "Aktif" | "Non Aktif") => void;
  canUpdate: boolean;
  canDelete: boolean;
}

export function UserTable({
  users,
  loading = false,
  onEdit,
  onDelete,
  onStatusChange,
  canUpdate,
  canDelete,
}: UserTableProps) {
  const role = (u: IdentityUser) => u.roles?.[0]?.name ?? "-";
  const hasActions = canUpdate || canDelete;
  const colCount = hasActions ? 5 : 4;

  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-[900px]">
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Role</TableHead>
            {hasActions && (
              <TableHead className="w-[140px]">Aksi</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                {hasActions && <TableCell><Skeleton className="h-6 w-24" /></TableCell>}
              </TableRow>
            ))
          ) : users.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={colCount}
                className="h-24 text-center text-muted-foreground"
              >
                Tidak ada data.
              </TableCell>
            </TableRow>
          ) : (
            users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell className="max-w-[260px] truncate" title={u.email}>
                  {u.email}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        u.status === "Aktif"
                          ? "border-emerald-300 bg-emerald-100 text-emerald-800"
                          : "border-slate-200 bg-slate-100 text-slate-700"
                      }
                    >
                      {u.status}
                    </Badge>
                    {canUpdate && onStatusChange && (
                      <Switch
                        checked={u.status === "Aktif"}
                        onCheckedChange={(c) =>
                          onStatusChange(u, c ? "Aktif" : "Non Aktif")
                        }
                        className="scale-75 shrink-0"
                      />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="border-amber-300/80 bg-amber-50 text-amber-800"
                  >
                    {role(u)}
                  </Badge>
                </TableCell>
                {hasActions && (
                  <TableCell>
                    <div className="flex gap-1">
                      {canUpdate && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEdit(u)}
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
                              onClick={() => onDelete(u)}
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
