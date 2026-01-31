"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ImagePlus, X } from "lucide-react";
import {
  createBlogPost,
  updateBlogPost,
} from "../../infrastructure/blog.repository";
import type { BlogPost } from "../../domain/entities";
import { ValidationError } from "@/shared/infrastructure/api/errors";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
];

const ACCEPT_IMAGE = "image/jpeg,image/png,image/jpg,image/gif,image/webp";

interface BlogFormProps {
  initialData?: BlogPost | null;
  isEdit?: boolean;
}

export function BlogForm({ initialData, isEdit = false }: BlogFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [category, setCategory] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title ?? "");
      setContent(initialData.content ?? "");
      setExcerpt(initialData.excerpt ?? "");
      setStatus((initialData.status as "draft" | "published") ?? "draft");
      setCategory(initialData.category ?? "");
    }
  }, [initialData]);

  const currentImageUrl =
    imagePreview ??
    (removeImage ? null : (initialData?.featured_image_url?.trim() ? initialData.featured_image_url : null));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setRemoveImage(false);
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Judul artikel wajib diisi");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        content: content.trim() || undefined,
        excerpt: excerpt.trim() || undefined,
        status,
        category: category.trim() || undefined,
      };
      if (isEdit && initialData?.id) {
        await updateBlogPost(initialData.id, payload, imageFile ?? undefined, removeImage);
        toast.success("Artikel blog berhasil diperbarui");
      } else {
        await createBlogPost(payload, imageFile ?? undefined);
        toast.success("Artikel blog berhasil dibuat");
      }
      router.push("/blogs");
    } catch (err) {
      if (err instanceof ValidationError && err.validationErrors && Object.keys(err.validationErrors).length > 0) {
        const [field, messages] = Object.entries(err.validationErrors)[0];
        const msg = Array.isArray(messages) ? messages[0] : (messages as { message?: string })?.message;
        const fieldLabel: Record<string, string> = {
          title: "Judul",
          content: "Konten",
          excerpt: "Deskripsi/Ringkasan",
          status: "Status",
          category: "Kategori",
          image: "Gambar",
        };
        const label = fieldLabel[field] ?? field;
        toast.error(`${label}: ${msg ?? err.message}`);
      } else {
        toast.error(err instanceof Error ? err.message : "Gagal menyimpan artikel");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-base">Informasi Artikel</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Judul *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Judul artikel blog"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Gambar Utama</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT_IMAGE}
                onChange={handleImageChange}
                className="hidden"
              />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImagePlus className="mr-2 h-4 w-4" />
                    Pilih Gambar
                  </Button>
                  {currentImageUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearImage}
                      className="text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {currentImageUrl && (
                  <div className="relative h-40 w-64 overflow-hidden rounded-lg border bg-muted">
                    <Image
                      src={currentImageUrl}
                      alt="Preview"
                      fill
                      className="object-cover"
                      unoptimized
                      sizes="256px"
                    />
                  </div>
                )}
              </div>
              <p className="text-muted-foreground text-xs">
                JPG, PNG, GIF atau WebP. Maks. 5 MB.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="excerpt">Deskripsi / Ringkasan (Excerpt)</Label>
              <Textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Ringkasan singkat artikel untuk tampilan card/list (deskripsi)..."
                rows={3}
                maxLength={5000}
              />
              <p className="text-muted-foreground text-xs">
                Maks. 5.000 karakter. {excerpt.length}/5000
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as "draft" | "published")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Contoh: tips, travel"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Konten</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Isi artikel (HTML atau teks)..."
                rows={12}
                className="font-mono text-sm"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Buat Artikel"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/blogs")}
          >
            Batal
          </Button>
        </div>
      </div>
    </form>
  );
}
