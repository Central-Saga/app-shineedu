"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Settings2 } from "lucide-react";
import { toast } from "sonner";

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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { saldoPertemuanApi } from "@/lib/api/saldo-pertemuan";

// Schema for form
const formSchema = z.object({
  action: z.enum(["ADD", "SUBTRACT", "EXPIRE"]),
  qty: z.coerce.number().min(0, "Jumlah harus lebih dari 0"),
  reason: z.string().min(3, "Alasan wajib diisi (min 3 karakter)"),
});

export interface AdjustSaldoDialogProps {
  paketMuridId: number;
  paketName: string;
  onSuccess: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function AdjustSaldoDialog({ 
  paketMuridId, 
  paketName, 
  onSuccess,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger
}: AdjustSaldoDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (val: boolean) => {
    if (isControlled && controlledOnOpenChange) {
      controlledOnOpenChange(val);
    } else {
      setInternalOpen(val);
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      action: "ADD",
      qty: 0,
      reason: "",
    },
  });

  const { isSubmitting } = form.formState;
  const action = form.watch("action");
  const isExpire = action === "EXPIRE";

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      let type: 'ADJUST' | 'EXPIRE' = 'ADJUST';
      let qty = values.qty;

      if (values.action === 'SUBTRACT') {
        qty = -Math.abs(values.qty);
      } else if (values.action === 'EXPIRE') {
        type = 'EXPIRE';
        qty = -1; 
      }

      await saldoPertemuanApi.adjustSaldo(paketMuridId, {
        type,
        qty,
        reason: values.reason,
      });

      toast.success("Berhasil melakukan penyesuaian saldo");
      setOpen(false);
      form.reset();
      onSuccess();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Gagal melakukan penyesuaian");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      {!trigger && !isControlled && (
         // Fallback default trigger if used as standalone without prop
         <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground">
              <Settings2 className="size-3" />
            </Button>
         </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Penyesuaian Saldo</DialogTitle>
          <DialogDescription>
             Adjust saldo untuk paket <strong>{paketName}</strong>.
             Tindakan ini akan tercatat di ledger.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="action"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tindakan</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih tindakan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ADD">Tambah Saldo (Koreksi Positif)</SelectItem>
                      <SelectItem value="SUBTRACT">Kurangi Saldo (Koreksi Negatif)</SelectItem>
                      <SelectItem value="EXPIRE">Hanguskan Sisa Saldo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isExpire && (
                <FormField
                control={form.control}
                name="qty"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Jumlah Pertemuan</FormLabel>
                    <FormControl>
                        <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>
                        Masukkan angka positif.
                    </FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
            )}

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alasan <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Contoh: Koreksi data, bonus, hangus karena periode berakhir, dll." 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting} variant={isExpire ? "destructive" : "default"}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isExpire ? "Hanguskan" : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
