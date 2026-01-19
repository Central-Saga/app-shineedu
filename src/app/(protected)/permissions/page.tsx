"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/modules/identity/presentation/components/shared/PageHeader";
import { getModulesFromPermissions } from "@/modules/identity/domain/permission-matrix";
import { getPermissionsUsecase } from "@/modules/identity/application/usecases/permissions.usecase";
import type { Permission } from "@/modules/identity/domain/entities";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPermissionsUsecase()
      .then(setPermissions)
      .catch(() => toast.error("Gagal memuat permissions"))
      .finally(() => setLoading(false));
  }, []);

  const byModule = getModulesFromPermissions(permissions).map((module) => ({
    module,
    items: permissions.filter((p) => p.name.startsWith(`${module}.`)),
  }));

  if (loading) {
    return <div className="p-4">Memuat…</div>;
  }

  return (
    <div>
      <PageHeader
        title="Permissions"
        description="Daftar permission (read-only)"
      />

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="pt-6">
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead>Permission</TableHead>
                  <TableHead>Guard</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byModule.flatMap(({ module, items }) =>
                  items.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{module}</TableCell>
                      <TableCell>{p.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.guard_name ?? "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {permissions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                      Tidak ada data.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
