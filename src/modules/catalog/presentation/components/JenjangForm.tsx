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
import { jenjangSchema, type JenjangFormValues } from "../schemas";
import { createJenjang, updateJenjang } from "@/modules/catalog/infrastructure/catalog.repository";
import type { Jenjang } from "@/modules/catalog/domain/entities";
import { useTransition } from "react";

interface JenjangFormProps {
  initialData?: Jenjang;
  mode: "create" | "edit";
}

export function JenjangForm({ initialData, mode }: JenjangFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<JenjangFormValues>({
    resolver: zodResolver(jenjangSchema),
    defaultValues: {
      kode: initialData?.kode || "",
      nama: initialData?.nama || "",
      status: (initialData?.status as "Aktif" | "Non Aktif") || "Aktif",
    },
  });

  const onSubmit = (values: JenjangFormValues) => {
    startTransition(async () => {
      try {
        if (mode === "edit" && initialData) {
          await updateJenjang(initialData.id, values);
          toast.success("Jenjang berhasil diperbarui");
        } else {
          await createJenjang(values);
          toast.success("Jenjang berhasil ditambahkan");
        }
        router.push("/dashboard/catalog/jenjang");
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
          <Accordion defaultValue="data-jenjang" className="w-full">
            <AccordionItem value="data-jenjang">
              <AccordionTrigger description="Informasi dasar klasifikasi tingkatan pendidikan (Contoh: SD, SMP, SMA)">
                Data Jenjang
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="kode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kode Jenjang</FormLabel>
                        <FormControl>
                          <Input placeholder="Contoh: SD" {...field} disabled={isPending} />
                        </FormControl>
                        <FormDescription className="text-[11px]">Singkatan unik untuk jenjang ini</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nama"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Lengkap</FormLabel>
                        <FormControl>
                          <Input placeholder="Contoh: Sekolah Dasar" {...field} disabled={isPending} />
                        </FormControl>
                        <FormDescription className="text-[11px]">Nama resmi tingkatan pendidikan</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="status-panel">
              <AccordionTrigger description="Tentukan apakah jenjang ini aktif digunakan dalam sistem">
                Status Operasional
              </AccordionTrigger>
              <AccordionContent>
                <div className="max-w-md">
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
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex items-center gap-3 pt-4">
            <Button type="submit" size="lg" disabled={isPending} className="px-8 font-bold text-white">
              {isPending ? "Menyimpan…" : mode === "create" ? "Simpan Jenjang" : "Simpan Perubahan"}
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
