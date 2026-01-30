"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { materiRepository } from "@/modules/learning/infrastructure/materi.repository";
import type { MateriModulItem } from "@/modules/learning/domain/entities";
import { toast } from "sonner";
import { Loader2, Upload, Link as LinkIcon } from "lucide-react";

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/zip",
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const formSchema = z.object({
  type: z.enum(["FILE", "URL"]),
  title: z.string().min(1, "Judul wajib diisi"),
  url: z.string().optional(),
  file: z.any().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface MateriItemFormProps {
  modulId: number;
  item?: MateriModulItem;
  onSave: () => void;
  onCancel: () => void;
}

export function MateriItemForm({ modulId, item, onSave, onCancel }: MateriItemFormProps) {
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: item?.type || "FILE",
      title: item?.title || "",
      url: item?.url || "",
    },
  });

  const watchType = form.watch("type");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error("Tipe file tidak didukung");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Ukuran file maksimal 50MB");
      return;
    }

    setSelectedFile(file);
    form.setValue("file", file);
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      if (values.type === "FILE" && !item && !selectedFile) {
        toast.error("Pilih file terlebih dahulu");
        setLoading(false);
        return;
      }

      if (values.type === "URL" && !values.url) {
        toast.error("URL wajib diisi");
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("type", values.type);
      formData.append("title", values.title);

      if (values.type === "URL" && values.url) {
        formData.append("url", values.url);
      }

      if (values.type === "FILE" && selectedFile) {
        formData.append("file", selectedFile);
      }

      if (item) {
        await materiRepository.updateItem(item.id, formData);
        toast.success("Item berhasil diperbarui");
      } else {
        await materiRepository.addItem(modulId, formData);
        toast.success("Item berhasil ditambahkan");
      }

      onSave();
    } catch (error: any) {
      console.error("Error saving item:", error);
      toast.error(error.message || "Gagal menyimpan item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipe Item</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!item}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tipe" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="FILE">File Upload</SelectItem>
                  <SelectItem value="URL">URL/Link</SelectItem>
                </SelectContent>
              </Select>
              {item && (
                <FormDescription>
                  Tipe tidak dapat diubah setelah dibuat
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Judul <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input placeholder="Contoh: Modul Bab 1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {watchType === "URL" && (
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <div className="flex items-center gap-2">
                    <LinkIcon className="size-4 text-muted-foreground" />
                    <Input 
                      type="url" 
                      placeholder="https://example.com/video" 
                      {...field} 
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  Link ke video, artikel, atau resource online lainnya
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {watchType === "FILE" && (
          <div className="space-y-2">
            <FormLabel>File <span className="text-red-500">*</span></FormLabel>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("file-upload")?.click()}
                className="w-full"
              >
                <Upload className="size-4 mr-2" />
                {selectedFile ? selectedFile.name : item?.file_path ? "Ganti File" : "Pilih File"}
              </Button>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.zip"
                onChange={handleFileChange}
              />
            </div>
            {item?.file_path && !selectedFile && (
              <p className="text-xs text-muted-foreground">
                File saat ini: {item.file_path.split('/').pop()}
              </p>
            )}
            <FormDescription>
              Format: PDF, Word, Excel, PowerPoint, Gambar, ZIP (Max 50MB)
            </FormDescription>
          </div>
        )}

        <div className="flex items-center gap-3 pt-4">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {item ? "Simpan Perubahan" : "Tambah Item"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Batal
          </Button>
        </div>
      </form>
    </Form>
  );
}
