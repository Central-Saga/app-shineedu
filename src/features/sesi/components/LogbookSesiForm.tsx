"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { logbookSesiSchema } from "@/features/sesi/schemas";
import { sesiApi } from "@/features/sesi/api/sesi.api";
import { LogbookSesi, Sesi } from "@/features/sesi/types";

interface LogbookSesiFormProps {
  sesi: Sesi;
  logbook: LogbookSesi;
  canEdit: boolean;
}

export function LogbookSesiForm({ sesi, logbook, canEdit }: LogbookSesiFormProps) {
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

  async function onSubmit(values: z.infer<typeof logbookSesiSchema>) {
    if (!canEdit) return;
    try {
      setIsSubmitting(true);
      await sesiApi.updateLogbook(sesi.id, values);
      toast.success("Logbook berhasil disimpan");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan logbook");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
                control={form.control}
                name="ringkasan"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Ringkasan Kegiatan</FormLabel>
                        <FormControl>
                            <Textarea 
                                {...field} 
                                value={field.value || ""} 
                                disabled={!canEdit} 
                                className="min-h-[120px]"
                                placeholder="Jelaskan ringkasan kegiatan belajar mengajar..." 
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
                    <FormItem>
                        <FormLabel>Materi yang Disampaikan</FormLabel>
                        <FormControl>
                            <Textarea 
                                {...field} 
                                value={field.value || ""} 
                                disabled={!canEdit} 
                                className="min-h-[120px]"
                                placeholder="Detail materi..." 
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="homework"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Pekerjaan Rumah (PR)</FormLabel>
                        <FormControl>
                            <Textarea 
                                {...field} 
                                value={field.value || ""} 
                                disabled={!canEdit} 
                                className="min-h-[100px]"
                                placeholder="Daftar PR..." 
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
                    <FormItem>
                        <FormLabel>Catatan Pengajar (Internal)</FormLabel>
                        <FormControl>
                            <Textarea 
                                {...field} 
                                value={field.value || ""} 
                                disabled={!canEdit} 
                                className="min-h-[100px]"
                                placeholder="Catatan internal pengajar..." 
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
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
