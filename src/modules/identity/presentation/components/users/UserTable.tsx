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
import { Pencil } from "lucide-react";

interface UserTableProps {
  users: IdentityUser[];
  loading?: boolean;
  onEdit: (user: IdentityUser) => void;
  onStatusChange?: (user: IdentityUser, newStatus: "Aktif" | "Non Aktif") => void;
  canUpdate: boolean;
}

export function UserTable({
  users,
  loading = false,
  onEdit,
  onStatusChange,
  canUpdate,
}: UserTableProps) {
  const role = (u: IdentityUser) => u.roles?.[0]?.name ?? "-";
  const hasActions = canUpdate;
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
                  <Badge
                    variant="outline"
                    className={
                      u.status === "Aktif"
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border-rose-200 bg-rose-50 text-rose-700"
                    }
                  >
                    {u.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={(() => {
                      const r = role(u).toLowerCase();
                      if (r.includes("superadmin")) return "border-indigo-300 bg-indigo-50 text-indigo-700";
                      if (r.includes("admin")) return "border-blue-300 bg-blue-50 text-blue-700";
                      if (r.includes("teacher")) return "border-amber-300 bg-amber-50 text-amber-800";
                      if (r.includes("student")) return "border-teal-300 bg-teal-50 text-teal-800";
                      return "border-slate-300 bg-slate-50 text-slate-700";
                    })()}
                  >
                    {role(u)}
                  </Badge>
                </TableCell>
                {hasActions && (
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {canUpdate && onStatusChange && (
                        <Switch
                          checked={u.status === "Aktif"}
                          onCheckedChange={(c) =>
                            onStatusChange(u, c ? "Aktif" : "Non Aktif")
                          }
                          className="scale-75 shrink-0 mr-2"
                        />
                      )}
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
