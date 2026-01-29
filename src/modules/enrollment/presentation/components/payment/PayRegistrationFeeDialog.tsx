"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2, CreditCard, Upload, X, FileText, ImageIcon } from "lucide-react";
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

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

const formSchema = z.object({
  amount: z.number().min(1, "Jumlah harus lebih dari 0"),
  metode: z.string().min(1, "Metode pembayaran harus dipilih"),
  tanggal: z.date().optional(),
  keterangan: z.string().optional(),
  external_ref: z.string().optional(),
  bukti_file: z.instanceof(File).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PayRegistrationFeeDialogProps {
  enrollmentId: number;
  registrationFee?: number;  // Biaya Pendaftaran
  packagePrice?: number;     // Harga Paket
  onSuccess: () => void;
  triggerButton?: React.ReactNode;
}

export function PayRegistrationFeeDialog({
  enrollmentId,
  registrationFee = 0,
  packagePrice = 0,
  onSuccess,
  triggerButton,
}: PayRegistrationFeeDialogProps) {
  const [open, setOpen] = useState(false);
  const [idempotencyKey] = useState(() => uuidv4());
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Total amount = registration fee + package price
  const totalAmount = registrationFee + packagePrice;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: totalAmount || 0,
      metode: "",
      keterangan: "",
      external_ref: "",
    },
  });

  const { isSubmitting } = form.formState;
  const buktiFile = form.watch("bukti_file");

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
      // Use FormData if there's a file
      if (values.bukti_file) {
        const formData = new FormData();
        formData.append("amount", values.amount.toString());
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

        await enrollmentPaymentsApi.payRegistrationFee(enrollmentId, formData);
      } else {
        await enrollmentPaymentsApi.payRegistrationFee(enrollmentId, {
          amount: values.amount,
          metode: values.metode,
          tanggal: values.tanggal ? format(values.tanggal, "yyyy-MM-dd HH:mm:ss") : undefined,
          keterangan: values.keterangan || undefined,
          external_ref: values.external_ref || undefined,
          idempotency_key: idempotencyKey,
        });
      }

      toast.success("Pembayaran biaya pendaftaran berhasil dicatat");
      setOpen(false);
      form.reset();
      clearFile();
      onSuccess();
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string; errors?: Record<string, string[]> };
      if (err?.status === 403) {
        toast.error("Anda tidak memiliki akses untuk memproses pembayaran");
        return;
      }
      if (err?.status === 409) {
        toast.error(err.message || "Biaya pendaftaran sudah dibayar sebelumnya");
        return;
      }
      if (err?.status === 422) {
        const fieldErrors = err.errors;
        if (fieldErrors) {
          Object.entries(fieldErrors).forEach(([field, messages]) => {
            if (Array.isArray(messages)) {
              form.setError(field as keyof FormValues, { message: messages[0] });
            }
          });
        }
        toast.error(err.message || "Data tidak valid");
        return;
      }
      toast.error(err?.message || "Gagal mencatat pembayaran");
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
          <DialogTitle>Bayar Pendaftaran + Paket Pertama</DialogTitle>
          <DialogDescription>
            Pembayaran ini akan mencatat biaya pendaftaran sekaligus mengaktifkan saldo pertemuan paket pertama.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Breakdown Info */}
            {(registrationFee > 0 || packagePrice > 0) && (
              <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Biaya Pendaftaran</span>
                  <span className="font-mono">Rp {registrationFee.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Harga Paket</span>
                  <span className="font-mono">Rp {packagePrice.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                  <span>Total</span>
                  <span className="font-mono text-primary">Rp {totalAmount.toLocaleString("id-ID")}</span>
                </div>
              </div>
            )}

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
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="font-mono"
                    />
                  </FormControl>
                  <FormDescription>
                    Isi sesuai total atau sesuaikan jika berbeda (misal: diskon, cicilan, dll.)
                  </FormDescription>
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
                        Klik untuk upload bukti pembayaran
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
                            className="max-h-32 rounded border object-contain"
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
