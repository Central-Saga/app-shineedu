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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { programSchema, type ProgramFormValues } from "../schemas";
import { createProgram, updateProgram, uploadProgramImage } from "@/modules/catalog/infrastructure/catalog.repository";
import type { Program, Jenjang } from "@/modules/catalog/domain/entities";
import { useTransition, useState } from "react";
import Image from "next/image";
import { ImageIcon, Loader2, X } from "lucide-react";

interface ProgramFormProps {
  initialData?: Program;
  jenjangOptions: Jenjang[];
  mode: "create" | "edit";
}

export function ProgramForm({ initialData, jenjangOptions, mode }: ProgramFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const form = useForm<ProgramFormValues>({
    resolver: zodResolver(programSchema) as any,
    defaultValues: {
      kode: initialData?.kode || "",
      nama: initialData?.nama || "",
      deskripsi: initialData?.deskripsi || "",
      image: initialData?.image ?? undefined,
      status: (initialData?.status as "Aktif" | "Non Aktif") || "Aktif",
      is_highlight: initialData?.is_highlight ?? false,
      jenjang_ids: initialData?.jenjangs?.map(j => j.id) || [],
    },
  });

  const onSubmit = (values: ProgramFormValues) => {
    startTransition(async () => {
      try {
        const payload = { ...values, image: values.image || undefined };
        if (mode === "edit" && initialData) {
          await updateProgram(initialData.id, payload);
          toast.success("Program berhasil diperbarui");
        } else {
          await createProgram(payload);
          toast.success("Program berhasil ditambahkan");
        }
        router.push("/dashboard/catalog/program");
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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const { path, image_url } = await uploadProgramImage(file);
      form.setValue("image", path);
      setUploadPreviewUrl(image_url);
      toast.success("Gambar diunggah");
    } catch {
      toast.error("Gagal mengunggah gambar");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const imageValue = form.watch("image");
  const previewUrl = uploadPreviewUrl || (imageValue && (imageValue.startsWith("http") ? imageValue : null));

  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Accordion defaultValue="data-program" className="w-full">
            <AccordionItem value="data-program">
              <AccordionTrigger description="Informasi dasar dan deskripsi program mata pelajaran">
                Data Program
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="kode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kode Program</FormLabel>
                          <FormControl>
                            <Input placeholder="Contoh: MATH" {...field} disabled={isPending} />
                          </FormControl>
                          <FormDescription className="text-[11px]">Kode unik referensi program</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nama"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Program</FormLabel>
                          <FormControl>
                            <Input placeholder="Contoh: Matematika" {...field} disabled={isPending} />
                          </FormControl>
                          <FormDescription className="text-[11px]">Nama lengkap mata pelajaran</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="deskripsi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deskripsi</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Berikan deskripsi singkat mengenai program ini..." 
                            {...field} 
                            disabled={isPending} 
                            className="min-h-[100px]" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gambar katalog (landing)</FormLabel>
                        <FormDescription className="text-[11px]">
                          Gambar untuk katalog program di halaman landing. Maks. 5 MB (JPG, PNG, GIF, WebP).
                        </FormDescription>
                        <div className="flex flex-col gap-3">
                          {previewUrl ? (
                            <div className="relative inline-block w-40 h-28 rounded-lg overflow-hidden border bg-muted">
                              <Image
                                src={previewUrl}
                                alt="Preview"
                                fill
                                className="object-cover"
                                unoptimized={previewUrl.startsWith("http")}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  form.setValue("image", undefined);
                                  setUploadPreviewUrl(null);
                                }}
                                className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                                aria-label="Hapus gambar"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 rounded-xl border border-dashed p-4 bg-slate-50/50 w-64">
                              <ImageIcon className="h-8 w-8 text-muted-foreground shrink-0" />
                              <span className="text-sm text-muted-foreground">Belum ada gambar</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Input
                              type="file"
                              accept="image/jpeg,image/png,image/gif,image/webp"
                              onChange={handleImageChange}
                              disabled={uploadingImage || isPending}
                              className="cursor-pointer max-w-xs"
                            />
                            {uploadingImage && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="akses-jenjang">
              <AccordionTrigger description="Tentukan jenjang pendidikan yang dapat mengambil program ini">
                Akses Jenjang Pendidikan
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="jenjang_ids"
                    render={() => (
                      <FormItem>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {jenjangOptions.map((jenjang) => (
                            <FormField
                              key={jenjang.id}
                              control={form.control}
                              name="jenjang_ids"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={jenjang.id}
                                    className="flex flex-row items-start space-x-3 space-y-0 p-3 rounded-xl border bg-slate-50/30"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(jenjang.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, jenjang.id])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value: number) => value !== jenjang.id
                                                )
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-medium cursor-pointer">
                                      {jenjang.nama}
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="status-panel">
              <AccordionTrigger description="Tentukan apakah program ini aktif digunakan dan tampil di landing">
                Status Operasional
              </AccordionTrigger>
              <AccordionContent>
                <div className="max-w-md space-y-6">
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

                  <FormField
                    control={form.control}
                    name="is_highlight"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 rounded-xl border px-4 py-3 bg-slate-50/50">
                            <FormControl>
                              <Switch
                                id="is_highlight"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={isPending}
                              />
                            </FormControl>
                            <span className="text-sm font-medium">
                              {field.value ? "Tampil di landing (Program Unggulan)" : "Tidak tampil di landing"}
                            </span>
                          </div>
                        </div>
                        <FormDescription className="text-xs text-muted-foreground max-w-sm">
                          Nyalakan agar program ini muncul di bagian &quot;Program Unggulan Kami&quot; pada halaman utama website landing.
                        </FormDescription>
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
              {isPending ? "Menyimpan…" : mode === "create" ? "Simpan Program" : "Simpan Perubahan"}
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
