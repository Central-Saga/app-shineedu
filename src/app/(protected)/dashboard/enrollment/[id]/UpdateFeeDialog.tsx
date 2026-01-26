"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { enrollmentRepository } from "@/modules/enrollment/infrastructure/enrollment.repository";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface UpdateFeeDialogProps {
    enrollmentId: number;
    currentStatus: string;
    trigger?: React.ReactNode;
}

export function UpdateFeeDialog({ enrollmentId, currentStatus, trigger }: UpdateFeeDialogProps) {
    const [open, setOpen] = useState(false);
    const [status, setStatus] = useState(currentStatus);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleUpdate = async () => {
        setLoading(true);
        try {
            await enrollmentRepository.updateRegistrationFeeStatus(enrollmentId, { status });
            toast.success("Status pembayaran berhasil diperbarui");
            setOpen(false);
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Gagal memperbarui status");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline" size="sm">Ubah Status</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Update Status Pembayaran</DialogTitle>
                    <DialogDescription>
                        Ubah status pembayaran biaya pendaftaran enrollment ini.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="status" className="text-right">
                            Status
                        </Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Pilih status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="UNPAID">Unpaid</SelectItem>
                                <SelectItem value="PAID">Paid</SelectItem>
                                <SelectItem value="WAIVED">Waived</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Batal</Button>
                    <Button onClick={handleUpdate} disabled={loading}>
                        {loading ? "Menyimpan..." : "Simpan"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
