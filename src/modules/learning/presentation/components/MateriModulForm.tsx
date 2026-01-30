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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { materiRepository } from "@/modules/learning/infrastructure/materi.repository";
import { listProgram, listJenjang } from "@/modules/catalog/infrastructure/catalog.repository";
import type { MateriModul } from "@/modules/learning/domain/entities";
import { Loader2 } from "lucide-react";

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
  const [programs, setPrograms] = useState<{ id: number; nama: string }[]>([]);
  const [jenjangs, setJenjangs] = useState<{ id: number; nama: string }[]>([]);

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
          listProgram({}),
          listJenjang({}),
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
        description: values.description || undefined,
        program_id: values.program_id ? Number(values.program_id) : undefined,
        jenjang_id: values.jenjang_id ? Number(values.jenjang_id) : undefined,
        is_active: values.is_active,
      };

      if (isEdit && initialData) {
        await materiRepository.update(initialData.id, payload);
        toast.success("Materi modul berhasil diperbarui");
      } else {
        const result = await materiRepository.create(payload);
        toast.success("Materi modul berhasil dibuat");
        router.push(`/dashboard/materi-modul/${result.id}/edit`);
        return;
      }
      router.push("/dashboard/materi-modul");
    } catch (error) {
      toast.error(isEdit ? "Gagal memperbarui materi modul" : "Gagal membuat materi modul");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Edit Materi Modul" : "Buat Materi Modul"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Judul *</FormLabel>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="program_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Program</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih program (opsional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {programs.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.nama}
                          </SelectItem>
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
                    <FormLabel>Jenjang</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jenjang (opsional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {jenjangs.map((j) => (
                          <SelectItem key={j.id} value={String(j.id)}>
                            {j.nama}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/materi-modul")}
              >
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? "Simpan Perubahan" : "Buat Modul"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
