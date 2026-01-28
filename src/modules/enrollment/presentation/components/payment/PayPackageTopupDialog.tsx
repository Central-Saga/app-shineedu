"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2, PackagePlus } from "lucide-react";
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
import { PaketMurid } from "@/lib/api/saldo-pertemuan";
import { listPaket } from "@/modules/catalog/infrastructure/catalog.repository";
import { Paket } from "@/modules/catalog/domain/entities";

const formSchema = z.object({
  paket_murid_id: z.string().optional(),
  paket_id: z.string().optional(),
  topup_qty: z.number().optional(),
  amount: z.number().min(1, "Jumlah harus lebih dari 0"),
  metode: z.string().min(1, "Metode pembayaran harus dipilih"),
  tanggal: z.date().optional(),
  keterangan: z.string().optional(),
  external_ref: z.string().optional(),
}).refine(
  (data) => data.paket_murid_id || data.paket_id,
  { message: "Pilih paket yang sudah ada atau paket baru", path: ["paket_murid_id"] }
);

type FormValues = z.infer<typeof formSchema>;

interface PayPackageTopupDialogProps {
  enrollmentId: number;
  programId?: number;
  jenjangId?: number;
  existingPaketMurid?: PaketMurid[];
  onSuccess: () => void;
  triggerButton?: React.ReactNode;
}

export function PayPackageTopupDialog({
  enrollmentId,
  programId,
  jenjangId,
  existingPaketMurid = [],
  onSuccess,
  triggerButton,
}: PayPackageTopupDialogProps) {
  const [open, setOpen] = useState(false);
  const [idempotencyKey] = useState(() => uuidv4());
  const [pakets, setPakets] = useState<Paket[]>([]);
  const [loadingPaket, setLoadingPaket] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paket_murid_id: "",
      paket_id: "",
      topup_qty: undefined,
      amount: 0,
      metode: "",
      keterangan: "",
      external_ref: "",
    },
  });

  const { isSubmitting } = form.formState;
  const selectedPaketMuridId = form.watch("paket_murid_id");
  const selectedPaketId = form.watch("paket_id");

  // Load pakets when dialog opens
  useEffect(() => {
    if (open) {
      setLoadingPaket(true);
      listPaket({
        status: "Aktif",
        program_id: programId,
        jenjang_id: jenjangId,
        per_page: 100
      })
        .then((res) => {
          setPakets(res.items);
        })
        .catch((err) => {
          console.error("Gagal memuat paket:", err);
          toast.error("Gagal memuat daftar paket");
        })
        .finally(() => {
          setLoadingPaket(false);
        });
    }
  }, [open, programId, jenjangId]);

  // Update default qty when paket changes
  useEffect(() => {
    if (selectedPaketId) {
      const paket = pakets.find((p) => String(p.id) === selectedPaketId);
      if (paket) {
        form.setValue("topup_qty", paket.pertemuan_per_bulan || 0);
      }
    }
  }, [selectedPaketId, pakets, form]);

  // If existing paket_murid selected, clear paket_id and vice versa
  useEffect(() => {
    if (selectedPaketMuridId && selectedPaketMuridId !== "__new__") {
      form.setValue("paket_id", "");
    }
  }, [selectedPaketMuridId, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      const payload: any = {
        amount: values.amount,
        metode: values.metode,
        tanggal: values.tanggal ? format(values.tanggal, "yyyy-MM-dd HH:mm:ss") : undefined,
        keterangan: values.keterangan || undefined,
        external_ref: values.external_ref || undefined,
        idempotency_key: idempotencyKey,
      };

      if (values.paket_murid_id && values.paket_murid_id !== "__new__") {
        payload.paket_murid_id = Number(values.paket_murid_id);
      } else if (values.paket_id) {
        payload.paket_id = Number(values.paket_id);
      }

      if (values.topup_qty) {
        payload.topup_qty = values.topup_qty;
      }

      const result = await enrollmentPaymentsApi.payPackageTopup(enrollmentId, payload);

      toast.success(`Berhasil! Saldo pertemuan sekarang: ${result.saldo_baru}`);
      setOpen(false);
      form.reset();
      onSuccess();
    } catch (error: any) {
      if (error?.status === 403) {
        toast.error("Anda tidak memiliki akses untuk memproses topup");
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
      toast.error(error.message || "Gagal mencatat pembayaran topup");
    }
  };

  const hasExistingPaketMurid = existingPaketMurid.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button size="sm" variant="outline" className="gap-1">
            <PackagePlus className="size-4" />
            Bayar / Topup Kuota
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bayar Paket / Topup Kuota Pertemuan</DialogTitle>
          <DialogDescription>
            Catat pembayaran paket atau topup kuota pertemuan untuk murid ini.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Paket Selection */}
            {hasExistingPaketMurid ? (
              <FormField
                control={form.control}
                name="paket_murid_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pilih Paket <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih paket yang sudah ada atau buat baru" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {existingPaketMurid.map((pm) => (
                          <SelectItem key={pm.id} value={String(pm.id)}>
                            {pm.paket?.nama || pm.paket_nama || `Paket #${pm.paket_id}`} (Saldo: {pm.saldo_current})
                          </SelectItem>
                        ))}
                        <SelectItem value="__new__">+ Tambah Paket Baru</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            {/* New Paket Selection (if no existing or __new__ selected) */}
            {(!hasExistingPaketMurid || selectedPaketMuridId === "__new__") && (
              <FormField
                control={form.control}
                name="paket_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paket Baru <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingPaket}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingPaket ? "Memuat paket..." : "Pilih paket"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {pakets.map((paket) => (
                          <SelectItem key={paket.id} value={String(paket.id)}>
                            {paket.nama} ({paket.pertemuan_per_bulan} Pertemuan)
                          </SelectItem>
                        ))}
                        {!loadingPaket && pakets.length === 0 && (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            Tidak ada paket aktif
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Pilih paket untuk membuat paket murid baru sekaligus topup
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Topup Qty */}
              <FormField
                control={form.control}
                name="topup_qty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jumlah Pertemuan</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Default dari paket"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Kosongkan untuk default
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Amount */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jumlah Bayar (Rp) <span className="text-red-500">*</span></FormLabel>
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
            </div>

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
