"use client";

import { useEffect, useState, useCallback } from "react";
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
import { TambahPaketDialog } from "./saldo/TambahPaketDialog";
import { RiwayatLedgerSheet } from "./saldo/RiwayatLedgerSheet";
import { AdjustSaldoDialog } from "./saldo/AdjustSaldoDialog";

interface SaldoPertemuanCardProps {
  enrollmentId: number;
  programId: number;
  jenjangId: number;
}

export function SaldoPertemuanCard({ enrollmentId, programId, jenjangId }: SaldoPertemuanCardProps) {
  const [data, setData] = useState<PaketMurid[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaketId, setSelectedPaketId] = useState<number | null>(null);
  
  // Sheet/Dialog states
  const [showHistory, setShowHistory] = useState(false);
  
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
  }, [enrollmentId, canView]);

  if (!canView) return null;

  const handleOpenHistory = (id: number) => {
    setSelectedPaketId(id);
    setShowHistory(true);
  };

  return (
    <Card className="h-full">
      <CardHeader className="py-4 border-b flex flex-row items-center justify-between">
        <div className="space-y-1">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CreditCard className="size-4" /> Saldo Pertemuan
            </CardTitle>
        </div>
        <div>
            <TambahPaketDialog 
                enrollmentId={enrollmentId} 
                programId={programId}
                jenjangId={jenjangId}
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
                {data.map((item) => (
                    <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-sm truncate">
                                    {item.paket_nama || item.paket?.nama || `Paket #${item.paket_id}`}
                                </h4>
                                <Badge variant={item.status === 'AKTIF' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                                    {item.status}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>Sisa: <strong className={item.saldo_current > 0 ? "text-emerald-600" : "text-rose-600"}>{item.saldo_current}</strong> Pertemuan</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenHistory(item.id)} title="Riwayat">
                                <History className="size-4 text-muted-foreground" />
                            </Button>
                            
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
                    Klik "Tambah Paket" untuk menambahkan.
                </div>
            </div>
        )}
      </CardContent>

      <RiwayatLedgerSheet 
        paketMuridId={selectedPaketId}
        open={showHistory}
        onOpenChange={setShowHistory}
      />

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
