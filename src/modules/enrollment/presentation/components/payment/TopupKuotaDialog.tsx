"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2, ArrowUpCircle } from "lucide-react";
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
import { lookupPrice } from "@/modules/catalog/infrastructure/catalog.repository";

const formSchema = z.object({
  paket_murid_id: z.string().min(1, "Pilih paket yang akan di-topup"),
  multiplier: z.number().min(1, "Pilih kelipatan pertemuan"),
  amount: z.number().min(1, "Jumlah harus lebih dari 0"),
  metode: z.string().min(1, "Metode pembayaran harus dipilih"),
  tanggal: z.date().optional(),
  keterangan: z.string().optional(),
  external_ref: z.string().optional(),
  bukti_file: z.instanceof(File).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface TopupKuotaDialogProps {
  enrollmentId: number;
  programId?: number;
  jenjangId?: number;
  existingPaketMurid: PaketMurid[];
  onSuccess: () => void;
  triggerButton?: React.ReactNode;
}

export function TopupKuotaDialog({
  enrollmentId,
  programId,
  jenjangId,
  existingPaketMurid,
  onSuccess,
  triggerButton,
}: TopupKuotaDialogProps) {
  const [open, setOpen] = useState(false);
  const [idempotencyKey] = useState(() => uuidv4());
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paket_murid_id: "",
      multiplier: 1,
      amount: 0,
      metode: "",
      keterangan: "",
      external_ref: "",
    },
  });

  const { isSubmitting } = form.formState;
  const selectedPaketMuridId = form.watch("paket_murid_id");
  const selectedMultiplier = form.watch("multiplier");

  // Get selected paket murid
  const selectedPaketMurid = existingPaketMurid.find(
    (pm) => String(pm.id) === selectedPaketMuridId
  );

  // Calculate price when paket or multiplier changes
  useEffect(() => {
    if (selectedPaketMurid && selectedMultiplier && programId && jenjangId) {
      setLoadingPrice(true);
      setCalculatedPrice(null);

      lookupPrice({
        paket_id: String(selectedPaketMurid.paket_id),
        program_id: String(programId),
        jenjang_id: String(jenjangId),
        jumlah_siswa: "1", // Default to 1 for individual student
      })
        .then((result) => {
          if (result?.harga) {
            const totalPrice = result.harga * selectedMultiplier;
            setCalculatedPrice(totalPrice);
            form.setValue("amount", totalPrice);
          } else {
            toast.error("Harga paket tidak ditemukan");
          }
        })
        .catch((err) => {
          console.error("Error fetching price:", err);
          toast.error("Gagal mengambil harga paket");
        })
        .finally(() => {
          setLoadingPrice(false);
        });
    }
  }, [selectedPaketMurid, selectedMultiplier, programId, jenjangId, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      const paketMurid = existingPaketMurid.find((pm) => String(pm.id) === values.paket_murid_id);
      if (!paketMurid) {
        toast.error("Paket tidak ditemukan");
        return;
      }

      const pertemuanPerBulan = paketMurid.paket?.pertemuan_per_bulan || 0;
      const topupQty = pertemuanPerBulan * values.multiplier;

      const payload: any = {
        paket_murid_id: Number(values.paket_murid_id),
        topup_qty: topupQty,
        amount: values.amount,
        metode: values.metode,
        tanggal: values.tanggal ? format(values.tanggal, "yyyy-MM-dd HH:mm:ss") : undefined,
        keterangan: values.keterangan || undefined,
        external_ref: values.external_ref || undefined,
        idempotency_key: idempotencyKey,
      };

      // TODO: Handle file upload when backend is ready
      // if (values.bukti_file) {
      //   payload.bukti_file = values.bukti_file;
      // }

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

  // Generate multiplier options (1x to 12x)
  const multiplierOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  if (existingPaketMurid.length === 0) {
    return null; // Don't show button if no existing paket
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button size="sm" variant="outline" className="gap-1">
            <ArrowUpCircle className="size-4" />
            Topup Kuota
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Topup Kuota Pertemuan</DialogTitle>
          <DialogDescription>
            Topup kuota pertemuan untuk paket yang sudah ada
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Paket Selection */}
            <FormField
              control={form.control}
              name="paket_murid_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pilih Paket <span className="text-red-500">*</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih paket yang akan di-topup" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {existingPaketMurid.map((pm) => (
                        <SelectItem key={pm.id} value={String(pm.id)}>
                          {pm.paket?.nama || pm.paket_nama || `Paket #${pm.paket_id}`} 
                          {" "}(Saldo: {pm.saldo_current} pertemuan)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Multiplier */}
            {selectedPaketMurid && (
              <FormField
                control={form.control}
                name="multiplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kelipatan Pertemuan <span className="text-red-500">*</span></FormLabel>
                    <Select 
                      onValueChange={(val) => field.onChange(Number(val))} 
                      defaultValue={String(field.value)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kelipatan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {multiplierOptions.map((mult) => {
                          const pertemuanPerBulan = selectedPaketMurid.paket?.pertemuan_per_bulan || 0;
                          const totalPertemuan = pertemuanPerBulan * mult;
                          return (
                            <SelectItem key={mult} value={String(mult)}>
                              {mult}x ({totalPertemuan} pertemuan)
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Paket ini: {selectedPaketMurid.paket?.pertemuan_per_bulan || 0} pertemuan/bulan
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Amount (Auto-calculated) */}
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
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="font-mono"
                      disabled={loadingPrice}
                    />
                  </FormControl>
                  {loadingPrice && (
                    <FormDescription className="text-blue-600">
                      Menghitung harga...
                    </FormDescription>
                  )}
                  {calculatedPrice && !loadingPrice && (
                    <FormDescription className="text-green-600">
                      Harga otomatis: Rp {calculatedPrice.toLocaleString("id-ID")}
                    </FormDescription>
                  )}
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

            {/* Upload Bukti - TODO: Implement when backend ready */}
            {/* <FormField
              control={form.control}
              name="bukti_file"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>Bukti Pembayaran</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onChange(file);
                      }}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Upload foto/scan bukti pembayaran (opsional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            /> */}

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
              <Button type="submit" disabled={isSubmitting || loadingPrice}>
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
