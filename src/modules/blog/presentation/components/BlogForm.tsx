"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Accordion defaultValue="info" className="w-full">
          <AccordionItem value="info">
            <AccordionTrigger description="Judul, status, kategori, dan ringkasan artikel">
              Informasi Artikel
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="space-y-2 lg:col-span-2">
                    <Label htmlFor="title">Judul <span className="text-red-500">*</span></Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Judul artikel blog"
                      required
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Gunakan judul yang jelas dan menarik
                    </p>
                  </div>
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
                    <p className="text-[11px] text-muted-foreground">
                      Draft belum tampil ke publik
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Kategori</Label>
                    <Input
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="Contoh: tips, travel"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Pisahkan dengan koma jika lebih dari satu
                    </p>
                  </div>
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
                  <p className="text-[11px] text-muted-foreground">
                    Maks. 5.000 karakter. {excerpt.length}/5000
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="media">
            <AccordionTrigger description="Gambar utama untuk thumbnail artikel">
              Gambar Utama
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPT_IMAGE}
                  onChange={handleImageChange}
                  className="hidden"
                />
                <div
                  className={`flex flex-col gap-4 rounded-xl border-2 border-dashed p-4 transition-colors ${
                    currentImageUrl
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
                          {currentImageUrl ? "Gambar utama terpasang" : "Upload gambar utama"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          JPG, PNG, GIF atau WebP. Maks. 5 MB.
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
                        {currentImageUrl ? "Ganti Gambar" : "Pilih Gambar"}
                      </Button>
                      {currentImageUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={clearImage}
                          className="w-full sm:w-auto text-destructive"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Hapus
                        </Button>
                      )}
                    </div>
                  </div>
                  {currentImageUrl && (
                    <div className="relative h-56 w-full overflow-hidden rounded-lg border bg-muted">
                      <Image
                        src={currentImageUrl}
                        alt="Preview"
                        fill
                        className="object-cover"
                        unoptimized
                        sizes="100vw"
                      />
                    </div>
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="content">
            <AccordionTrigger description="Isi lengkap artikel menggunakan rich text editor">
              Konten Artikel
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <Label htmlFor="content">Konten</Label>
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Tulis isi artikel di sini..."
                  className="min-h-[280px]"
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

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
      </form>
    </div>
  );
}
