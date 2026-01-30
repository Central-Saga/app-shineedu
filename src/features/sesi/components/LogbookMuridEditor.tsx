"use client";

import { useState, useEffect, useCallback } from "react";
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
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { bulkLogbookMuridSchema } from "@/features/sesi/schemas";
import { sesiApi } from "@/features/sesi/api/sesi.api";
import { LogbookMuridItem, Sesi, AbsensiItem } from "../types";

interface LogbookMuridEditorProps {
  sesi: Sesi;
  absensi: AbsensiItem[];
  logbookMurid: LogbookMuridItem[];
  canEdit: boolean;
  onSuccess?: () => void;
}

export function LogbookMuridEditor({ 
  sesi, 
  absensi = [], 
  logbookMurid = [], 
  canEdit, 
  onSuccess 
}: LogbookMuridEditorProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Safety check for map
  const getInitialItems = useCallback(() => {
    return (absensi || [])
      .map(a => {
        const existing = (logbookMurid || []).find(l => l.enrollment_id === a.enrollment_id);
        return {
            enrollment_id: a.enrollment_id,
            catatan_perkembangan: existing?.catatan_perkembangan || "",
            kesulitan: existing?.kesulitan || "",
            target_next: existing?.target_next || "",
            tugas_individu: existing?.tugas_individu || "",
            nilai_opsional: existing?.nilai_opsional ? Number(existing.nilai_opsional) : undefined
        };
    });
  }, [absensi, logbookMurid]);

  const form = useForm<z.infer<typeof bulkLogbookMuridSchema>>({
    resolver: zodResolver(bulkLogbookMuridSchema) as any,
    defaultValues: {
      items: getInitialItems()
    },
  });

  // Reset form when props change
  useEffect(() => {
    form.reset({
      items: getInitialItems()
    });
  }, [getInitialItems, form]);

  const { fields } = useFieldArray({
    control: form.control,
    name: "items",
  });

  async function onSubmit(values: z.infer<typeof bulkLogbookMuridSchema>) {
    if (!canEdit) return;
    try {
      setIsSubmitting(true);
      await sesiApi.updateLogbookMuridBulk(sesi.id, values as any);
      toast.success("Logbook murid berhasil disimpan");
      if (onSuccess) {
          onSuccess();
      } else {
          router.refresh();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menyimpan logbook murid";
      toast.error(message);
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

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
            <Form {...form}>
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="bg-slate-50/80 hover:bg-transparent">
                            <TableHead className="py-4 pl-4 font-bold text-slate-800 uppercase tracking-wider text-[11px]">Identitas Murid</TableHead>
                            <TableHead className="py-4 px-4 font-bold text-slate-800 uppercase tracking-wider text-[11px]">Konten Logbook Individu</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields.map((field, index) => {
                             const participant = (absensi || []).find(a => a.enrollment_id === field.enrollment_id);
                             const memberName = participant?.murid?.nama_lengkap || participant?.enrollment?.murid?.nama_lengkap || `Murid #${field.enrollment_id}`;
                             
                             return (
                                <TableRow key={field.id} className="hover:bg-slate-50/30 transition-colors">
                                    <TableCell className="font-bold py-6 pl-4 align-top w-[220px]">
                                        <div className="sticky top-4">
                                            <p className="text-sm text-slate-900 leading-tight">{memberName}</p>
                                            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-semibold">Terdapat dalam Daftar</p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-6 px-4">
                                        <div className="space-y-8">
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.catatan_perkembangan`}
                                                render={({ field: perkembanganField }) => (
                                                    <FormItem className="flex flex-col">
                                                        <div className="flex items-center justify-between mb-1.5 px-0.5">
                                                            <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">Perkembangan</span>
                                                        </div>
                                                        <FormControl>
                                                            <RichTextEditor 
                                                                value={perkembanganField.value || ""} 
                                                                onChange={perkembanganField.onChange}
                                                                disabled={!canEdit} 
                                                                placeholder="Catatan perkembangan murid..." 
                                                                className="min-h-[140px]" 
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <FormField
                                                    control={form.control}
                                                    name={`items.${index}.kesulitan`}
                                                    render={({ field: kesulitanField }) => (
                                                        <FormItem className="flex flex-col">
                                                            <div className="flex items-center justify-between mb-1.5 px-0.5">
                                                                <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">Kesulitan</span>
                                                            </div>
                                                            <FormControl>
                                                                <RichTextEditor 
                                                                    value={kesulitanField.value || ""} 
                                                                    onChange={kesulitanField.onChange}
                                                                    disabled={!canEdit} 
                                                                    placeholder="Kesulitan yang dihadapi..." 
                                                                    className="min-h-[140px]" 
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`items.${index}.target_next`}
                                                    render={({ field: targetField }) => (
                                                        <FormItem className="flex flex-col">
                                                            <div className="flex items-center justify-between mb-1.5 px-0.5">
                                                                <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">Target Selanjutnya</span>
                                                            </div>
                                                            <FormControl>
                                                                <RichTextEditor 
                                                                    value={targetField.value || ""} 
                                                                    onChange={targetField.onChange}
                                                                    disabled={!canEdit} 
                                                                    placeholder="Target pertemuan selanjutnya..." 
                                                                    className="min-h-[140px]" 
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                             );
                        })}
                         {fields.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center h-48 text-muted-foreground italic bg-slate-50/50">
                                    <div className="flex flex-col items-center gap-2">
                                        <p>Belum ada data murid di sesi ini.</p>
                                        <p className="text-[10px] uppercase tracking-widest font-bold opacity-50">Silakan Sync Anggota jika murid belum muncul</p>
                                    </div>
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
