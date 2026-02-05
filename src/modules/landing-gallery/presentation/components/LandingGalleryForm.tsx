"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import { ImagePlus, X } from "lucide-react";
import {
  createLandingGalleryItem,
  updateLandingGalleryItem,
} from "../../infrastructure/landing-gallery.repository";
import type { LandingGalleryItem as LandingGalleryItemType } from "../../domain/entities";

const formSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi").max(255),
  sort_order: z.union([z.string(), z.number()]).optional().nullable(),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface LandingGalleryFormProps {
  initialData?: LandingGalleryItemType;
  isEdit?: boolean;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export function LandingGalleryForm({ initialData, isEdit = false }: LandingGalleryFormProps) {
  const router = useRouter();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialImageUrl = initialData?.image_url
    ? (initialData.image_url.startsWith("http")
        ? initialData.image_url
        : `${API_BASE.replace(/\/api\/v2\/?$/, "")}/${initialData.image_path}`.replace(/\/+/g, "/"))
    : null;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title ?? "",
      sort_order: initialData?.sort_order ?? "",
      is_active: initialData?.is_active ?? true,
    },
  });

  const isActive = watch("is_active");

  useEffect(() => {
    setImagePreview(initialImageUrl);
  }, [initialImageUrl]);

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    } else {
      setImageFile(null);
      setImagePreview(initialImageUrl);
    }
  }

  function clearImageSelection() {
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(initialImageUrl);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function onSubmit(values: FormValues) {
    try {
      const sortOrder = values.sort_order === "" || values.sort_order == null ? null : Number(values.sort_order);
      if (isEdit && initialData) {
        const payload: { title?: string; image?: File; sort_order?: number | null; is_active?: boolean } = {
          title: values.title,
          sort_order: sortOrder,
          is_active: values.is_active,
        };
        if (imageFile) payload.image = imageFile;
        await updateLandingGalleryItem(initialData.id, payload);
        toast.success("Item gallery diperbarui");
      } else {
        if (!imageFile) {
          toast.error("Gambar wajib diunggah");
          return;
        }
        await createLandingGalleryItem({
          title: values.title,
          image: imageFile,
          sort_order: sortOrder,
          is_active: values.is_active,
        });
        toast.success("Item gallery ditambahkan");
      }
      router.push("/gallery-landing");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan");
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Accordion defaultValue="info" className="w-full">
          <AccordionItem value="info">
            <AccordionTrigger description="Judul, urutan, dan status tampilan">
              Informasi Item
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Judul / Alt teks <span className="text-red-500">*</span></Label>
                  <Input
                    id="title"
                    {...register("title")}
                    placeholder="Contoh: Kegiatan Belajar"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Ditampilkan sebagai alt text pada gambar
                  </p>
                  {errors.title && (
                    <p className="text-sm text-destructive">{errors.title.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sort_order">Urutan (opsional)</Label>
                    <Input
                      id="sort_order"
                      type="number"
                      min={0}
                      {...register("sort_order")}
                      placeholder="0"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Semakin kecil akan tampil lebih awal
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      id="is_active"
                      checked={isActive}
                      onCheckedChange={(v) => setValue("is_active", v)}
                    />
                    <div>
                      <Label htmlFor="is_active">Tampilkan di gallery landing</Label>
                      <p className="text-[11px] text-muted-foreground">
                        Nonaktifkan untuk menyembunyikan item
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="media">
            <AccordionTrigger description="Upload gambar untuk tampil di landing">
              Gambar
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={onFileChange}
                  className="hidden"
                />
                <div
                  className={`flex flex-col gap-4 rounded-xl border-2 border-dashed p-4 transition-colors ${
                    imagePreview
                      ? "border-primary/40 bg-primary/5"
                      : "border-muted-foreground/25 hover:bg-muted/40"
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                        <ImagePlus className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {imagePreview ? "Gambar terpasang" : "Upload gambar gallery"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isEdit
                            ? "Kosongkan jika tidak ingin mengganti gambar"
                            : "Wajib diunggah (JPEG, PNG, GIF, WebP, max 5 MB)"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full sm:w-auto"
                      >
                        {imagePreview ? "Ganti Gambar" : "Pilih Gambar"}
                      </Button>
                      {imagePreview && imageFile && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={clearImageSelection}
                          className="w-full sm:w-auto text-destructive"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Batalkan
                        </Button>
                      )}
                    </div>
                  </div>
                  {imagePreview && (
                    <div className="relative h-56 w-full overflow-hidden rounded-lg border bg-muted">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan..." : "Simpan"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/gallery-landing")}
          >
            Batal
          </Button>
        </div>
      </form>
    </div>
  );
}
