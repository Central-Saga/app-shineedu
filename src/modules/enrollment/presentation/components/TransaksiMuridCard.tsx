"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Receipt, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  CreditCard,
  ExternalLink 
} from "lucide-react";
import Link from "next/link";

import { enrollmentPaymentsApi, EnrollmentTransaksi } from "@/lib/api/enrollmentPayments";
import { authStore } from "@/modules/auth/infrastructure/auth.store";
import { PayRegistrationFeeDialog } from "./payment/PayRegistrationFeeDialog";

const formatCurrency = (val: number | string | null | undefined) => {
  if (val === null || val === undefined) return "Rp 0";
  const num = typeof val === 'string' ? parseFloat(val) : val;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(num);
};

const formatDate = (s: string | null | undefined) => {
  if (!s) return "-";
  try {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? String(s) : d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  } catch {
    return String(s);
  }
};

interface TransaksiMuridCardProps {
  enrollmentId: number;
  biayaPendaftaran?: number;
  statusPendaftaranPaid?: boolean;
  onPaymentSuccess?: () => void;
}

export function TransaksiMuridCard({
  enrollmentId,
  biayaPendaftaran,
  statusPendaftaranPaid = false,
  onPaymentSuccess,
}: TransaksiMuridCardProps) {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<EnrollmentTransaksi[]>([]);

  const canPayRegistration = authStore.hasPermission("enrollment.update");

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const result = await enrollmentPaymentsApi.getTransaksiEnrollment(enrollmentId, 1, 5);
      setTransactions(result.data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  }, [enrollmentId]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handlePaymentSuccess = () => {
    fetchTransactions();
    onPaymentSuccess?.();
  };

  return (
    <Card>
      <CardHeader className="py-4 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Receipt className="size-4" />
            Transaksi Murid
          </CardTitle>
          <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
            <Link href={`/dashboard/kas/transaksi?q=${enrollmentId}`}>
              <ExternalLink className="size-3 mr-1" />
              Lihat Semua
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {canPayRegistration && !statusPendaftaranPaid && (
            <PayRegistrationFeeDialog
              enrollmentId={enrollmentId}
              defaultAmount={biayaPendaftaran}
              onSuccess={handlePaymentSuccess}
              triggerButton={
                <Button size="sm" className="gap-1">
                  <CreditCard className="size-4" />
                  Bayar Pendaftaran
                </Button>
              }
            />
          )}
        </div>

        {/* Recent Transactions */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Transaksi Terakhir:</p>
          
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-6 text-center border rounded-lg bg-muted/20 border-dashed">
              <Receipt className="size-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Belum ada transaksi</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((trx) => (
                <div
                  key={trx.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-full ${trx.type === 'IN' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                      {trx.type === 'IN' ? (
                        <ArrowUpCircle className="size-4" />
                      ) : (
                        <ArrowDownCircle className="size-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{trx.kategori}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(trx.tanggal)} • {trx.metode}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-mono font-semibold ${trx.type === 'IN' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {trx.type === 'IN' ? '+' : '-'}{formatCurrency(trx.amount)}
                    </p>
                    {trx.keterangan && (
                      <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {trx.keterangan}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
