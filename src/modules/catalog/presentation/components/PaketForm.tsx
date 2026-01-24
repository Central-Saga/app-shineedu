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
import { Switch } from "@/components/ui/switch";
import { paketSchema, type PaketFormValues } from "../schemas";
import { createPaket, updatePaket } from "@/modules/catalog/infrastructure/catalog.repository";
import type { Paket } from "@/modules/catalog/domain/entities";
import { useTransition } from "react";
import { Settings2 } from "lucide-react";

interface PaketFormProps {
  initialData?: Paket;
  mode: "create" | "edit";
}

export function PaketForm({ initialData, mode }: PaketFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<PaketFormValues>({
    resolver: zodResolver(paketSchema) as any,
    defaultValues: {
      kode: initialData?.kode || "",
      nama: initialData?.nama || "",
      tipe: initialData?.tipe || "REGULER",
      pertemuan_per_bulan: initialData?.pertemuan_per_bulan || 0,
      durasi_menit: initialData?.durasi_menit || 90,
      boleh_mix_mapel: initialData?.boleh_mix_mapel || false,
      max_mapel: initialData?.max_mapel || 1,
      bisa_tambah_pertemuan: initialData?.bisa_tambah_pertemuan || false,
      bisa_ganti_hari: initialData?.bisa_ganti_hari || false,
      status: (initialData?.status as "Aktif" | "Non Aktif") || "Aktif",
    },
  });

  const onSubmit = (values: PaketFormValues) => {
    startTransition(async () => {
      try {
        if (mode === "edit" && initialData) {
          await updatePaket(initialData.id, values);
          toast.success("Paket berhasil diperbarui");
        } else {
          await createPaket(values);
          toast.success("Paket berhasil ditambahkan");
        }
        router.push("/dashboard/catalog/paket");
        router.refresh();
      } catch (error: unknown) {
        const err = error as { details?: Record<string, string[]> };
        if (err?.details) {
            Object.keys(err.details).forEach((key) => {
                form.setError(key as any, { message: (err.details as any)[key][0] });
            });
        }
      }
    });
  };

  return (
    <Card className="border-none shadow-premium ring-1 ring-slate-100 rounded-2xl overflow-hidden py-0">
      <CardHeader className="border-b border-slate-50 bg-slate-50/30 pb-4">
        <CardTitle className="text-lg font-bold text-slate-800">
          {mode === "create" ? "Buat Paket Bimbingan" : `Edit Paket: ${initialData?.kode}`}
        </CardTitle>
        <CardDescription>
          Tentukan parameter sesi, durasi, dan fitur yang tersedia dalam paket ini.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <FormField
                control={form.control}
                name="kode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-tight text-slate-700">Kode Paket</FormLabel>
                    <FormControl>
                      <Input placeholder="REG_4X" {...field} disabled={isPending} className="bg-slate-50/50" />
                    </FormControl>
                    <FormDescription className="text-[10px]">Kode identifikasi paket.</FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nama"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-tight text-slate-700">Nama Paket</FormLabel>
                    <FormControl>
                      <Input placeholder="Reguler 4 Pertemuan" {...field} disabled={isPending} className="bg-slate-50/50" />
                    </FormControl>
                    <FormDescription className="text-[10px]">Nama tampilan paket untuk admin & siswa.</FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="tipe"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-tight text-slate-700">Tipe Layanan</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                      <FormControl>
                        <SelectTrigger className="bg-slate-50/50">
                          <SelectValue placeholder="Pilih tipe" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="REGULER">Reguler (Grup Kecil)</SelectItem>
                        <SelectItem value="PRIVATE">Private (1 on 1)</SelectItem>
                        <SelectItem value="GROUP">Group (Grup Besar)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="pertemuan_per_bulan"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-tight text-slate-700">Sesi / Bulan</FormLabel>
                        <FormControl>
                        <Input type="number" {...field} disabled={isPending} className="bg-slate-50/50" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="durasi_menit"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-tight text-slate-700">Durasi (Menit)</FormLabel>
                        <FormControl>
                        <Input type="number" {...field} disabled={isPending} className="bg-slate-50/50" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                    )}
                />
              </div>

              <div className="md:col-span-2 space-y-4 pt-2">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-1 bg-rose-50 rounded text-rose-600">
                        <Settings2 className="size-3.5" />
                    </div>
                    <Label className="text-xs font-bold uppercase tracking-tight text-slate-700">Fitur & Kebijakan Paket</Label>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="boleh_mix_mapel"
                        render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-xl border border-slate-100 bg-slate-50/30 p-4 shadow-sm">
                            <div className="space-y-0.5">
                                <FormLabel className="text-sm font-semibold text-slate-700">Campur Mapel</FormLabel>
                                <FormDescription className="text-[10px]">
                                    Siswa bisa pilih mapel berbeda tiap sesi
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={isPending}
                                />
                            </FormControl>
                        </FormItem>
                        )}
                    />

                    {form.watch("boleh_mix_mapel") && (
                        <FormField
                            control={form.control}
                            name="max_mapel"
                            render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-xl border border-rose-100 bg-rose-50/10 p-4 shadow-sm animate-in fade-in slide-in-from-top-1">
                                <div className="space-y-0.5 whitespace-nowrap mr-4">
                                    <FormLabel className="text-sm font-semibold text-rose-800">Maks. Variasi Mapel</FormLabel>
                                    <FormDescription className="text-[10px] text-rose-600">
                                        Limit jumlah mapel unik
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Input type="number" {...field} disabled={isPending} className="max-w-[80px] h-9 text-center bg-white border-rose-200" />
                                </FormControl>
                                <FormMessage className="text-xs" />
                            </FormItem>
                            )}
                        />
                    )}

                    <FormField
                        control={form.control}
                        name="bisa_tambah_pertemuan"
                        render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-xl border border-slate-100 bg-slate-50/30 p-4 shadow-sm">
                            <div className="space-y-0.5">
                                <FormLabel className="text-sm font-semibold text-slate-700">Add-on Sesi</FormLabel>
                                <FormDescription className="text-[10px]">
                                    Bisa beli sesi tambahan di luar paket
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={isPending}
                                />
                            </FormControl>
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="bisa_ganti_hari"
                        render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-xl border border-slate-100 bg-slate-50/30 p-4 shadow-sm">
                            <div className="space-y-0.5">
                                <FormLabel className="text-sm font-semibold text-slate-700">Reschedule</FormLabel>
                                <FormDescription className="text-[10px]">
                                    Bisa ganti jadwal hari sendiri
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={isPending}
                                />
                            </FormControl>
                        </FormItem>
                        )}
                    />
                </div>
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-tight text-slate-700">Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                      <FormControl>
                        <SelectTrigger className="bg-slate-50/50">
                          <SelectValue placeholder="Pilih status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Aktif">Aktif</SelectItem>
                        <SelectItem value="Non Aktif">Non Aktif</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
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
                    {isPending ? "Menyimpan..." : mode === "create" ? "Simpan Paket" : "Perbarui Paket"}
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
