"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { sesiApi } from "../api/sesi.api";
import { Sesi } from "../types";
import { getSesiColumns } from "./SesiTableColumns";
import { SesiListFilters } from "./SesiListFilters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { DataTable } from "@/components/ui/data-table"; // Check if this exists, or use manual table
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginatedMeta } from "@/shared/domain/types";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ExportDropdown } from "@/shared/presentation/components/ExportDropdown";
import { toast } from "sonner";

interface SesiListProps {
  kelasId: number;
}

export function SesiList({ kelasId }: SesiListProps) {
  const searchParams = useSearchParams();
  const [data, setData] = useState<Sesi[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta | null>(null);
  const [loading, setLoading] = useState(true);

  // Default filtering if not present
  const from = searchParams.get("from") || format(startOfMonth(new Date()), "yyyy-MM-dd");
  const to = searchParams.get("to") || format(endOfMonth(new Date()), "yyyy-MM-dd");
  const statusSesi = searchParams.get("status_sesi");
  const page = searchParams.get("page") || "1";

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await sesiApi.getSesiByKelas(kelasId, {
          from,
          to,
          status_sesi: statusSesi || undefined,
          page,
          per_page: 20
      });
      setData(res.data);
      setMeta(res.meta);
    } catch (error) {
      console.error("Failed to fetch sesi", error);
    } finally {
      setLoading(false);
    }
  }, [kelasId, from, to, statusSesi, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = async (format: string) => {
    try {
      const params: Record<string, unknown> = {
        from,
        to,
        status_sesi: statusSesi || undefined,
      };
      await sesiApi.exportSesi(kelasId, format, params);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Gagal melakukan export");
    }
  };

  const columns = getSesiColumns(kelasId);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between border-b py-4">
        <div className="flex items-center gap-2">
            <div className="text-left">
                <CardTitle className="text-lg font-bold">Daftar Sesi</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">Realisasi pertemuan dan absensi kelas ini</p>
            </div>
            <div className="ml-auto">
                <ExportDropdown onExport={handleExport} />
            </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-4">
        <SesiListFilters />

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                  <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                          <Skeleton className="h-full w-full" />
                      </TableCell>
                  </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    Tidak ada sesi ditemukan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {meta && (
          <div className="flex items-center justify-end space-x-2 py-4">
               <div className="space-x-2">
                  <Button
                      variant="outline"
                      size="sm"
                      disabled={(meta.current_page || 1) <= 1}
                      asChild
                  >
                       <a href={`?${new URLSearchParams({...Object.fromEntries(searchParams.entries()), page: String((meta.current_page || 1) - 1) }).toString()}`}>
                          Previous
                       </a>
                  </Button>
                  <Button
                      variant="outline"
                      size="sm"
                      disabled={(meta.current_page || 1) >= (meta.last_page || 1)}
                      asChild
                  >
                      <a href={`?${new URLSearchParams({...Object.fromEntries(searchParams.entries()), page: String((meta.current_page || 1) + 1) }).toString()}`}>
                          Next
                      </a>
                  </Button>
               </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
