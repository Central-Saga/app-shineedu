"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { materiRepository } from "@/modules/learning/infrastructure/materi.repository";
import { listProgram, listJenjang } from "@/modules/catalog/infrastructure/catalog.repository";
import type { MateriModul } from "@/modules/learning/domain/entities";
import { Loader2 } from "lucide-react";
import type { Program, Jenjang } from "@/modules/catalog/domain/entities";

const formSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi"),
  description: z.string().optional(),
  program_id: z.string().optional(),
  jenjang_id: z.string().optional(),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface MateriModulFormProps {
  initialData?: MateriModul;
  isEdit?: boolean;
}

export function MateriModulForm({ initialData, isEdit = false }: MateriModulFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [jenjangs, setJenjangs] = useState<Jenjang[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      program_id: initialData?.program_id ? String(initialData.program_id) : "",
      jenjang_id: initialData?.jenjang_id ? String(initialData.jenjang_id) : "",
      is_active: initialData?.is_active ?? true,
    },
  });

  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [programRes, jenjangRes] = await Promise.all([
          listProgram({ per_page: 999 }),
          listJenjang({ per_page: 999 }),
        ]);
        setPrograms(programRes.items || []);
        setJenjangs(jenjangRes.items || []);
      } catch {
        console.error("Failed to load catalogs");
      }
    };
    loadCatalogs();
  }, []);

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const payload = {
        title: values.title,
        description: values.description || "",
        program_id: values.program_id ? Number(values.program_id) : undefined,
        jenjang_id: values.jenjang_id ? Number(values.jenjang_id) : undefined,
        is_active: values.is_active,
      };

      if (isEdit && initialData) {
        await materiRepository.update(initialData.id, payload);
        toast.success("Modul berhasil diperbarui");
      } else {
        await materiRepository.create(payload);
        toast.success("Modul berhasil dibuat");
      }

      router.push("/dashboard/materi-modul");
      router.refresh();
    } catch {
      toast.error("Gagal menyimpan modul");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Accordion defaultValue="informasi-utama" className="w-full">
          
          {/* Informasi Utama */}
          <AccordionItem value="informasi-utama">
            <AccordionTrigger description="Informasi dasar mengenai modul pembelajaran">
              Informasi Utama
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Judul <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Modul Matematika Dasar" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deskripsi</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Deskripsi singkat tentang modul ini..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Katalog */}
          <AccordionItem value="katalog">
            <AccordionTrigger description="Pengaturan Program dan Jenjang (opsional)">
              Katalog
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="program_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Program</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={programs.map((p) => ({ value: String(p.id), label: p.nama }))}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Pilih program (opsional)"
                          searchPlaceholder="Cari program..."
                          emptyText="Program tidak ditemukan"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="jenjang_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jenjang</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={jenjangs.map((j) => ({ value: String(j.id), label: j.nama }))}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Pilih jenjang (opsional)"
                          searchPlaceholder="Cari jenjang..."
                          emptyText="Jenjang tidak ditemukan"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Status */}
          {isEdit ? (
            <AccordionItem value="status">
              <AccordionTrigger description="Pengaturan status aktif/nonaktif modul">
                Status
              </AccordionTrigger>
              <AccordionContent>
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Aktif</FormLabel>
                        <FormDescription>
                          Modul yang tidak aktif tidak akan ditampilkan kepada murid
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </AccordionContent>
            </AccordionItem>
          ) : (
            <AccordionItem value="status">
              <AccordionTrigger description="Status modul baru">
                Status
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-2">
                  <FormLabel>Status</FormLabel>
                  <div className="flex items-center gap-2 rounded-xl border px-4 py-2.5 bg-slate-50/50 cursor-not-allowed opacity-70">
                    <div className="size-2.5 rounded-full bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20" />
                    <span className="text-sm font-medium">Status: Aktif</span>
                  </div>
                  <p className="text-[0.8rem] text-muted-foreground">
                    Modul baru secara otomatis berstatus <strong>Aktif</strong>.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>

        <div className="flex items-center gap-3 pt-6">
          <Button type="submit" size="lg" disabled={loading} className="px-8">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Simpan Perubahan" : "Buat Modul"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.push("/dashboard/materi-modul")}
            disabled={loading}
          >
            Batal
          </Button>
        </div>
      </form>
    </Form>
  );
}
