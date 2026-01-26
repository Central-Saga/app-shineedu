"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { sesiApi } from "../api/sesi.api";
import { Sesi } from "../types";
import { getSesiColumns } from "./SesiTableColumns";
import { SesiListFilters } from "./SesiListFilters";
import { GenerateSesiDialog } from "./GenerateSesiDialog";
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await sesiApi.getSesiByKelas(kelasId, {
            from,
            to,
            status_sesi: statusSesi,
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
    };
    fetchData();
  }, [kelasId, from, to, statusSesi, page]);

  const columns = getSesiColumns(kelasId);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
         <h3 className="text-lg font-medium">Daftar Sesi</h3>
         <GenerateSesiDialog kelasId={kelasId} />
      </div>

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
                    onClick={() => {
                        const params = new URLSearchParams(searchParams.toString());
                        params.set("page", String((meta.current_page || 1) - 1));
                        // router.push not available directly here? use Link or window or parent
                        // Better use Link for pagination or router from hook
                    }}
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
                    onClick={() => {
                        // same
                    }}
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
    </div>
  );
}
