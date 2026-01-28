"use client";

import { useState, useEffect, useCallback } from "react";
import { shiftApi, ShiftSummary } from "@/lib/api/kas";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, DollarSign, LogOut, PlayCircle, Printer } from "lucide-react";
import { toast } from "sonner";
import { OpenShiftDialog } from "./OpenShiftDialog";
import { CloseShiftDialog } from "./CloseShiftDialog";
import { authStore } from "@/modules/auth/infrastructure/auth.store";

interface ShiftStatusBarProps {
  onShiftChange?: () => void;
}

export function ShiftStatusBar({ onShiftChange }: ShiftStatusBarProps) {
  const [currentShift, setCurrentShift] = useState<ShiftSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [openDialogOpen, setOpenDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);

  const fetchCurrentShift = useCallback(async () => {
    try {
      console.log('[ShiftStatusBar] Fetching current shift...');
      const data = await shiftApi.current();
      console.log('[ShiftStatusBar] Received data:', data);
      setCurrentShift(data);
    } catch (error) {
      console.error("[ShiftStatusBar] Error fetching shift:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentShift();
  }, [fetchCurrentShift]);

  const handleOpenShift = async (openingBalance: number) => {
    try {
      console.log('[ShiftStatusBar] Opening shift with balance:', openingBalance);
      const result = await shiftApi.open(openingBalance);
      console.log('[ShiftStatusBar] Shift opened successfully:', result);
      toast.success("Shift berhasil dibuka");
      setOpenDialogOpen(false);
      console.log('[ShiftStatusBar] Fetching current shift after open...');
      await fetchCurrentShift();
      onShiftChange?.();
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('[ShiftStatusBar] Error opening shift:', err);
      toast.error(err.message || "Gagal membuka shift");
    }
  };

  const handleCloseShift = async (actualCash: number, notes?: string) => {
    if (!currentShift) return;
    
    try {
      await shiftApi.close(currentShift.shift.id, actualCash, notes);
      toast.success("Shift berhasil ditutup");
      setCloseDialogOpen(false);
      
      // Print shift summary
      const token = authStore.getState().token;
      const printUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/kas/shift/${currentShift.shift.id}/print`;
      
      const response = await fetch(printUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const html = await response.text();
        const printWindow = window.open("", "_blank", "width=400,height=600");
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
        }
      }
      
      fetchCurrentShift();
      onShiftChange?.();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message || "Gagal menutup shift");
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(val || 0);
  };

  if (loading) {
    return (
      <Card className="mb-4 p-3 bg-muted/50">
        <div className="animate-pulse flex items-center gap-3">
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
      </Card>
    );
  }

  if (!currentShift) {
    return (
      <>
        <Card className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  Tidak ada shift aktif
                </p>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  Buka shift untuk mulai mencatat transaksi
                </p>
              </div>
            </div>
            <Button onClick={() => setOpenDialogOpen(true)} size="sm">
              <PlayCircle className="mr-2 h-4 w-4" />
              Buka Shift
            </Button>
          </div>
        </Card>

        <OpenShiftDialog
          open={openDialogOpen}
          onOpenChange={setOpenDialogOpen}
          onConfirm={handleOpenShift}
        />
      </>
    );
  }

  return (
    <>
      <Card className="mb-4 p-3 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-600">
                Shift Aktif
              </Badge>
              <span className="text-sm font-medium">#{currentShift.shift.id}</span>
            </div>
            
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                Dibuka: {new Date(currentShift.shift.opened_at).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <div className="flex items-center gap-1 text-sm">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="font-medium">
                Saldo Awal: {formatCurrency(currentShift.shift.opening_balance)}
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <span className="text-green-600 font-medium">
                +{formatCurrency(currentShift.totals.cash_in)}
              </span>
              <span className="text-red-600 font-medium">
                -{formatCurrency(currentShift.totals.cash_out)}
              </span>
              <span className="font-bold">
                = {formatCurrency(currentShift.totals.expected_cash)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const token = authStore.getState().token;
                const printUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/kas/shift/${currentShift.shift.id}/print`;
                
                fetch(printUrl, {
                  headers: { Authorization: `Bearer ${token}` },
                })
                  .then((res) => res.text())
                  .then((html) => {
                    const printWindow = window.open("", "_blank", "width=400,height=600");
                    if (printWindow) {
                      printWindow.document.write(html);
                      printWindow.document.close();
                    }
                  });
              }}
            >
              <Printer className="mr-2 h-4 w-4" />
              Cetak
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setCloseDialogOpen(true)}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Tutup Shift
            </Button>
          </div>
        </div>
      </Card>

      <CloseShiftDialog
        open={closeDialogOpen}
        onOpenChange={setCloseDialogOpen}
        onConfirm={handleCloseShift}
        shiftSummary={currentShift}
      />
    </>
  );
}
