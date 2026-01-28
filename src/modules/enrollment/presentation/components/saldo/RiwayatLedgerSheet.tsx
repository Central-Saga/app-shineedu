"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";

import { saldoPertemuanApi, LedgerItem } from "@/lib/api/saldo-pertemuan";

interface RiwayatLedgerSheetProps {
  paketMuridId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RiwayatLedgerSheet({ paketMuridId, open, onOpenChange }: RiwayatLedgerSheetProps) {
  const [data, setData] = useState<LedgerItem[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (open && paketMuridId) {
      setPage(1); // Reset to page 1 when opening new packet
      fetchLedger(paketMuridId, 1);
    }
  }, [open, paketMuridId]);

  const fetchLedger = async (id: number, p: number) => {
    setLoading(true);
    try {
      const res = await saldoPertemuanApi.getLedger(id, p);
      setData(res.data || []);
      setMeta(res.meta);
    } catch (error: any) {
      console.error(error);
      // Requirement: "Jika endpoint ledger 404, tampilkan message 'Ledger belum tersedia'"
      // Assuming 404 might come as error status or empty data
      if (error?.status === 404) {
          setData([]); // Empty state handles the message
      } else {
          toast.error("Gagal memuat riwayat ledger");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (!paketMuridId) return;
    setPage(newPage);
    fetchLedger(paketMuridId, newPage);
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'TOPUP': return <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Topup</Badge>;
      case 'USE': return <Badge variant="secondary">Terpakai</Badge>;
      case 'ADJUST': return <Badge variant="outline" className="border-orange-500 text-orange-600">Adjust</Badge>;
      case 'EXPIRE': return <Badge variant="destructive">Hangus</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  const formatReason = (reason: string) => {
    if (!reason) return "-";
    return reason.length > 50 ? `${reason.substring(0, 50)}...` : reason;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col h-full">
        <SheetHeader>
          <SheetTitle>Riwayat Saldo Pertemuan</SheetTitle>
          <SheetDescription>
            Detail penggunaan dan penambahan saldo paket ini.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-auto mt-6">
          {loading ? (
             <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
             </div>
          ) : data.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Tanggal</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-xs">
                        {format(new Date(item.tanggal), "dd MMM yyyy")}
                        <div className="text-[10px] text-muted-foreground">
                            {format(new Date(item.created_at), "HH:mm")}
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(item.type)}</TableCell>
                      <TableCell className={cn(
                          "text-right font-bold",
                          item.qty > 0 ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {item.qty > 0 ? `+${item.qty}` : item.qty}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatReason(item.reason)}
                        {item.created_by && (
                            <div className="text-[10px] italic">by {item.created_by}</div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/20">
              Ledger belum tersedia atau kosong.
            </div>
          )}
        </div>

        {meta && meta.last_page > 1 && (
          <div className="mt-4 border-t pt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => handlePageChange(page - 1)}
                    className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {/* Simplified logic for brevity, ideally construct logic for showing relevant pages */}
                <PaginationItem>
                    <span className="text-sm font-medium px-4">
                        Hal {meta.current_page} dari {meta.last_page}
                    </span>
                </PaginationItem>

                <PaginationItem>
                  <PaginationNext 
                    onClick={() => handlePageChange(page + 1)}
                    className={page >= meta.last_page ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// Utility for conditional classes
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
