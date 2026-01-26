"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { bulkLogbookMuridSchema } from "@/features/sesi/schemas";
import { sesiApi } from "@/features/sesi/api/sesi.api";
import { LogbookMuridItem, Sesi } from "@/features/sesi/types";

interface LogbookMuridEditorProps {
  sesi: Sesi;
  logbookMurid: LogbookMuridItem[];
  canEdit: boolean;
}

export function LogbookMuridEditor({ sesi, logbookMurid, canEdit }: LogbookMuridEditorProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof bulkLogbookMuridSchema>>({
    resolver: zodResolver(bulkLogbookMuridSchema) as any,
    defaultValues: {
      items: logbookMurid.map(l => ({
          enrollment_id: l.enrollment_id,
          catatan_perkembangan: l.catatan_perkembangan || undefined,
          kesulitan: l.kesulitan || undefined,
          target_next: l.target_next || undefined,
          tugas_individu: l.tugas_individu || undefined,
          nilai_opsional: l.nilai_opsional || undefined
      }))
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "items",
  });

  async function onSubmit(values: z.infer<typeof bulkLogbookMuridSchema>) {
    if (!canEdit) return;
    try {
      setIsSubmitting(true);
      await sesiApi.updateLogbookMuridBulk(sesi.id, values);
      toast.success("Logbook murid berhasil disimpan");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan logbook murid");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
        <div className="flex justify-end">
            {canEdit && (
                <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" /> Simpan Logbook Murid
                </Button>
            )}
        </div>

        <div className="rounded-md border">
            <Form {...form}>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[150px]">Nama Murid</TableHead>
                            <TableHead>Perkembangan</TableHead>
                            <TableHead>Kesulitan</TableHead>
                            <TableHead>Target Next</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields.map((field, index) => {
                             const originalItem = logbookMurid.find(l => l.enrollment_id === field.enrollment_id);
                             const memberName = originalItem?.murid?.nama_lengkap || originalItem?.enrollment?.murid?.nama_lengkap || `Murid #${field.enrollment_id}`;
                             
                             return (
                                <TableRow key={field.id} className="align-top">
                                    <TableCell className="font-medium pt-4">
                                        {memberName}
                                    </TableCell>
                                    <TableCell>
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.catatan_perkembangan`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Textarea {...field} value={field.value || ""} disabled={!canEdit} placeholder="Catatan perkembangan..." className="min-h-[80px]" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.kesulitan`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Textarea {...field} value={field.value || ""} disabled={!canEdit} placeholder="Kesulitan yang dihadapi..." className="min-h-[80px]" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.target_next`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Textarea {...field} value={field.value || ""} disabled={!canEdit} placeholder="Target pertemuan selanjutnya..." className="min-h-[80px]" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </TableCell>
                                </TableRow>
                             );
                        })}
                         {fields.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                    Belum ada data logbook murid.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Form>
        </div>
    </div>
  );
}
