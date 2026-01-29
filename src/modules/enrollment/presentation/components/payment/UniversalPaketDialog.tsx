"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Plus } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

import { enrollmentPaymentsApi } from "@/lib/api/enrollmentPayments";
import { KAS_METODE_OPTIONS } from "@/lib/api/kas";
import { listPaket, lookupPrice } from "@/modules/catalog/infrastructure/catalog.repository";
import { Paket } from "@/modules/catalog/domain/entities";
import { PaketMurid } from "@/lib/api/saldo-pertemuan";
import { adjustSaldo, createPaketMurid } from "@/lib/api/saldo-pertemuan";

const formSchema = z.object({
  mode: z.enum(["new", "topup"]),
  paket_id: z.string().optional(),
  paket_murid_id: z.string().optional(),
  jumlah_pertemuan: z.number().min(1, "Minimal 1 pertemuan"),
  payment_type: z.enum(["gratis", "bayar"]),
  // Payment fields (conditional)
  metode: z.string().optional(),
  amount: z.number().optional(),
  tanggal: z.date().optional(),
  keterangan: z.string().optional(),
  external_ref: z.string().optional(),
  bukti_file: z.instanceof(File).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface UniversalPaketDialogProps {
  enrollmentId: number;
  programId?: number;
  jenjangId?: number;
  existingPaketMurid?: PaketMurid[];
  onSuccess: () => void;
  triggerButton?: React.ReactNode;
}

export function UniversalPaketDialog({
  enrollmentId,
  programId,
  jenjangId,
  existingPaketMurid = [],
  onSuccess,
  triggerButton,
}: UniversalPaketDialogProps) {
  const [open, setOpen] = useState(false);
  const [idempotencyKey] = useState(() => uuidv4());
  const [pakets, setPakets] = useState<Paket[]>([]);
  const [loadingPaket, setLoadingPaket] = useState(false);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mode: existingPaketMurid.length > 0 ? "topup" : "new",
      payment_type: "bayar",
      jumlah_pertemuan: 4,
      amount: 0,
      metode: "",
      keterangan: "",
      external_ref: "",
    },
  });

  const { isSubmitting } = form.formState;
  const mode = form.watch("mode");
  const paymentType = form.watch("payment_type");
  const selectedPaketId = form.watch("paket_id");
  const selectedPaketMuridId = form.watch("paket_murid_id");
  const jumlahPertemuan = form.watch("jumlah_pertemuan");

  // Get selected paket or paket_murid
  const selectedPaket = pakets.find((p) => String(p.id) === selectedPaketId);
  const selectedPaketMurid = existingPaketMurid.find((pm) => String(pm.id) === selectedPaketMuridId);

  // Load pakets when dialog opens
  useEffect(() => {
    if (open) {
      setLoadingPaket(true);
      listPaket({
        status: "Aktif",
        program_id: programId,
        jenjang_id: jenjangId,
        per_page: 100,
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

  // Calculate price when needed
  useEffect(() => {
    if (paymentType === "bayar" && jumlahPertemuan && programId && jenjangId) {
      const paketId = mode === "new" ? selectedPaketId : selectedPaketMurid?.paket_id;
      
      if (paketId) {
        setLoadingPrice(true);
        setCalculatedPrice(null);

        lookupPrice({
          paket_id: String(paketId),
          program_id: String(programId),
          jenjang_id: String(jenjangId),
          jumlah_siswa: "1",
        })
          .then((result) => {
            if (result?.harga) {
              const paket = mode === "new" 
                ? selectedPaket 
                : pakets.find(p => p.id === selectedPaketMurid?.paket_id);
              
              const pertemuanPerBulan = paket?.pertemuan_per_bulan || 4;
              const multiplier = Math.ceil(jumlahPertemuan / pertemuanPerBulan);
              const totalPrice = result.harga * multiplier;
              
              setCalculatedPrice(totalPrice);
              form.setValue("amount", totalPrice);
            }
          })
          .catch((err) => {
            console.error("Error fetching price:", err);
          })
          .finally(() => {
            setLoadingPrice(false);
          });
      }
    }
  }, [paymentType, jumlahPertemuan, selectedPaketId, selectedPaketMurid, mode, programId, jenjangId, form, selectedPaket, pakets]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (values.payment_type === "gratis") {
        // Free topup using adjust saldo
        if (values.mode === "new") {
          // Create new paket first, then adjust
          if (!values.paket_id) {
            toast.error("Pilih paket terlebih dahulu");
            return;
          }

          // Create paket_murid first using API client
          const createdPaket = await createPaketMurid(enrollmentId, {
            paket_id: Number(values.paket_id),
            catatan: values.keterangan || "Paket gratis",
          });

          // Then adjust saldo
          await adjustSaldo(createdPaket.id, {
            type: "ADJUST",
            qty: values.jumlah_pertemuan,
            reason: values.keterangan || "Topup gratis",
          });

          toast.success(`Berhasil! Paket gratis dibuat dengan ${values.jumlah_pertemuan} pertemuan`);
        } else {
          // Topup existing paket
          if (!values.paket_murid_id) {
            toast.error("Pilih paket yang akan di-topup");
            return;
          }

          await adjustSaldo(Number(values.paket_murid_id), {
            type: "ADJUST",
            qty: values.jumlah_pertemuan,
            reason: values.keterangan || "Topup gratis",
          });

          toast.success(`Berhasil! Ditambahkan ${values.jumlah_pertemuan} pertemuan`);
        }
      } else {
        // Paid topup
        if (!values.metode) {
          toast.error("Pilih metode pembayaran");
          return;
        }

        // Use FormData if file is present, otherwise use JSON
        if (values.bukti_file) {
          const formData = new FormData();
          formData.append("amount", String(values.amount));
          formData.append("metode", values.metode);
          if (values.tanggal) {
            formData.append("tanggal", format(values.tanggal, "yyyy-MM-dd HH:mm:ss"));
          }
          if (values.keterangan) {
            formData.append("keterangan", values.keterangan);
          }
          if (values.external_ref) {
            formData.append("external_ref", values.external_ref);
          }
          formData.append("idempotency_key", idempotencyKey);
          formData.append("bukti_file", values.bukti_file);

          if (values.mode === "new") {
            formData.append("paket_id", String(values.paket_id));
            formData.append("topup_qty", String(values.jumlah_pertemuan));
          } else {
            formData.append("paket_murid_id", String(values.paket_murid_id));
            formData.append("topup_qty", String(values.jumlah_pertemuan));
          }

          // Use httpClient post which handles FormData properly
          const result = await enrollmentPaymentsApi.payPackageTopup(enrollmentId, formData);
          const transactionId = result.transaction?.id;
          
          toast.success(`Berhasil! Saldo: ${result.saldo_baru} pertemuan`, {
            action: transactionId ? {
              label: "Print Kwitansi",
              onClick: () => {
                const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
                window.open(`${backendUrl}/kas/transaksi/${transactionId}/print-thermal`, '_blank');
              }
            } : undefined,
          });
        } else {
          // No file, use regular JSON payload
          const payload: Record<string, unknown> = {
            amount: values.amount,
            metode: values.metode,
            tanggal: values.tanggal ? format(values.tanggal, "yyyy-MM-dd HH:mm:ss") : undefined,
            keterangan: values.keterangan || undefined,
            external_ref: values.external_ref || undefined,
            idempotency_key: idempotencyKey,
          };

          if (values.mode === "new") {
            payload.paket_id = Number(values.paket_id);
            payload.topup_qty = values.jumlah_pertemuan;
          } else {
            payload.paket_murid_id = Number(values.paket_murid_id);
            payload.topup_qty = values.jumlah_pertemuan;
          }

          const result = await enrollmentPaymentsApi.payPackageTopup(enrollmentId, payload as unknown as Parameters<typeof enrollmentPaymentsApi.payPackageTopup>[1]);
          toast.success(`Berhasil! Saldo: ${result.saldo_baru} pertemuan`);
        }
      }

      setOpen(false);
      form.reset();
      onSuccess();
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };
      if (err?.status === 403) {
        toast.error("Anda tidak memiliki akses");
        return;
      }
      toast.error(err.message || "Gagal memproses");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button size="sm" className="gap-1">
            <Plus className="size-4" />
            Paket / Topup
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah / Topup Paket</DialogTitle>
          <DialogDescription>
            Buat paket baru atau topup paket yang sudah ada (gratis atau bayar)
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Mode Selection */}
            {existingPaketMurid.length > 0 && (
              <FormField
                control={form.control}
                name="mode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mode</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="new" id="mode-new" />
                          <Label htmlFor="mode-new">Buat Paket Baru</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="topup" id="mode-topup" />
                          <Label htmlFor="mode-topup">Topup Paket Existing</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Paket Selection */}
            {mode === "new" ? (
              <FormField
                control={form.control}
                name="paket_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pilih Paket <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingPaket}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingPaket ? "Memuat..." : "Pilih paket"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {pakets.map((paket) => (
                          <SelectItem key={paket.id} value={String(paket.id)}>
                            {paket.nama} ({paket.pertemuan_per_bulan} pertemuan/bulan)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="paket_murid_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pilih Paket yang Akan Di-topup <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih paket" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {existingPaketMurid.map((pm) => (
                          <SelectItem key={pm.id} value={String(pm.id)}>
                            {pm.paket_nama} (Saldo: {pm.saldo_current} pertemuan)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Jumlah Pertemuan */}
            <FormField
              control={form.control}
              name="jumlah_pertemuan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jumlah Pertemuan <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="4"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Type */}
            <FormField
              control={form.control}
              name="payment_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipe Pembayaran <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="gratis" id="type-gratis" />
                        <Label htmlFor="type-gratis">Gratis</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="bayar" id="type-bayar" />
                        <Label htmlFor="type-bayar">Bayar</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Fields (only if bayar) */}
            {paymentType === "bayar" && (
              <>
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

                <FormField
                  control={form.control}
                  name="external_ref"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referensi Eksternal</FormLabel>
                      <FormControl>
                        <Input placeholder="No. Kwitansi, dll" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
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
                          value={undefined}
                        />
                      </FormControl>
                      <FormDescription>
                        Upload foto/scan bukti pembayaran (opsional, max 5MB)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting || loadingPrice || loadingPaket}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
