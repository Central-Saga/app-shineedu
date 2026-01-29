"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { 
  CreditCard, 
  History, 
  MoreVertical, 
  Settings2
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { authStore } from "@/modules/auth/infrastructure/auth.store";
import { saldoPertemuanApi, PaketMurid } from "@/lib/api/saldo-pertemuan";
import { AdjustSaldoDialog } from "./saldo/AdjustSaldoDialog";
import { TopupPaketDialog } from "./payment/TopupPaketDialog";

interface SaldoPertemuanCardProps {
  enrollmentId: number;
}

export function SaldoPertemuanCard({ enrollmentId }: SaldoPertemuanCardProps) {
  const [data, setData] = useState<PaketMurid[]>([]);
  const [loading, setLoading] = useState(true);
  // No local state for history sheet needed anymore since it's a new page
  
  // Adjust Dialog state managed by rendering conditionally or key
  // Since we map through items, we can put dialogs inside map or manage state
  // Managing state is cleaner to avoid multiple dialog instances in DOM
  const [adjustPaket, setAdjustPaket] = useState<{id: number, name: string} | null>(null);

  const canAdjust = authStore.hasPermission("paket_murid.adjust") || authStore.hasPermission("enrollment.update");
  const canView = authStore.hasPermission("enrollment.view"); // Assuming basic view permission

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await saldoPertemuanApi.getSaldoEnrollment(enrollmentId);
      setData(res || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [enrollmentId]);

  useEffect(() => {
    if (canView) {
      fetchData();
    }
  }, [enrollmentId, canView, fetchData]);

  if (!canView) return null;

  // History is now a dedicated page via Link

  return (
    <Card className="h-full">
      <CardHeader className="py-4 border-b flex flex-row items-center justify-between">
        <div className="space-y-1">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CreditCard className="size-4" /> Saldo Pertemuan
            </CardTitle>
        </div>
        <div className="flex items-center gap-2">
            <TopupPaketDialog
              enrollmentId={enrollmentId}
              existingPaketMurid={data}
              onSuccess={fetchData}
            />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
            <div className="space-y-3 pt-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
        ) : data.length > 0 ? (
            <div className="divide-y">
                {Object.values(data.reduce((acc, item) => {
                    const paketId = item.paket_id || item.paket?.id;
                    const key = `${paketId}-${item.status}`;
                    if (!acc[key]) {
                        acc[key] = { 
                            ...item, 
                            saldo_current: 0, 
                            paket_murid_ids: [] as number[],
                            is_aggregated: false
                        };
                    }
                    acc[key].saldo_current += Number(item.saldo_current);
                    acc[key].paket_murid_ids.push(item.id);
                    if (acc[key].paket_murid_ids.length > 1) {
                        acc[key].is_aggregated = true;
                    }
                    return acc;
                }, {} as Record<string, any>)).map((item) => (
                    <div key={item.paket_id + item.status} className="py-4 flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-sm truncate">
                                    {item.paket_nama || item.paket?.nama || `Paket #${item.paket_id}`}
                                </h4>
                                <Badge variant={item.status === 'AKTIF' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                                    {item.status}
                                </Badge>
                                {item.is_aggregated && (
                                    <Badge variant="outline" className="text-[9px] px-1 py-0 border-blue-200 bg-blue-50 text-blue-600">
                                        Gabungan
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>Sisa Total: <strong className={item.saldo_current > 0 ? "text-emerald-600" : "text-rose-600"}>{item.saldo_current}</strong> Pertemuan</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Link href={`/dashboard/enrollment/${enrollmentId}/saldo/${item.id}/riwayat?all=true&paket_id=${item.paket_id}`}>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8" 
                                    title="Riwayat"
                                >
                                    <History className="size-4 text-muted-foreground" />
                                </Button>
                            </Link>
                            
                            {canAdjust && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreVertical className="size-4 text-muted-foreground" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setAdjustPaket({ id: item.id, name: item.paket_nama || item.paket?.nama || `Paket #${item.paket_id}` })}>
                                            <Settings2 className="mr-2 size-4" />
                                            Adjust Saldo / Hangus
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="py-8 text-center text-muted-foreground">
                <p className="text-sm">Belum ada paket aktif.</p>
                <div className="mt-2 text-xs text-muted-foreground/70">
                    Klik &quot;Tambah Paket&quot; untuk menambahkan.
                </div>
            </div>
        )}
      </CardContent>

      {/* Dialog for Adjusting Saldo */}
      {adjustPaket && (
        <AdjustSaldoDialog 
            open={!!adjustPaket}
            onOpenChange={(val) => !val && setAdjustPaket(null)}
            paketMuridId={adjustPaket.id}
            paketName={adjustPaket.name}
            onSuccess={() => {
                fetchData();
                setAdjustPaket(null);
            }} 
        />
      )}
    </Card>
  );
}
