"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

import { enrollmentPaymentsApi } from "@/lib/api/enrollmentPayments";
import { KAS_METODE_OPTIONS } from "@/lib/api/kas";

const formSchema = z.object({
  amount: z.number().min(1, "Jumlah harus lebih dari 0"),
  metode: z.string().min(1, "Metode pembayaran harus dipilih"),
  tanggal: z.date().optional(),
  keterangan: z.string().optional(),
  external_ref: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PayRegistrationFeeDialogProps {
  enrollmentId: number;
  defaultAmount?: number;
  onSuccess: () => void;
  triggerButton?: React.ReactNode;
}

export function PayRegistrationFeeDialog({
  enrollmentId,
  defaultAmount,
  onSuccess,
  triggerButton,
}: PayRegistrationFeeDialogProps) {
  const [open, setOpen] = useState(false);
  const [idempotencyKey] = useState(() => uuidv4());

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: defaultAmount || 0,
      metode: "",
      keterangan: "",
      external_ref: "",
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: FormValues) => {
    try {
      await enrollmentPaymentsApi.payRegistrationFee(enrollmentId, {
        amount: values.amount,
        metode: values.metode,
        tanggal: values.tanggal ? format(values.tanggal, "yyyy-MM-dd HH:mm:ss") : undefined,
        keterangan: values.keterangan || undefined,
        external_ref: values.external_ref || undefined,
        idempotency_key: idempotencyKey,
      });

      toast.success("Pembayaran biaya pendaftaran berhasil dicatat");
      setOpen(false);
      form.reset();
      onSuccess();
    } catch (error: any) {
      if (error?.status === 403) {
        toast.error("Anda tidak memiliki akses untuk memproses pembayaran");
        return;
      }
      if (error?.status === 409) {
        toast.error(error.message || "Biaya pendaftaran sudah dibayar sebelumnya");
        return;
      }
      if (error?.status === 422) {
        const fieldErrors = error.errors;
        if (fieldErrors) {
          Object.entries(fieldErrors).forEach(([field, messages]) => {
            if (Array.isArray(messages)) {
              form.setError(field as keyof FormValues, { message: messages[0] });
            }
          });
        }
        toast.error(error.message || "Data tidak valid");
        return;
      }
      toast.error(error.message || "Gagal mencatat pembayaran");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button size="sm" className="gap-1">
            <CreditCard className="size-4" />
            Bayar Pendaftaran
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Bayar Biaya Pendaftaran</DialogTitle>
          <DialogDescription>
            Catat pembayaran biaya pendaftaran untuk enrollment ini.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jumlah (Rp) <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      className="font-mono"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Metode */}
            <FormField
              control={form.control}
              name="metode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Metode Pembayaran <span className="text-red-500">*</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih metode" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {KAS_METODE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date */}
            <FormField
              control={form.control}
              name="tanggal"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Tanggal Pembayaran</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd MMMM yyyy")
                          ) : (
                            <span>Hari ini (default)</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Keterangan */}
            <FormField
              control={form.control}
              name="keterangan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keterangan</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Keterangan tambahan (opsional)"
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* External Ref */}
            <FormField
              control={form.control}
              name="external_ref"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referensi Eksternal</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="No. Kwitansi, dll"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Nomor referensi dari sistem lain (opsional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Pembayaran
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
