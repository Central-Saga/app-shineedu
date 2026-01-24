"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
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
      } catch (error: any) {
        if (error?.details) {
            Object.keys(error.details).forEach((key) => {
                form.setError(key as any, { message: error.details[key][0] });
            });
        }
      }
    });
  };

  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Accordion defaultValue="data-paket" className="w-full">
            <AccordionItem value="data-paket">
              <AccordionTrigger description="Informasi dasar dan tipe layanan bimbingan">
                Data Paket
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="kode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kode Paket</FormLabel>
                        <FormControl>
                          <Input placeholder="Contoh: REG_4X" {...field} disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nama"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Paket</FormLabel>
                        <FormControl>
                          <Input placeholder="Contoh: Reguler 4 Pertemuan" {...field} disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tipe"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipe Layanan</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih tipe" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="REGULER">Reguler (Grup Kecil)</SelectItem>
                            <SelectItem value="PRIVATE">Private (1 on 1)</SelectItem>
                            <SelectItem value="GROUP">Group (Grup Besar)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="parameter-sesi">
              <AccordionTrigger description="Pengaturan jumlah pertemuan dan durasi belajar">
                Parameter Sesi
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="pertemuan_per_bulan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sesi / Bulan</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="durasi_menit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Durasi (Menit)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="fitur-kebijakan">
              <AccordionTrigger description="Fitur tambahan dan kebijakan operasional paket">
                Fitur & Kebijakan
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="boleh_mix_mapel"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Campur Mapel</FormLabel>
                          <FormDescription className="text-[11px]">Siswa bisa pilih mapel berbeda tiap sesi</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isPending} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch("boleh_mix_mapel") && (
                    <FormField
                      control={form.control}
                      name="max_mapel"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4">
                          <div className="space-y-0.5 mr-4">
                            <FormLabel>Maks. Variasi Mapel</FormLabel>
                            <FormDescription className="text-[11px]">Limit jumlah mapel unik</FormDescription>
                          </div>
                          <FormControl>
                            <Input type="number" {...field} disabled={isPending} className="max-w-[80px]" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="bisa_tambah_pertemuan"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Add-on Sesi</FormLabel>
                          <FormDescription className="text-[11px]">Bisa beli sesi tambahan di luar paket</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isPending} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bisa_ganti_hari"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Reschedule</FormLabel>
                          <FormDescription className="text-[11px]">Bisa ganti jadwal hari sendiri</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isPending} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="status-panel">
              <AccordionTrigger description="Aktifkan atau nonaktifkan paket ini">
                Status Operasional
              </AccordionTrigger>
              <AccordionContent>
                <div className="max-w-md">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pilih Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                          <FormControl>
                            <SelectTrigger>
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
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex items-center gap-3 pt-4">
            <Button type="submit" size="lg" disabled={isPending} className="px-8 font-bold text-white">
              {isPending ? "Menyimpan…" : mode === "create" ? "Simpan Paket" : "Simpan Perubahan"}
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={() => router.back()} disabled={isPending}>
              Batal
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
