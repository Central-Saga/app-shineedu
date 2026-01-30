"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Save, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { bulkAbsensiSchema } from "@/features/sesi/schemas";
import { sesiApi } from "@/features/sesi/api/sesi.api";
import { AbsensiItem, Sesi } from "@/features/sesi/types";
import { SearchEnrollmentDialog } from "./SearchEnrollmentDialog";
import { Enrollment } from "@/modules/enrollment/domain/entities";
import { cn } from "@/lib/utils";

interface AbsensiEditorProps {
  sesi: Sesi;
  absensi: AbsensiItem[];
  canEdit: boolean;
  onSuccess?: () => void;
}

type BulkAbsensiFormValues = z.infer<typeof bulkAbsensiSchema>;

export function AbsensiEditor({ 
  sesi, 
  absensi = [], 
  canEdit, 
  onSuccess 
}: AbsensiEditorProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [futureSessions, setFutureSessions] = useState<Sesi[]>([]);
  // Local state to keep track of students added manually
  const [manualParticipants, setManualParticipants] = useState<AbsensiItem[]>([]);

  const getFormItems = useCallback(() => {
    return [
      ...(absensi || []).map(a => ({
          enrollment_id: a.enrollment_id,
          status: a.status as any,
          catatan: a.catatan || "",
          target_session_id: undefined
      })),
      ...(manualParticipants || []).map(a => ({
          enrollment_id: a.enrollment_id,
          status: a.status as any,
          catatan: a.catatan || "",
          target_session_id: undefined
      }))
    ];
  }, [absensi, manualParticipants]);

  const form = useForm<BulkAbsensiFormValues>({
    resolver: zodResolver(bulkAbsensiSchema) as any,
    defaultValues: {
      items: getFormItems()
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Load future sessions for "Ganti Jadwal" lookup
  useEffect(() => {
    const loadFutureSessions = async () => {
        try {
            const res = await sesiApi.getSesiByKelas(sesi.id, { // sesi.id is actually Realisasi ID
                from: format(new Date(), "yyyy-MM-dd"),
                per_page: 50
            });
            // Filter out current session
            setFutureSessions(res.data.filter(s => s.id !== sesi.id));
        } catch (error) {
            console.error("Gagal memuat jadwal masa depan", error);
        }
    };
    if (canEdit && sesi.id) loadFutureSessions();
  }, [sesi.id, canEdit]);

  // Watch for changes and reset form
  useEffect(() => {
    form.reset({
      items: getFormItems()
    });
  }, [getFormItems, form]);

  const handleAddManualStudent = (enrollment: Enrollment) => {
    // Prevent duplicates
    if (form.getValues("items").some(item => item.enrollment_id === enrollment.id)) {
        toast.error("Murid sudah ada dalam daftar");
        return;
    }

    const newItem: AbsensiItem = {
        sesi_id: sesi.id, 
        enrollment_id: enrollment.id,
        status: "HADIR",
        catatan: "[Murid Pindahan]",
        enrollment: {
            ...enrollment as any,
            murid: enrollment.murid
        }
    };

    setManualParticipants(prev => [...prev, newItem]);
    toast.success(`${enrollment.murid?.nama_lengkap} ditambahkan`);
  };

  async function onSubmit(values: BulkAbsensiFormValues) {
    if (!canEdit) return;
    try {
      setIsSubmitting(true);
      await sesiApi.updateAbsensiBulk(sesi.id, values);
      toast.success("Absensi berhasil disimpan");
      setManualParticipants([]); // Reset local state
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
            <div className="flex flex-col">
                <h3 className="text-lg font-semibold tracking-tight">Daftar Kehadiran Murid</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Total: {fields.length} Murid</p>
            </div>
            {canEdit && (
                <div className="flex items-center gap-2">
                    {Object.keys(form.formState.errors).length > 0 && (
                        <div className="text-xs text-destructive">
                            {JSON.stringify(form.formState.errors)}
                        </div>
                    )}
                    <SearchEnrollmentDialog 
                        onSelect={handleAddManualStudent} 
                        excludeIds={fields.map(f => f.enrollment_id)}
                    />
                    <Button 
                        onClick={form.handleSubmit(onSubmit)} 
                        disabled={isSubmitting} 
                        size="sm"
                    >
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Simpan Absensi
                    </Button>
                </div>
            )}
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
            <Form {...form}>
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="py-3 px-4 font-bold text-foreground">Nama Murid</TableHead>
                            <TableHead className="w-[180px] font-bold text-foreground">Status Kehadiran</TableHead>
                            <TableHead className="font-bold text-foreground">Catatan / Pindah Jadwal</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields.map((field, index) => {
                             const allParticipants = [...(absensi || []), ...(manualParticipants || [])];
                             const originalItem = allParticipants.find(a => a.enrollment_id === field.enrollment_id);
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
                                            render={({ field: statusField }) => {
                                                const isPindahan = originalItem?.catatan?.includes("[Murid Pindahan]") || originalItem?.catatan?.includes("[Make-up]");

                                                if (isPindahan) {
                                                    return (
                                                        <div className="flex items-center gap-2">
                                                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50">Hadir</Badge>
                                                        </div>
                                                    );
                                                }

                                                const currentStatusVal = statusField.value || "HADIR";

                                                return (
                                                    <FormItem className="space-y-0">
                                                        <Select 
                                                            onValueChange={(val) => statusField.onChange(val)} 
                                                            defaultValue={currentStatusVal}
                                                            value={currentStatusVal}
                                                            disabled={!canEdit}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger className={cn(
                                                                    "h-9 w-[140px] font-medium transition-all",
                                                                    currentStatusVal === "HADIR" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                                                    currentStatusVal === "PINDAH_JADWAL" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                                                    "bg-rose-50 text-rose-700 border-rose-200"
                                                                )}>
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="HADIR">Hadir</SelectItem>
                                                                <SelectItem value="TIDAK_HADIR">Tidak Hadir</SelectItem>
                                                                <SelectItem value="PINDAH_JADWAL">Pindah Jadwal</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                );
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell className="px-4">
                                        {currentStatus === "PINDAH_JADWAL" ? (
                                             <div className="space-y-2 min-w-[280px] animate-in fade-in duration-300">
                                                 {originalItem?.catatan?.includes("[Pindah ke") && !form.watch(`items.${index}.target_session_id`) && (
                                                     <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-100 rounded-md text-blue-700 text-xs font-medium mb-1">
                                                         <Clock className="h-3 w-3" />
                                                         <span>Terjadwal: {originalItem.catatan.replace(/[\[\]]/g, "")}</span>
                                                     </div>
                                                 )}

                                                 <FormField
                                                    control={form.control}
                                                    name={`items.${index}.target_session_id`}
                                                    render={({ field: sessionField }) => (
                                                        <FormItem>
                                                            <div className="flex flex-col gap-1.5">
                                                                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-tight">Pindah ke Sesi Lain:</span>
                                                                <Select 
                                                                    onValueChange={(val) => sessionField.onChange(val ? Number(val) : undefined)} 
                                                                    value={sessionField.value ? String(sessionField.value) : undefined} 
                                                                    disabled={!canEdit}
                                                                >
                                                                    <FormControl>
                                                                        <SelectTrigger className="w-full bg-white border-dashed border-blue-300 text-muted-foreground h-9 shadow-none">
                                                                            <SelectValue placeholder={originalItem?.catatan?.includes("[Pindah ke") ? "Ubah Jadwal Pengganti..." : "Pilih Jadwal Pengganti..."} />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent className="max-h-[300px]">
                                                                        {futureSessions.map((s) => (
                                                                            <SelectItem key={s.id} value={String(s.id)}>
                                                                                <div className="flex flex-col text-left py-0.5 pointer-events-none">
                                                                                    <span className="font-bold text-xs">
                                                                                        {format(new Date(s.tanggal), "eeee, dd/MM/yy", { locale: idLocale })}
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
                                                                <p className="text-[10px] text-blue-600 font-medium pl-1 italic">
                                                                    * Jadwal pengganti akan otomatis dibuat saat Simpan.
                                                                </p>
                                                            </div>
                                                        </FormItem>
                                                    )}
                                                />
                                             </div>
                                        ) : (
                                            <div className="flex items-center h-9">
                                                {originalItem?.catatan ? (
                                                     <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 font-normal">
                                                        {originalItem.catatan}
                                                     </Badge>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic">Tidak ada catatan</span>
                                                )}
                                            </div>
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
