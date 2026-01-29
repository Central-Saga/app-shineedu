"use client";

import { KasTransaksi } from "@/lib/api/kas";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpCircle, ArrowDownCircle, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { authStore } from "@/modules/auth/infrastructure/auth.store";

const formatCurrency = (val: number | string | null | undefined) => {
  if (val === null || val === undefined) return "Rp 0";
  const num = typeof val === "string" ? parseFloat(val) : val;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num);
};

const formatDate = (s: string | null | undefined) => {
  if (!s) return "-";
  try {
    const d = new Date(s);
    return Number.isNaN(d.getTime())
      ? String(s)
      : d.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
  } catch {
    return String(s);
  }
};

interface KasTransaksiTableProps {
  data: KasTransaksi[];
  loading?: boolean;
}

export function KasTransaksiTable({ data, loading = false }: KasTransaksiTableProps) {
  const handlePrint = async (id: number) => {
    try {
      // Get auth token from authStore (same as httpClient)
      const token = authStore.getState().token;
      
      if (!token) {
        alert('Session expired. Please login again.');
        return;
      }
      
      // Fetch with auth header
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/kas/transaksi/${id}/print-thermal`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'text/html',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Print error response:', errorText);
        throw new Error(`Failed to load receipt: ${response.status}`);
      }

      // Get HTML content
      const html = await response.text();
      
      // Open in new window with the HTML content
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
      }
    } catch (error) {
      console.error('Print error:', error);
      alert('Gagal membuka kwitansi. Silakan coba lagi.');
    }
  };

  const colCount = 9;

  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-[1000px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Tanggal</TableHead>
            <TableHead className="w-[80px]">Tipe</TableHead>
            <TableHead className="text-right w-[140px]">Jumlah</TableHead>
            <TableHead className="w-[100px]">Metode</TableHead>
            <TableHead className="w-[120px]">Kategori</TableHead>
            <TableHead>Pihak</TableHead>
            <TableHead>Keterangan</TableHead>
            <TableHead className="w-[120px]">Referensi</TableHead>
            <TableHead className="w-[80px]">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16" /></TableCell>
              </TableRow>
            ))
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colCount} className="h-24 text-center text-muted-foreground">
                Tidak ada data transaksi
              </TableCell>
            </TableRow>
          ) : (
            data.map((trx) => (
              <TableRow key={trx.id}>
                <TableCell className="font-medium text-sm">
                  {formatDate(trx.tanggal)}
                </TableCell>
                <TableCell>
                  {trx.type === "IN" ? (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
                      <ArrowUpCircle className="size-3" />
                      IN
                    </Badge>
                  ) : (
                    <Badge className="bg-red-50 text-red-700 border-red-200 gap-1">
                      <ArrowDownCircle className="size-3" />
                      OUT
                    </Badge>
                  )}
                </TableCell>
                <TableCell
                  className={`text-right font-mono font-semibold ${
                    trx.type === "IN" ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {trx.type === "IN" ? "+" : "-"}
                  {formatCurrency(trx.amount)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {trx.metode}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {trx.kategori}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{trx.pihak || "-"}</TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                  {trx.keterangan || "-"}
                </TableCell>
                <TableCell className="text-xs font-mono text-muted-foreground">
                  {trx.external_ref || "-"}
                </TableCell>
                <TableCell>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePrint(trx.id)}
                        className="text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                      >
                        <Printer className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Print Kwitansi</TooltipContent>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
