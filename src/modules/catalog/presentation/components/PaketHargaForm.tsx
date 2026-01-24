"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { paketHargaSchema, type PaketHargaFormValues } from "../schemas";
import { createPaketHarga, updatePaketHarga } from "@/modules/catalog/infrastructure/catalog.repository";
import type { PaketHarga, Program, Jenjang, Paket } from "@/modules/catalog/domain/entities";
import { useTransition } from "react";
import { Banknote, CalendarDays, Users2, GraduationCap } from "lucide-react";

interface PaketHargaFormProps {
  initialData?: PaketHarga;
  programs: Program[];
  jenjangs: Jenjang[];
  pakets: Paket[];
  mode: "create" | "edit";
}

export function PaketHargaForm({ initialData, programs, jenjangs, pakets, mode }: PaketHargaFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<PaketHargaFormValues>({
    resolver: zodResolver(paketHargaSchema) as any,
    defaultValues: {
      program_id: initialData?.program_id || 0,
      jenjang_id: initialData?.jenjang_id || 0,
      paket_id: initialData?.paket_id || 0,
      min_siswa: initialData?.min_siswa || 1,
      max_siswa: initialData?.max_siswa || 1,
      harga: initialData?.harga || 0,
      effective_from: initialData?.effective_from ? initialData.effective_from.split("T")[0] : "",
      effective_to: initialData?.effective_to ? initialData.effective_to.split("T")[0] : "",
      status: (initialData?.status as "Aktif" | "Non Aktif") || "Aktif",
    },
  });

  const onSubmit = (values: PaketHargaFormValues) => {
    startTransition(async () => {
      try {
        if (mode === "edit" && initialData) {
          await updatePaketHarga(initialData.id, values);
          toast.success("Harga paket berhasil diperbarui");
        } else {
          await createPaketHarga(values);
          toast.success("Harga paket berhasil ditambahkan");
        }
        router.push("/dashboard/catalog/harga");
        router.refresh();
      } catch (error: unknown) {
        const err = error as { details?: Record<string, string[]> };
        if (err?.details) {
            Object.keys(err.details).forEach((key) => {
                form.setError(key as any, { message: (err.details as any)[key][0] });
            });
            if (err?.details?.base) {
                toast.error(err.details.base[0]);
            }
        } else {
             toast.error((error as Error).message || "Terjadi kesalahan");
        }
      }
    });
  };

  return (
    <Card className="border-none shadow-premium ring-1 ring-slate-100 rounded-2xl overflow-hidden py-0">
      <CardHeader className="border-b border-slate-50 bg-slate-50/30 pb-4">
        <CardTitle className="text-lg font-bold text-slate-800">
          {mode === "create" ? "Atur Harga Paket" : `Edit Harga Paket: ${initialData?.id}`}
        </CardTitle>
        <CardDescription>
          Konfigurasi biaya berdasarkan kombinasi program, jenjang, dan jumlah siswa.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-rose-50 rounded-lg text-rose-600">
                      <GraduationCap className="size-4" />
                  </div>
                  <Label className="text-sm font-bold uppercase tracking-tight text-slate-700">Relasi Katalog</Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                    control={form.control}
                    name="program_id"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-tight text-slate-700">Program Pelajaran</FormLabel>
                        <Select 
                            onValueChange={(v) => field.onChange(Number(v))} 
                            defaultValue={field.value ? String(field.value) : ""} 
                            disabled={isPending}
                        >
                        <FormControl>
                            <SelectTrigger className="bg-slate-50/50">
                            <SelectValue placeholder="Pilih program" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {programs.map(p => (
                                <SelectItem key={p.id} value={String(p.id)}>{p.nama}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                    </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="jenjang_id"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-tight text-slate-700">Jenjang Pendidikan</FormLabel>
                        <Select 
                            onValueChange={(v) => field.onChange(Number(v))} 
                            defaultValue={field.value ? String(field.value) : ""} 
                            disabled={isPending}
                        >
                        <FormControl>
                            <SelectTrigger className="bg-slate-50/50">
                            <SelectValue placeholder="Pilih jenjang" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {jenjangs.map(j => (
                                <SelectItem key={j.id} value={String(j.id)}>{j.nama}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                    </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="paket_id"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-tight text-slate-700">Varian Paket</FormLabel>
                        <Select 
                            onValueChange={(v) => field.onChange(Number(v))} 
                            defaultValue={field.value ? String(field.value) : ""} 
                            disabled={isPending}
                        >
                        <FormControl>
                            <SelectTrigger className="bg-slate-50/50">
                            <SelectValue placeholder="Pilih paket" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {pakets.map(p => (
                                <SelectItem key={p.id} value={String(p.id)}>{p.nama}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                    </FormItem>
                    )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div className="space-y-6">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                            <Users2 className="size-4" />
                        </div>
                        <Label className="text-sm font-bold uppercase tracking-tight text-slate-700">Kapasitas Siswa</Label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="min_siswa"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-semibold text-slate-600">Minimal</FormLabel>
                                <FormControl>
                                <Input type="number" min={1} {...field} disabled={isPending} className="bg-slate-50/50 border-slate-100" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="max_siswa"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-semibold text-slate-600">Maksimal</FormLabel>
                                <FormControl>
                                <Input type="number" min={1} {...field} disabled={isPending} className="bg-slate-50/50 border-slate-100" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                            <Banknote className="size-4" />
                        </div>
                        <Label className="text-sm font-bold uppercase tracking-tight text-slate-700">Biaya Investasi</Label>
                    </div>

                    <FormField
                        control={form.control}
                        name="harga"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-semibold text-slate-600">Nominal per Bulan (IDR)</FormLabel>
                            <FormControl>
                            <Input type="number" min={0} {...field} disabled={isPending} className="bg-emerald-50/30 border-emerald-100 text-emerald-900 font-bold text-lg" />
                            </FormControl>
                            <FormDescription className="text-[10px]">Harga yang akan ditagihkan ke siswa.</FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
              </div>

              <div className="space-y-6 pt-4">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600">
                        <CalendarDays className="size-4" />
                    </div>
                    <Label className="text-sm font-bold uppercase tracking-tight text-slate-700">Masa Berlaku & Status</Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                        control={form.control}
                        name="effective_from"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-semibold text-slate-600">Berlaku Mulai</FormLabel>
                            <FormControl>
                            <Input type="date" {...field} disabled={isPending} className="bg-slate-50/50 border-slate-100" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="effective_to"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-semibold text-slate-600">Sampai Dengan</FormLabel>
                            <FormControl>
                            <Input type="date" {...field} disabled={isPending} className="bg-slate-50/50 border-slate-100" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-semibold text-slate-600">Status Aktif</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                            <FormControl>
                                <SelectTrigger className="bg-slate-50/50 border-slate-100">
                                <SelectValue placeholder="Pilih status" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Aktif">Aktif</SelectItem>
                                <SelectItem value="Non Aktif">Non Aktif</SelectItem>
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-50">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.back()}
                    disabled={isPending}
                    className="text-slate-500"
                >
                    Batal
                </Button>
                <Button type="submit" disabled={isPending} className="bg-rose-700 hover:bg-rose-800 shadow-sm shadow-rose-200 rounded-full px-8">
                    {isPending ? "Menyimpan..." : mode === "create" ? "Simpan Harga" : "Perbarui Harga"}
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
