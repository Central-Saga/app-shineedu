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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Pencil, UserCog, Trash2 } from "lucide-react";

interface UserTableProps {
  users: IdentityUser[];
  onEdit: (user: IdentityUser) => void;
  onChangeRole: (user: IdentityUser) => void;
  onDelete: (user: IdentityUser) => void;
  canUpdate: boolean;
  canDelete: boolean;
}

export function UserTable({
  users,
  onEdit,
  onChangeRole,
  onDelete,
  canUpdate,
  canDelete,
}: UserTableProps) {
  const role = (u: IdentityUser) => u.roles?.[0]?.name ?? "-";

  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-[900px]">
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Role</TableHead>
            {(canUpdate || canDelete) && (
              <TableHead className="w-[140px]">Aksi</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={canUpdate || canDelete ? 5 : 4}
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
                        ? "border-emerald-300 bg-emerald-100 text-emerald-800"
                        : "border-slate-200 bg-slate-100 text-slate-700"
                    }
                  >
                    {u.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="border-amber-300/80 bg-amber-50 text-amber-800"
                  >
                    {role(u)}
                  </Badge>
                </TableCell>
                {(canUpdate || canDelete) && (
                  <TableCell>
                    <div className="flex gap-1">
                      {canUpdate && (
                        <>
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
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onChangeRole(u)}
                              >
                                <UserCog className="size-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ubah Role</TooltipContent>
                          </Tooltip>
                        </>
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
