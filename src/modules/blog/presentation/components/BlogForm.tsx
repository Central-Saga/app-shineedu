"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { toast } from "sonner";
import {
  createBlog,
  updateBlog,
  getBlog,
  uploadBlogAsset,
  deleteBlogAsset,
} from "../../infrastructure/blog.repository";
import type { Blog as BlogType, BlogAsset } from "../../domain/entities";

const formSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi").max(255),
  content: z.string().min(1, "Konten wajib diisi"),
  status: z.enum(["published", "draft"]),
  category: z.enum(["tips", "travel", "trips"], {
    errorMap: () => ({ message: "Kategori wajib dipilih" }),
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface BlogFormProps {
  initialData?: BlogType;
  isEdit?: boolean;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

function assetImageUrl(asset: BlogAsset): string {
  if (asset.file_url?.startsWith("http")) return asset.file_url;
  return `${API_BASE.replace(/\/api\/v2\/?$/, "")}/${asset.file_path}`.replace(/\/+/g, "/");
}

export function BlogForm({ initialData, isEdit = false }: BlogFormProps) {
  const router = useRouter();
  const [existingAssets, setExistingAssets] = useState<BlogAsset[]>(
    initialData?.assets ?? []
  );
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title ?? "",
      content: initialData?.content ?? "",
      status: (initialData?.status as "published" | "draft") ?? "draft",
      category: initialData?.category ?? "tips",
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      if (isEdit && initialData) {
        await updateBlog(initialData.id, {
          title: values.title,
          content: values.content,
          status: values.status,
          category: values.category,
        });
        toast.success("Blog berhasil diperbarui");
      } else {
        const blog = await createBlog({
          title: values.title,
          content: values.content,
          status: values.status,
          category: values.category,
        });
        toast.success("Blog berhasil ditambahkan");
        if (newFiles.length > 0 && blog.id) {
          setUploading(true);
          for (const file of newFiles) {
            await uploadBlogAsset(blog.id, { file });
          }
          setUploading(false);
          setNewFiles([]);
        }
        router.push("/blogs");
        return;
      }

      if (isEdit && initialData && newFiles.length > 0) {
        setUploading(true);
        for (const file of newFiles) {
          await uploadBlogAsset(initialData.id, { file });
        }
        setNewFiles([]);
        setUploading(false);
        const updated = await getBlog(initialData.id);
        const updatedBlog = await getBlog(initialData.id);
        setExistingAssets(updatedBlog.assets ?? []);
      }

      router.push("/blogs");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan");
    }
  }

  async function handleDeleteAsset(asset: BlogAsset) {
    if (!initialData) return;
    try {
      await deleteBlogAsset(initialData.id, asset.id);
      setExistingAssets((prev) => prev.filter((a) => a.id !== asset.id));
      toast.success("Gambar dihapus");
    } catch (e) {
      toast.error("Gagal menghapus gambar");
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files?.length) {
      setNewFiles((prev) => [...prev, ...Array.from(files)]);
    }
    e.target.value = "";
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{isEdit ? "Edit blog" : "Tambah blog"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Judul</FormLabel>
                  <FormControl>
                    <Input placeholder="Judul blog" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategori</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="tips">Tips</SelectItem>
                      <SelectItem value="travel">Travel</SelectItem>
                      <SelectItem value="trips">Trips</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Konten</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Konten blog..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <Label>Gambar blog (opsional)</Label>
              {isEdit && existingAssets.length > 0 && (
                <div className="flex flex-wrap gap-4 mt-2">
                  {existingAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className="relative w-24 h-24 rounded border overflow-hidden bg-muted group"
                    >
                      <img
                        src={assetImageUrl(asset)}
                        alt={asset.title ?? ""}
                        className="object-cover w-full h-full"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteAsset(asset)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                multiple
                onChange={onFileChange}
                className="block text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-primary-foreground"
              />
              {newFiles.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {newFiles.length} file akan diunggah setelah simpan.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting || uploading}
          >
            {form.formState.isSubmitting || uploading
              ? "Menyimpan..."
              : "Simpan"}
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
    </Form>
  );
}
