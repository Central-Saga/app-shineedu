"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
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
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.image_url ? (initialData.image_url.startsWith("http") ? initialData.image_url : `${API_BASE.replace(/\/api\/v2\/?$/, "")}/${initialData.image_path}`.replace(/\/+/g, "/")) : null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    } else {
      setImageFile(null);
      if (!initialData?.image_url) setImagePreview(null);
      else setImagePreview(initialData.image_url.startsWith("http") ? initialData.image_url : `${API_BASE.replace(/\/api\/v2\/?$/, "")}/${initialData.image_path}`.replace(/\/+/g, "/"));
    }
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Edit item gallery" : "Tambah item gallery"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Judul / Alt teks</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="Contoh: Kegiatan Belajar"
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Gambar</Label>
            {!isEdit && (
              <p className="text-sm text-muted-foreground">Wajib diunggah (JPEG, PNG, GIF, WebP, max 5 MB)</p>
            )}
            {isEdit && (
              <p className="text-sm text-muted-foreground">Kosongkan jika tidak ingin mengganti gambar</p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={onFileChange}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-primary-foreground"
            />
            {imagePreview && (
              <div className="mt-2 relative w-48 h-48 rounded border overflow-hidden bg-muted">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="object-cover w-full h-full"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sort_order">Urutan (opsional)</Label>
            <Input
              id="sort_order"
              type="number"
              min={0}
              {...register("sort_order")}
              placeholder="0"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={(v) => setValue("is_active", v)}
            />
            <Label htmlFor="is_active">Tampilkan di gallery landing</Label>
          </div>
        </CardContent>
      </Card>

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
  );
}
