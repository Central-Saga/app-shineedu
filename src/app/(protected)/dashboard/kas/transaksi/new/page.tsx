"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2, ArrowLeft, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { kasApi, KAS_KATEGORI_OPTIONS, KAS_METODE_OPTIONS } from "@/lib/api/kas";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

const formSchema = z.object({
  type: z.enum(["IN", "OUT"]),
  tanggal: z.date().optional(),
  amount: z.number().min(1, "Jumlah harus lebih dari 0"),
  metode: z.string().min(1, "Metode pembayaran harus dipilih"),
  kategori: z.string().min(1, "Kategori harus dipilih"),
  pihak: z.string().optional(),
  keterangan: z.string().optional(),
  external_ref: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateKasTransaksiPage() {
  const { allowed } = usePermissionGuard("kas.create");
  const router = useRouter();
  const { setItems } = useBreadcrumbStore();
  const [idempotencyKey] = useState(() => uuidv4());

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Kas", href: "/dashboard/kas" },
      { label: "Transaksi", href: "/dashboard/kas/transaksi" },
      { label: "Tambah Transaksi" },
    ]);
  }, [setItems]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "IN",
      metode: "",
      kategori: "",
      pihak: "",
      keterangan: "",
      external_ref: "",
    },
  });

  const { isSubmitting } = form.formState;
  const selectedType = form.watch("type");

  const onSubmit = async (values: FormValues) => {
    try {
      await kasApi.create({
        type: values.type,
        tanggal: values.tanggal ? format(values.tanggal, "yyyy-MM-dd HH:mm:ss") : undefined,
        amount: values.amount,
        metode: values.metode,
        kategori: values.kategori,
        pihak: values.pihak || undefined,
        keterangan: values.keterangan || undefined,
        external_ref: values.external_ref || undefined,
        idempotency_key: idempotencyKey,
      });

      toast.success("Transaksi berhasil disimpan");
      router.push("/dashboard/kas/transaksi");
    } catch (error: any) {
      if (error?.status === 403) {
        toast.error("Anda tidak memiliki akses untuk membuat transaksi");
        router.replace("/dashboard");
        return;
      }
      if (error?.status === 422) {
        // Handle validation errors
        const fieldErrors = error.errors;
        if (fieldErrors) {
          Object.entries(fieldErrors).forEach(([field, messages]) => {
            if (Array.isArray(messages)) {
              form.setError(field as keyof FormValues, { message: messages[0] });
            }
          });
        }
        toast.error(error.message || "Data tidak valid. Silakan periksa kembali.");
        return;
      }
      toast.error(error.message || "Gagal menyimpan transaksi");
    }
  };

  if (!allowed) return null;

  return (
    <div className="w-full pb-10 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => router.back()} className="h-9 w-9">
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tambah Transaksi Kas</h1>
          <p className="text-muted-foreground text-sm">
            Catat transaksi kas masuk atau keluar baru
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detail Transaksi</CardTitle>
          <CardDescription>
            Lengkapi informasi transaksi di bawah ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Type Selection */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipe Transaksi <span className="text-red-500">*</span></FormLabel>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => field.onChange("IN")}
                        className={cn(
                          "flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all",
                          field.value === "IN"
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-muted hover:border-muted-foreground/30"
                        )}
                      >
                        <ArrowUpCircle className="size-5" />
                        <div className="text-left">
                          <p className="font-semibold">Kas Masuk</p>
                          <p className="text-xs opacity-70">Pemasukan / IN</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange("OUT")}
                        className={cn(
                          "flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all",
                          field.value === "OUT"
                            ? "border-red-500 bg-red-50 text-red-700"
                            : "border-muted hover:border-muted-foreground/30"
                        )}
                      >
                        <ArrowDownCircle className="size-5" />
                        <div className="text-left">
                          <p className="font-semibold">Kas Keluar</p>
                          <p className="text-xs opacity-70">Pengeluaran / OUT</p>
                        </div>
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                {/* Date */}
                <FormField
                  control={form.control}
                  name="tanggal"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Tanggal</FormLabel>
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
                      <FormDescription>
                        Kosongkan untuk menggunakan tanggal hari ini
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                {/* Kategori */}
                <FormField
                  control={form.control}
                  name="kategori"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori <span className="text-red-500">*</span></FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih kategori" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {KAS_KATEGORI_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Pihak */}
              <FormField
                control={form.control}
                name="pihak"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {selectedType === "IN" ? "Diterima Dari" : "Dibayarkan Kepada"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={selectedType === "IN" ? "Contoh: Wali Murid A" : "Contoh: Supplier B"}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Nama pihak terkait dalam transaksi (opsional)
                    </FormDescription>
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
                        rows={3}
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
                        placeholder="Contoh: INV-001, No. Faktur, dll"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Nomor referensi dari sistem lain jika ada (opsional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan Transaksi
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
