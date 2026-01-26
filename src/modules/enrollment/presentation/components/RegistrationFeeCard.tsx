import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Enrollment } from "@/modules/enrollment/domain/entities";
import { UpdateFeeStatusDialog } from "./UpdateFeeStatusDialog";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface RegistrationFeeCardProps {
  enrollment: Enrollment;
  canUpdate: boolean;
}

export function RegistrationFeeCard({ enrollment, canUpdate }: RegistrationFeeCardProps) {
  const [open, setOpen] = useState(false);

  const formatDate = (s: string | null | undefined) => {
    if (!s) return "-";
    try {
      const d = new Date(s);
      return Number.isNaN(d.getTime()) ? String(s) : d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    } catch {
      return String(s);
    }
  };

  if (!enrollment.biaya_pendaftaran_status) return null;

  return (
    <div className="bg-muted/30 rounded-lg p-4 mb-4 border">
      <div className="flex justify-between items-start mb-2">
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Biaya Pendaftaran</p>
        <Badge 
          variant={
            enrollment.biaya_pendaftaran_status === 'PAID' ? 'default' : 
            enrollment.biaya_pendaftaran_status === 'UNPAID' ? 'destructive' : 
            'secondary'
          } 
          className="text-[10px] px-1 h-5"
        >
          {enrollment.biaya_pendaftaran_status}
        </Badge>
      </div>
      <p className="text-lg font-bold">{formatCurrency(Number(enrollment.biaya_pendaftaran_amount))}</p>
      {enrollment.biaya_pendaftaran_due_date && (
        <p className="text-xs text-muted-foreground mt-1">
          Jatuh Tempo: {formatDate(enrollment.biaya_pendaftaran_due_date)}
        </p>
      )}
      
      <div className="mt-3">
        {canUpdate && (
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            Ubah Status
          </Button>
        )}
        <UpdateFeeStatusDialog 
          enrollment={enrollment}
          open={open}
          onOpenChange={setOpen}
        />
      </div>
    </div>
  );
}
