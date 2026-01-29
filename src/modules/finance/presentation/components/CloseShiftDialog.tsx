"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, LogOut, TrendingDown, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { ShiftSummary } from "@/lib/api/kas";

interface CloseShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (actualCash: number, notes?: string) => Promise<void>;
  shiftSummary: ShiftSummary;
}

export function CloseShiftDialog({
  open,
  onOpenChange,
  onConfirm,
  shiftSummary,
}: CloseShiftDialogProps) {
  const [actualCash, setActualCash] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(val || 0);
  };

  const expectedCash = shiftSummary.totals.expected_cash;
  const variance = (Number(actualCash) || 0) - expectedCash;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onConfirm(Number(actualCash) || 0, notes || undefined);
      setActualCash("");
      setNotes("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5 text-red-600" />
            Tutup Shift #{shiftSummary.shift.id}
          </DialogTitle>
          <DialogDescription>
            Review ringkasan shift dan hitung jumlah uang tunai di kas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Shift Summary */}
          <div className="rounded-lg border p-4 space-y-3">
            <h4 className="font-medium text-sm">Ringkasan Shift</h4>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Saldo Awal:</span>
                <span className="font-medium">{formatCurrency(shiftSummary.shift.opening_balance)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transaksi:</span>
                <span className="font-medium">{shiftSummary.totals.transaction_count} item</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  Masuk:
                </span>
                <span className="font-medium text-green-600">+{formatCurrency(shiftSummary.totals.total_in)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-red-600" />
                  Keluar:
                </span>
                <span className="font-medium text-red-600">-{formatCurrency(shiftSummary.totals.total_out)}</span>
              </div>
            </div>


            <div className="border-t pt-3 space-y-2">
              <h5 className="font-medium text-xs text-muted-foreground">Breakdown Per Metode:</h5>
              <div className="space-y-1.5 text-xs">
                {Object.entries(shiftSummary.by_method).map(([method, amounts]) => (
                  <div key={method} className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/30">
                    <span className="font-medium">{method}:</span>
                    <div className="flex items-center gap-2">
                      {amounts.in > 0 && (
                        <span className="text-green-600 font-medium">
                          +{formatCurrency(amounts.in)}
                        </span>
                      )}
                      {amounts.out > 0 && (
                        <span className="text-red-600 font-medium">
                          -{formatCurrency(amounts.out)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">Saldo Akhir Yang Diharapkan (Tunai):</span>
                <span className="font-bold text-lg">{formatCurrency(expectedCash)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                💡 Hanya transaksi TUNAI yang dihitung. Transfer/QRIS/E-Wallet tidak ada di laci kas.
              </p>
            </div>
          </div>

          {/* Cash Count */}
          <div className="space-y-2">
            <Label htmlFor="actual-cash">Jumlah Uang Tunai Dihitung (Rp)</Label>
            <Input
              id="actual-cash"
              type="number"
              placeholder="0"
              value={actualCash}
              onChange={(e) => setActualCash(e.target.value)}
              className="font-mono text-lg"
              min={0}
            />
            <p className="text-sm text-muted-foreground">
              {formatCurrency(Number(actualCash) || 0)}
            </p>
          </div>

          {/* Variance */}
          {actualCash && (
            <div className={`rounded-lg p-3 ${
              variance === 0 
                ? "bg-green-50 dark:bg-green-950/20 border-green-200" 
                : variance > 0 
                  ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200"
                  : "bg-red-50 dark:bg-red-950/20 border-red-200"
            } border`}>
              <div className="flex items-center gap-2">
                {variance === 0 ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className={`h-5 w-5 ${variance > 0 ? "text-blue-600" : "text-red-600"}`} />
                )}
                <div>
                  <p className="font-medium text-sm">
                    Selisih: {variance >= 0 ? "+" : ""}{formatCurrency(variance)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {variance === 0 
                      ? "Kas seimbang! ✓" 
                      : variance > 0 
                        ? "Uang lebih dari yang diharapkan"
                        : "Uang kurang dari yang diharapkan"
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Catatan (Opsional)</Label>
            <Textarea
              id="notes"
              placeholder="Tambahkan catatan jika ada selisih atau hal penting lainnya..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Batal
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleSubmit} 
            disabled={loading || !actualCash}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Tutup Shift & Cetak
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
