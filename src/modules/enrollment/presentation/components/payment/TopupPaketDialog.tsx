"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Plus, Upload, X, FileText, ImageIcon } from "lucide-react";
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
import { PaketMurid, adjustSaldo } from "@/lib/api/saldo-pertemuan";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

const formSchema = z.object({
  paket_murid_id: z.string().min(1, "Pilih paket yang akan di-topup"),
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

interface TopupPaketDialogProps {
  enrollmentId: number;
  existingPaketMurid: PaketMurid[];
  onSuccess: () => void;
  triggerButton?: React.ReactNode;
}

/**
 * TopupPaketDialog - Dialog khusus untuk topup paket yang sudah ada
 * TIDAK bisa membuat paket baru di sini.
 * Paket baru hanya dibuat saat enrollment baru.
 */
export function TopupPaketDialog({
  enrollmentId,
  existingPaketMurid,
  onSuccess,
  triggerButton,
}: TopupPaketDialogProps) {
  const [open, setOpen] = useState(false);
  const [idempotencyKey] = useState(() => uuidv4());
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paket_murid_id: existingPaketMurid.length === 1 ? String(existingPaketMurid[0].id) : "",
      payment_type: "bayar",
      jumlah_pertemuan: 4,
      amount: 0,
      metode: "",
      keterangan: "",
      external_ref: "",
    },
  });

  const { isSubmitting } = form.formState;
  const paymentType = form.watch("payment_type");
  const selectedPaketMuridId = form.watch("paket_murid_id");
  const buktiFile = form.watch("bukti_file");

  // Get selected paket_murid
  const selectedPaketMurid = existingPaketMurid.find((pm) => String(pm.id) === selectedPaketMuridId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }

    // Validate file type
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      toast.error("Format file harus JPG, PNG, WebP, atau PDF");
      return;
    }

    form.setValue("bukti_file", file);

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const clearFile = () => {
    form.setValue("bukti_file", undefined);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      if (values.payment_type === "gratis") {
        // Free topup using adjust saldo
        await adjustSaldo(Number(values.paket_murid_id), {
          type: "ADJUST",
          qty: values.jumlah_pertemuan,
          reason: values.keterangan || "Topup gratis",
        });

        toast.success(`Berhasil! Ditambahkan ${values.jumlah_pertemuan} pertemuan`);
      } else {
        // Paid topup
        if (!values.metode) {
          toast.error("Pilih metode pembayaran");
          return;
        }

        if (!values.amount || values.amount <= 0) {
          toast.error("Jumlah pembayaran harus lebih dari 0");
          return;
        }

        // Use FormData if file is present
        if (values.bukti_file) {
          const formData = new FormData();
          formData.append("paket_murid_id", values.paket_murid_id);
          formData.append("topup_qty", String(values.jumlah_pertemuan));
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

          const result = await enrollmentPaymentsApi.payPackageTopup(enrollmentId, formData);
          toast.success(`Berhasil! Saldo: ${result.saldo_baru} pertemuan`);
        } else {
          // No file, use regular JSON payload
          const result = await enrollmentPaymentsApi.payPackageTopup(enrollmentId, {
            paket_murid_id: Number(values.paket_murid_id),
            topup_qty: values.jumlah_pertemuan,
            amount: values.amount,
            metode: values.metode,
            tanggal: values.tanggal ? format(values.tanggal, "yyyy-MM-dd HH:mm:ss") : undefined,
            keterangan: values.keterangan || undefined,
            external_ref: values.external_ref || undefined,
            idempotency_key: idempotencyKey,
          });
          toast.success(`Berhasil! Saldo: ${result.saldo_baru} pertemuan`);
        }
      }

      setOpen(false);
      form.reset();
      clearFile();
      onSuccess();
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };
      if (err?.status === 403) {
        toast.error("Anda tidak memiliki akses");
        return;
      }
      toast.error(err?.message || "Gagal memproses");
    }
  };

  // Don't render if no paket available
  if (existingPaketMurid.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button size="sm" className="gap-1">
            <Plus className="size-4" />
            Topup Kuota
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Topup Saldo Pertemuan</DialogTitle>
          <DialogDescription>
            Tambah kuota pertemuan untuk paket yang sudah ada
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
                  {selectedPaketMurid && (
                    <FormDescription>
                      Saldo saat ini: <strong>{selectedPaketMurid.saldo_current}</strong> pertemuan
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

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
                        <Label htmlFor="type-gratis">Gratis / Trial</Label>
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
                        />
                      </FormControl>
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

                {/* Bukti Pembayaran (File Upload) */}
                <FormItem>
                  <FormLabel>Bukti Pembayaran</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      {!buktiFile ? (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                        >
                          <Upload className="size-6 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Klik untuk upload bukti
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            JPG, PNG, WebP, PDF (max 5MB)
                          </p>
                        </div>
                      ) : (
                        <div className="border rounded-lg p-3 bg-muted/30">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              {previewUrl ? (
                                <ImageIcon className="size-4 text-blue-500 shrink-0" />
                              ) : (
                                <FileText className="size-4 text-red-500 shrink-0" />
                              )}
                              <span className="text-sm truncate">{buktiFile.name}</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={clearFile}
                              className="shrink-0 h-7 w-7 p-0"
                            >
                              <X className="size-4" />
                            </Button>
                          </div>
                          {previewUrl && (
                            <div className="mt-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={previewUrl}
                                alt="Preview"
                                className="max-h-24 rounded border object-contain"
                              />
                            </div>
                          )}
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Upload bukti pembayaran (opsional)
                  </FormDescription>
                </FormItem>

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
              <Button type="submit" disabled={isSubmitting}>
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
