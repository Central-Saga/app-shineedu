"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  CalendarIcon, 
  Loader2, 
  CreditCard, 
  Upload, 
  X, 
  FileText, 
  User,
  GraduationCap,
  Package,
  Receipt
} from "lucide-react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import Link from "next/link";

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
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { enrollmentPaymentsApi } from "@/lib/api/enrollmentPayments";
import { KAS_METODE_OPTIONS } from "@/lib/api/kas";
import { get } from "@/shared/infrastructure/api/httpClient";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";

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

interface Enrollment {
  id: number;
  kode_enrollment: string;
  status: string;
  biaya_pendaftaran_amount: number;
  biaya_pendaftaran_status: string;
  harga_final: number;
  murid: {
    id: number;
    nama_lengkap: string;
    nis?: string;
  };
  program: {
    id: number;
    nama: string;
  };
  jenjang: {
    id: number;
    nama: string;
  };
  paket: {
    id: number;
    nama: string;
    pertemuan_per_bulan?: number;
  };
}

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams();
  const enrollmentId = Number(params.id);

  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [idempotencyKey] = useState(() => uuidv4());
  const { setItems } = useBreadcrumbStore();

  // Fetch enrollment data
  useEffect(() => {
    const fetchEnrollment = async () => {
      try {
        const data = await get<Enrollment>(`enrollments/${enrollmentId}`);
        setEnrollment(data);
        
        // Check if already paid
        if (data.biaya_pendaftaran_status === 'PAID') {
          toast.info("Pendaftaran sudah dibayar");
          router.replace(`/dashboard/enrollment/${enrollmentId}`);
          return;
        }
      } catch (error) {
        console.error(error);
        toast.error("Gagal memuat data enrollment");
        router.replace("/dashboard/enrollment");
      } finally {
        setLoading(false);
      }
    };

    if (enrollmentId) {
      fetchEnrollment();
    }
  }, [enrollmentId, router]);

  // Set breadcrumbs
  useEffect(() => {
    if (enrollment) {
      setItems([
        { label: "Dashboard", href: "/dashboard" },
        { label: "Enrollment", href: "/dashboard/enrollment" },
        { label: enrollment.murid.nama_lengkap, href: `/dashboard/enrollment/${enrollmentId}` },
        { label: "Pembayaran" },
      ]);
    }
  }, [enrollment, enrollmentId, setItems]);

  // Calculate totals
  const registrationFee = enrollment?.biaya_pendaftaran_amount || 0;
  const packagePrice = Number(enrollment?.harga_final) || 0;
  const totalAmount = registrationFee + packagePrice;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      metode: "",
      keterangan: "",
      external_ref: "",
    },
  });

  // Update amount when enrollment data loads
  useEffect(() => {
    if (enrollment) {
      form.setValue("amount", totalAmount);
    }
  }, [enrollment, totalAmount, form]);

  const { isSubmitting } = form.formState;
  const buktiFile = form.watch("bukti_file");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      toast.error("Format file tidak didukung. Gunakan JPG, PNG, WebP, atau PDF.");
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Ukuran file maksimal 5MB");
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
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      let payload: FormData | Record<string, unknown>;

      if (values.bukti_file) {
        // Use FormData for file upload
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
        payload = formData;
      } else {
        // Use JSON payload
        payload = {
          amount: values.amount,
          metode: values.metode,
          tanggal: values.tanggal ? format(values.tanggal, "yyyy-MM-dd HH:mm:ss") : undefined,
          keterangan: values.keterangan || undefined,
          external_ref: values.external_ref || undefined,
          idempotency_key: idempotencyKey,
        };
      }

      await enrollmentPaymentsApi.payRegistrationFee(enrollmentId, payload as FormData);
      
      toast.success("Pembayaran berhasil dicatat!");
      router.push(`/dashboard/enrollment/${enrollmentId}`);
    } catch (error) {
      const err = error as { status?: number; message?: string };
      if (err?.status === 409) {
        toast.info("Pembayaran sudah tercatat sebelumnya");
        router.push(`/dashboard/enrollment/${enrollmentId}`);
        return;
      }
      toast.error(err?.message || "Gagal mencatat pembayaran");
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Skeleton className="h-96 w-full" />
          </div>
          <div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!enrollment) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/enrollment/${enrollmentId}`}>
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Pembayaran Pendaftaran</h1>
          <p className="text-muted-foreground text-sm">
            Catat pembayaran untuk {enrollment.murid.nama_lengkap}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form - Left/Main Column */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="size-5" />
                Detail Pembayaran
              </CardTitle>
              <CardDescription>
                Pembayaran ini mencakup biaya pendaftaran dan paket pertama
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                            className="font-mono text-lg h-12"
                          />
                        </FormControl>
                        <FormDescription>
                          Sesuaikan jika berbeda (misal: diskon, cicilan, dll.)
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
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Pilih metode pembayaran" />
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
                                  "h-11 pl-3 text-left font-normal",
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
                              disabled={(date) => date > new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* File Upload */}
                  <div className="space-y-2">
                    <FormLabel>Bukti Pembayaran</FormLabel>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    
                    {!buktiFile ? (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                      >
                        <Upload className="size-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Klik untuk upload bukti pembayaran
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          JPG, PNG, WebP, PDF (max 5MB)
                        </p>
                      </div>
                    ) : (
                      <div className="border rounded-lg p-4 bg-muted/30">
                        <div className="flex items-start gap-3">
                          {previewUrl ? (
                            <img 
                              src={previewUrl} 
                              alt="Preview" 
                              className="w-20 h-20 object-cover rounded-md"
                            />
                          ) : (
                            <div className="w-20 h-20 bg-muted rounded-md flex items-center justify-center">
                              <FileText className="size-8 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium truncate">{buktiFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(buktiFile.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={clearFile}
                            className="shrink-0"
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Upload foto/scan bukti pembayaran (opsional)
                    </p>
                  </div>

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
                          <Input placeholder="No. Kwitansi, No. Transfer, dll" {...field} />
                        </FormControl>
                        <FormDescription>
                          Nomor referensi dari sistem lain (opsional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Submit */}
                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" asChild className="flex-1">
                      <Link href={`/dashboard/enrollment/${enrollmentId}`}>
                        Batal
                      </Link>
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="flex-1">
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Simpan Pembayaran
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Right Column */}
        <div className="space-y-4">
          {/* Student Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="size-4" />
                Info Siswa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <p className="font-medium">{enrollment.murid.nama_lengkap}</p>
                <p className="text-muted-foreground text-xs">{enrollment.murid.nis || '-'}</p>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <GraduationCap className="size-4" />
                <span>{enrollment.program.nama}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Package className="size-4" />
                <span>{enrollment.paket.nama}</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {enrollment.jenjang.nama}
              </Badge>
            </CardContent>
          </Card>

          {/* Payment Breakdown */}
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Receipt className="size-4" />
                Rincian Biaya
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Biaya Pendaftaran</span>
                <span className="font-mono">Rp {registrationFee.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Harga Paket</span>
                <span className="font-mono">Rp {packagePrice.toLocaleString("id-ID")}</span>
              </div>
              {enrollment.paket.pertemuan_per_bulan && (
                <p className="text-xs text-muted-foreground">
                  ({enrollment.paket.pertemuan_per_bulan} pertemuan/bulan)
                </p>
              )}
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="font-mono text-lg text-primary">
                    Rp {totalAmount.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info Notice */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-4 text-sm">
            <p className="text-blue-700 dark:text-blue-300">
              <strong>ℹ️ Info:</strong> Setelah pembayaran dicatat, saldo pertemuan akan otomatis terisi sesuai paket ({enrollment.paket.pertemuan_per_bulan || 0} pertemuan).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
