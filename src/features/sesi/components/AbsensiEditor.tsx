"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Save, Clock } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
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
  onSuccess?: () => void;
}

type BulkAbsensiFormValues = z.infer<typeof bulkAbsensiSchema>;

export function AbsensiEditor({ sesi, absensi, canEdit, onSuccess }: AbsensiEditorProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [futureSessions, setFutureSessions] = useState<Sesi[]>([]);

  const form = useForm<BulkAbsensiFormValues>({
    resolver: zodResolver(bulkAbsensiSchema),
    defaultValues: {
      items: absensi.map(a => ({
          enrollment_id: a.enrollment_id,
          status: a.status,
          catatan: a.catatan || "",
          target_session_id: undefined
      }))
    },
  });

  // Load future sessions for "Ganti Jadwal" lookup
  useEffect(() => {
    const loadFutureSessions = async () => {
        try {
            const res = await sesiApi.getSesiByKelas(sesi.kelas_id, {
                from: format(new Date(), "yyyy-MM-dd"),
                per_page: 50
            });
            // Filter out current session
            setFutureSessions(res.data.filter(s => s.id !== sesi.id));
        } catch (error) {
            console.error("Gagal memuat jadwal masa depan", error);
        }
    };
    if (canEdit) loadFutureSessions();
  }, [sesi.id, sesi.kelas_id, canEdit]);

  // Watch for changes in absensi prop and reset form
  useEffect(() => {
    form.reset({
      items: absensi.map(a => ({
          enrollment_id: a.enrollment_id,
          status: a.status,
          catatan: a.catatan || "",
          target_session_id: undefined
      }))
    });
  }, [absensi, form]);

  const { fields } = useFieldArray({
    control: form.control,
    name: "items",
  });

  async function onSubmit(values: BulkAbsensiFormValues) {
    if (!canEdit) return;
    try {
      setIsSubmitting(true);
      await sesiApi.updateAbsensiBulk(sesi.id, values);
      toast.success("Absensi berhasil disimpan");
      if (onSuccess) {
          onSuccess();
      } else {
          router.refresh();
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan absensi");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold tracking-tight">Daftar Kehadiran Murid</h3>
            {canEdit && (
                <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting} size="sm">
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Simpan Absensi
                </Button>
            )}
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
            <Form {...form}>
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="py-3 px-4 font-bold text-foreground">Nama Murid</TableHead>
                            <TableHead className="w-[180px] font-bold text-foreground">Status Kehadiran</TableHead>
                            <TableHead className="font-bold text-foreground">Catatan / Pindah Jadwal</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields.map((field, index) => {
                             const originalItem = absensi.find(a => a.enrollment_id === field.enrollment_id);
                             const memberName = originalItem?.murid?.nama_lengkap || originalItem?.enrollment?.murid?.nama_lengkap || `Murid #${field.enrollment_id}`;
                             const currentStatus = form.watch(`items.${index}.status`);
                             
                             return (
                                <TableRow key={field.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell className="font-medium py-3 px-4">
                                        {memberName}
                                    </TableCell>
                                    <TableCell className="px-2">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.status`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!canEdit}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-9 focus:ring-1 focus:ring-primary">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="HADIR">Hadir</SelectItem>
                                                            <SelectItem value="BATAL">Tidak Hadir</SelectItem>
                                                            <SelectItem value="IZIN">Izin</SelectItem>
                                                            <SelectItem value="SAKIT">Sakit</SelectItem>
                                                            <SelectItem value="ALPHA">Alpha</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell className="px-4">
                                        {currentStatus === "BATAL" ? (
                                             <div className="space-y-2 min-w-[280px] animate-in fade-in duration-300">
                                                 {/* Tampilkan keterangan jika sudah pernah dipindahkan sebelumnya */}
                                                 {field.catatan?.includes("[Pindah ke") && !form.watch(`items.${index}.target_session_id`) && (
                                                     <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-100 rounded-md text-blue-700 text-xs font-medium mb-1">
                                                         <Clock className="h-3 w-3" />
                                                         <span>Terjadwal: {field.catatan.replace(/[\[\]]/g, "")}</span>
                                                     </div>
                                                 )}

                                                 <FormField
                                                    control={form.control}
                                                    name={`items.${index}.target_session_id`}
                                                    render={({ field: sessionField }) => (
                                                        <FormItem>
                                                            <Select 
                                                                onValueChange={(val) => sessionField.onChange(val ? Number(val) : undefined)} 
                                                                value={sessionField.value ? String(sessionField.value) : undefined} 
                                                                disabled={!canEdit}
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger className="w-full bg-white border-dashed border-blue-300 text-muted-foreground h-9">
                                                                        <SelectValue placeholder={field.catatan?.includes("[Pindah ke") ? "Ubah Jadwal Pengganti..." : "Pilih Jadwal Pengganti..."} />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent className="max-h-[300px]">
                                                                    {futureSessions.map((s) => (
                                                                        <SelectItem key={s.id} value={String(s.id)}>
                                                                            <div className="flex flex-col text-left py-0.5 pointer-events-none">
                                                                                <span className="font-bold text-xs">
                                                                                    {format(new Date(s.tanggal), "eeee, dd/MM/yy")}
                                                                                </span>
                                                                                <span className="text-[10px] text-muted-foreground leading-none mt-1">
                                                                                    {s.jam_mulai_plan.slice(0,5)} - {s.jam_selesai_plan.slice(0,5)} • {s.guru_pengajar?.user?.name || "Guru"}
                                                                                </span>
                                                                            </div>
                                                                        </SelectItem>
                                                                    ))}
                                                                    {futureSessions.length === 0 && (
                                                                        <div className="p-3 text-xs italic text-muted-foreground text-center">
                                                                            Tidak ada jadwal masa depan yang tersedia.
                                                                        </div>
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                        </FormItem>
                                                    )}
                                                />
                                                <p className="text-[10px] text-blue-600 font-medium pl-1">
                                                    * Jadwal pengganti akan otomatis dibuat saat Anda klik Simpan.
                                                </p>
                                             </div>
                                        ) : (
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.catatan`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Input {...field} value={field.value || ""} disabled={!canEdit} placeholder="Catatan (opsional)..." className="h-9" />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        )}
                                    </TableCell>
                                </TableRow>
                             );
                        })}
                         {fields.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center h-24 text-muted-foreground italic">
                                    Belum ada data anggota di sesi ini.
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
