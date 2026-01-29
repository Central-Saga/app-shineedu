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
import { Loader2, PlayCircle } from "lucide-react";

interface OpenShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (openingBalance: number) => Promise<void>;
}

export function OpenShiftDialog({
  open,
  onOpenChange,
  onConfirm,
}: OpenShiftDialogProps) {
  const [openingBalance, setOpeningBalance] = useState<string>("0");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onConfirm(Number(openingBalance) || 0);
      setOpeningBalance("0");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-green-600" />
            Buka Shift Baru
          </DialogTitle>
          <DialogDescription>
            Masukkan jumlah uang tunai di kas awal untuk memulai shift baru.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="opening-balance">Saldo Awal (Rp)</Label>
            <Input
              id="opening-balance"
              type="number"
              placeholder="0"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              className="font-mono text-lg"
              min={0}
            />
            <p className="text-sm text-muted-foreground">
              {formatCurrency(Number(openingBalance) || 0)}
            </p>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <p className="font-medium mb-1">💡 Tips:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Hitung uang tunai di laci kas sebelum buka shift</li>
              <li>Pastikan jumlah sesuai dengan fisik uang</li>
              <li>Semua transaksi akan tercatat dalam shift ini</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Buka Shift
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
