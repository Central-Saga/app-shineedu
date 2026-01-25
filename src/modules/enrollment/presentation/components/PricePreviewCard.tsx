"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils"; // Fallback to Intl if needed
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface PricePreviewCardProps {
  loading: boolean;
  price: number | null;
  error?: string | null;
  hasRequiredParams: boolean;
}

export function PricePreviewCard({
  loading,
  price,
  error,
  hasRequiredParams,
}: PricePreviewCardProps) {
  
  const formatIDR = (val: number) => 
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(val);

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="text-lg">Ringkasan Harga</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasRequiredParams ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            Lengkapi form (Program, Jenjang, Paket, Jml Siswa) untuk melihat harga.
          </div>
        ) : loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : error ? (
           <div className="text-sm text-destructive flex gap-2 items-start bg-destructive/10 p-3 rounded-md">
             <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
             <span>{error}</span>
           </div>
        ) : price !== null ? (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Harga Final (Snapshot)</div>
            <div className="text-3xl font-bold text-primary">
              {formatIDR(price)}
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded-full">
              <CheckCircle2 className="h-3 w-3" />
              <span>Harga Tersedia</span>
            </div>
          </div>
        ) : (
           <div className="text-sm text-muted-foreground">
             Tidak dapat memuat harga.
           </div>
        )}
      </CardContent>
    </Card>
  );
}
