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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { paketHargaSchema, type PaketHargaFormValues } from "../schemas";
import type { PaketHarga, Program, Jenjang, Paket } from "@/modules/catalog/domain/entities";
import { createPaketHarga, updatePaketHarga } from "@/modules/catalog/infrastructure/catalog.repository";
import { useTransition } from "react";

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
          <Accordion defaultValue="relasi-katalog" className="w-full">
            <AccordionItem value="relasi-katalog">
              <AccordionTrigger description="Tentukan kombinasi program, jenjang, dan paket">
                Relasi Katalog
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="program_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Program Pelajaran</FormLabel>
                        <Select 
                          onValueChange={(v) => field.onChange(Number(v))} 
                          defaultValue={field.value ? String(field.value) : ""} 
                          disabled={isPending}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih program" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {programs.map(p => (
                              <SelectItem key={p.id} value={String(p.id)}>{p.nama}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="jenjang_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jenjang Pendidikan</FormLabel>
                        <Select 
                          onValueChange={(v) => field.onChange(Number(v))} 
                          defaultValue={field.value ? String(field.value) : ""} 
                          disabled={isPending}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih jenjang" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {jenjangs.map(j => (
                              <SelectItem key={j.id} value={String(j.id)}>{j.nama}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paket_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Varian Paket</FormLabel>
                        <Select 
                          onValueChange={(v) => field.onChange(Number(v))} 
                          defaultValue={field.value ? String(field.value) : ""} 
                          disabled={isPending}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih paket" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {pakets.map(p => (
                              <SelectItem key={p.id} value={String(p.id)}>{p.nama}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="kapasitas-biaya">
              <AccordionTrigger description="Pengaturan range jumlah siswa dan biaya investasi">
                Kapasitas & Biaya
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="min_siswa"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimal Siswa</FormLabel>
                          <FormControl>
                            <Input type="number" min={1} {...field} disabled={isPending} />
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
                          <FormLabel>Maksimal Siswa</FormLabel>
                          <FormControl>
                            <Input type="number" min={1} {...field} disabled={isPending} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="harga"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Harga per Bulan (IDR)</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} {...field} disabled={isPending} className="font-bold border-emerald-100" />
                        </FormControl>
                        <FormDescription className="text-[11px]">Harga yang akan ditagihkan ke siswa</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="masa-berlaku">
              <AccordionTrigger description="Tentukan kapan harga ini mulai berlaku dan statusnya">
                Masa Berlaku & Status
              </AccordionTrigger>
              <AccordionContent>
                {mode === "create" ? (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 rounded-xl border px-4 py-3 bg-slate-50/50 cursor-not-allowed opacity-70">
                      <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-sm font-medium">Status: Aktif</span>
                    </div>
                    <p className="text-xs text-muted-foreground max-w-xs">
                      Data baru secara otomatis berstatus <strong>Aktif</strong>. Gunakan halaman edit untuk merubah status di masa mendatang.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="effective_from"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Berlaku Mulai</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} disabled={isPending} />
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
                          <FormLabel>Sampai Dengan</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} disabled={isPending} />
                          </FormControl>
                          <FormDescription className="text-[11px]">Kosongkan jika tidak ada batas</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status Aktif</FormLabel>
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
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex items-center gap-3 pt-4">
            <Button type="submit" size="lg" disabled={isPending} className="px-8 font-bold text-white">
              {isPending ? "Menyimpan…" : mode === "create" ? "Simpan Harga" : "Simpan Perubahan"}
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
