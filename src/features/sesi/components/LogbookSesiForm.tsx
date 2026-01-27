"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { logbookSesiSchema } from "@/features/sesi/schemas";
import { sesiApi } from "@/features/sesi/api/sesi.api";
import { LogbookSesi, Sesi } from "@/features/sesi/types";

interface LogbookSesiFormProps {
  sesi: Sesi;
  logbook: LogbookSesi;
  canEdit: boolean;
  onSuccess?: () => void;
}

export function LogbookSesiForm({ sesi, logbook, canEdit, onSuccess }: LogbookSesiFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof logbookSesiSchema>>({
    resolver: zodResolver(logbookSesiSchema),
    defaultValues: {
      ringkasan: logbook.ringkasan || "",
      materi: logbook.materi || "",
      homework: logbook.homework || "",
      catatan_pengajar: logbook.catatan_pengajar || "",
    },
  });

  // Reset form when logbook data from API changes
  useEffect(() => {
    form.reset({
      ringkasan: logbook.ringkasan || "",
      materi: logbook.materi || "",
      homework: logbook.homework || "",
      catatan_pengajar: logbook.catatan_pengajar || "",
    } as Parameters<typeof form.reset>[0]);
  }, [logbook, form]);

  async function onSubmit(values: z.infer<typeof logbookSesiSchema>) {
    if (!canEdit) return;
    try {
      setIsSubmitting(true);
      await sesiApi.updateLogbook(sesi.id, { ...values, sesi_id: sesi.id });
      toast.success("Logbook berhasil disimpan");
      if (onSuccess) {
          onSuccess();
      } else {
          router.refresh();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menyimpan logbook";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-2">
                <FormField
                    control={form.control}
                    name="ringkasan"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel className="text-sm font-bold text-slate-700">Ringkasan Kegiatan</FormLabel>
                            <FormControl>
                                <RichTextEditor 
                                    value={field.value || ""} 
                                    onChange={field.onChange}
                                    placeholder="Jelaskan ringkasan kegiatan belajar mengajar..." 
                                    disabled={!canEdit}
                                    className="min-h-[180px]"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="materi"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel className="text-sm font-bold text-slate-700">Materi yang Disampaikan</FormLabel>
                            <FormControl>
                                <RichTextEditor 
                                    value={field.value || ""} 
                                    onChange={field.onChange}
                                    placeholder="Detail materi yang diajarkan hari ini..." 
                                    disabled={!canEdit}
                                    className="min-h-[180px]"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                    control={form.control}
                    name="homework"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel className="text-sm font-bold text-slate-700">Pekerjaan Rumah (PR)</FormLabel>
                            <FormControl>
                                <RichTextEditor 
                                    value={field.value || ""} 
                                    onChange={field.onChange}
                                    placeholder="Daftar PR untuk murid..." 
                                    disabled={!canEdit}
                                    className="min-h-[180px]"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="catatan_pengajar"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel className="text-sm font-bold text-slate-700">Catatan Pengajar (Internal)</FormLabel>
                            <FormControl>
                                <RichTextEditor 
                                    value={field.value || ""} 
                                    onChange={field.onChange}
                                    placeholder="Catatan rahasia atau internal untuk evaluasi..." 
                                    disabled={!canEdit}
                                    className="min-h-[180px]"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>

        {canEdit && (
            <div className="flex justify-end">
                 <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" /> Simpan Logbook
                </Button>
            </div>
        )}
      </form>
    </Form>
  );
}
