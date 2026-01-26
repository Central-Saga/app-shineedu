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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { bulkAbsensiSchema } from "@/features/sesi/schemas";
import { sesiApi } from "@/features/sesi/api/sesi.api";
import { AbsensiItem, Sesi } from "@/features/sesi/types";

interface AbsensiEditorProps {
  sesi: Sesi;
  absensi: AbsensiItem[];
  canEdit: boolean;
}

export function AbsensiEditor({ sesi, absensi, canEdit }: AbsensiEditorProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof bulkAbsensiSchema>>({
    resolver: zodResolver(bulkAbsensiSchema),
    defaultValues: {
      items: absensi.map(a => ({
          enrollment_id: a.enrollment_id,
          status: a.status,
          catatan: a.catatan || undefined
      }))
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "items",
  });

  async function onSubmit(values: z.infer<typeof bulkAbsensiSchema>) {
    if (!canEdit) return;
    try {
      setIsSubmitting(true);
      await sesiApi.updateAbsensiBulk(sesi.id, values);
      toast.success("Absensi berhasil disimpan");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan absensi");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
        <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Daftar Kehadiran</h3>
            {canEdit && (
                <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" /> Simpan Absensi
                </Button>
            )}
        </div>

        <div className="rounded-md border">
            <Form {...form}>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama Murid</TableHead>
                            <TableHead className="w-[150px]">Status</TableHead>
                            <TableHead>Catatan</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields.map((field, index) => {
                             const originalItem = absensi.find(a => a.enrollment_id === field.enrollment_id); // Simple find, assume order or consistent IDs
                             // Or use index mapping if aligned? Better safe:
                             const memberName = originalItem?.murid?.nama_lengkap || originalItem?.enrollment?.murid?.nama_lengkap || `Murid #${field.enrollment_id}`;
                             
                             return (
                                <TableRow key={field.id}>
                                    <TableCell className="font-medium">
                                        {memberName}
                                    </TableCell>
                                    <TableCell>
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.status`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!canEdit}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="HADIR">Hadir</SelectItem>
                                                            <SelectItem value="IZIN">Izin</SelectItem>
                                                            <SelectItem value="SAKIT">Sakit</SelectItem>
                                                            <SelectItem value="ALPHA">Alpha</SelectItem>
                                                            <SelectItem value="BATAL">Batal</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.catatan`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} disabled={!canEdit} placeholder="Catatan kehadiran..." />
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
                                <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                                    Belum ada data absensi. Silakan Sync Anggota.
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
