"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppBreadcrumbs } from "@/shared/presentation/components/AppBreadcrumbs";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { DataTablePagination } from "@/shared/presentation/components/table/DataTablePagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { authStore } from "@/modules/auth/infrastructure/auth.store";
import * as rolesUsecase from "@/modules/identity/application/usecases/roles.usecase";
import * as permissionsUsecase from "@/modules/identity/application/usecases/permissions.usecase";
import { ForbiddenError } from "@/shared/infrastructure/api/errors";
import type { Role } from "@/modules/identity/domain/entities";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

const PER_PAGE_OPTIONS = [15, 30, 50, 100];

export default function RolesPage() {
  const { allowed } = usePermissionGuard("roles.view");
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [roles, setRoles] = useState<Role[]>([]);
  const [meta, setMeta] = useState({
    current_page: 1,
    per_page: 15,
    total: 0,
    last_page: 1,
    from: null as number | null,
    to: null as number | null,
  });
  const [permissionsCount, setPermissionsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const canCreate = authStore.hasPermission("roles.create");
  const canUpdate = authStore.hasPermission("roles.update");

  async function load() {
    if (!allowed) return;
    setLoading(true);
    try {
      const [r, perms] = await Promise.all([
        rolesUsecase.getRolesUsecase({
          page,
          per_page: perPage,
          sort_by: "name",
          sort_dir: "asc",
        }),
        permissionsUsecase.getPermissionsUsecase(),
      ]);
      setRoles(r.items);
      setMeta(r.meta);
      setPermissionsCount(perms.length);
    } catch (e) {
      if (e instanceof ForbiddenError) {
        toast.error(e.message || "Tidak punya akses");
        router.replace("/dashboard");
        return;
      }
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!allowed) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load, page, perPage are deps
  }, [allowed, page, perPage]);

  if (!allowed) return null;

  return (
    <div>
      <AppBreadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Roles" },
        ]}
      />
      <PageHeader
        title="Roles"
        description="Kelola role dan permission"
        actions={
          canCreate ? (
            <Button asChild>
              <Link href="/roles/new">
                <Plus className="mr-2 size-4" />
                Tambah Role
              </Link>
            </Button>
          ) : undefined
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="rounded-xl">
          <CardContent className="pt-4">
            <p className="text-muted-foreground text-sm">Total Roles</p>
            <p className="text-2xl font-semibold">{meta.total}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="pt-4">
            <p className="text-muted-foreground text-sm">Module Permissions</p>
            <p className="text-2xl font-semibold">{permissionsCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center gap-2">
            <Label className="text-muted-foreground text-sm whitespace-nowrap">
              Per halaman
            </Label>
            <Select
              value={String(perPage)}
              onValueChange={(v) => {
                setPerPage(Number(v));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PER_PAGE_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Jumlah Permission</TableHead>
                  <TableHead className="w-[100px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-6 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-12" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : roles.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Tidak ada data.
                    </TableCell>
                  </TableRow>
                ) : (
                  roles.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>
                        {(r.permissions ?? []).length}
                      </TableCell>
                      <TableCell>
                        {canUpdate && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  router.push(`/roles/${r.id}/edit`)
                                }
                              >
                                <Pencil className="size-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit</TooltipContent>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <DataTablePagination meta={meta} onPageChange={setPage} />
        </CardContent>
      </Card>
    </div>
  );
}
