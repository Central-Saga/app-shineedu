"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Edit, Loader2 } from "lucide-react";
import { format } from "date-fns";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { sesiApi } from "../api/sesi.api";
import { updateSesiSchema } from "../schemas";
import { Sesi } from "../types";
import { getEmployeesUsecase } from "@/modules/employees/application/usecases/getEmployees.usecase"; // assuming this exists
import { Employee } from "@/modules/employees/domain/entities";

interface EditSesiDialogProps {
  sesi: Sesi;
  onSuccess?: () => void;
}

export function EditSesiDialog({ sesi, onSuccess }: EditSesiDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);

  const form = useForm<z.infer<typeof updateSesiSchema>>({
    resolver: zodResolver(updateSesiSchema) as any,
    defaultValues: {
      status_sesi: sesi.status_sesi,
      status_kehadiran_guru: sesi.status_kehadiran_guru,
      jam_mulai_aktual: sesi.jam_mulai_aktual?.slice(0, 5) || sesi.jam_mulai_plan?.slice(0, 5),
      jam_selesai_aktual: sesi.jam_selesai_aktual?.slice(0, 5) || sesi.jam_selesai_plan?.slice(0, 5),
      ruangan_kelas: sesi.ruangan_kelas || "",
      guru_pengganti_id: sesi.guru_pengganti?.id || null, // Updated: Access ID directly or handle object
      alasan_batal: sesi.alasan_batal || "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;
  const statusKehadiran = form.watch("status_kehadiran_guru");
  const statusSesi = form.watch("status_sesi");

  useEffect(() => {
    // Load employees for substitution
    if (open) {
        getEmployeesUsecase({ per_page: 100 }).then(res => {
            setEmployees(res.items);
        });
    }
  }, [open]);

  // Reset/populate form when dialog opens
  useEffect(() => {
      if(open) {
          form.reset({
              tanggal: sesi.tanggal,
              status_sesi: sesi.status_sesi,
              status_kehadiran_guru: sesi.status_kehadiran_guru,
              jam_mulai_aktual: sesi.jam_mulai_aktual?.slice(0, 5) || sesi.jam_mulai_plan?.slice(0, 5),
              jam_selesai_aktual: sesi.jam_selesai_aktual?.slice(0, 5) || sesi.jam_selesai_plan?.slice(0, 5),
              ruangan_kelas: sesi.ruangan_kelas || "",
              guru_pengganti_id: sesi.guru_pengganti?.id || null,
              alasan_batal: sesi.alasan_batal || "",
          });
      }
  }, [open, sesi, form]);

  async function onSubmit(values: z.infer<typeof updateSesiSchema>) {
    try {
      await sesiApi.updateSesi(sesi.id, {
        ...values,
        jam_mulai_aktual: values.jam_mulai_aktual || undefined,
        jam_selesai_aktual: values.jam_selesai_aktual || undefined,
        guru_pengganti_id: values.guru_pengganti_id || undefined,
        ruangan_kelas: values.ruangan_kelas || undefined,
        alasan_batal: values.alasan_batal || undefined,
        tanggal: values.tanggal || undefined
      });
      toast.success("Sesi berhasil diperbarui");
      setOpen(false);
      if (onSuccess) onSuccess();
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Gagal memperbarui sesi");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
            <Edit className="mr-2 h-3.5 w-3.5" /> Edit Sesi
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Informasi Sesi</DialogTitle>
          <DialogDescription>
            Ubah status kehadiran, guru pengganti, atau waktu pelaksanaan.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="tanggal"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Tanggal Sesi (Reschedule)</FormLabel>
                            <FormControl>
                                <Input 
                                    type="date" 
                                    {...field} 
                                    value={field.value ? format(new Date(field.value), "yyyy-MM-dd") : ""}
                                    onChange={(e) => field.onChange(e.target.value)}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="jam_mulai_aktual"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Jam Mulai (Aktual)</FormLabel>
                                <FormControl>
                                    <Input type="time" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="jam_selesai_aktual"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Jam Selesai (Aktual)</FormLabel>
                                <FormControl>
                                    <Input type="time" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="status_sesi"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status Sesi</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih status" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="TERJADWAL">Terjadwal</SelectItem>
                                        <SelectItem value="BERJALAN">Berjalan</SelectItem>
                                        <SelectItem value="SELESAI">Selesai</SelectItem>
                                        <SelectItem value="BATAL">Batal</SelectItem>
                                        <SelectItem value="LIBUR">Libur</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="ruangan_kelas"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Ruangan</FormLabel>
                                <FormControl>
                                    <Input {...field} value={field.value || ""} placeholder="Contoh: Ruang 1" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {statusSesi === 'BATAL' && (
                    <FormField
                        control={form.control}
                        name="alasan_batal"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Alasan Pembatalan <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                    <Textarea {...field} value={field.value || ""} placeholder="Jelaskan alasan pembatalan..." />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-semibold mb-3">Kehadiran Pengajar</h4>
                    <FormField
                        control={form.control}
                        name="status_kehadiran_guru"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status Kehadiran Guru</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih status" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="HADIR">Hadir</SelectItem>
                                        <SelectItem value="IZIN">Izin</SelectItem>
                                        <SelectItem value="SAKIT">Sakit</SelectItem>
                                        <SelectItem value="ALPHA">Alpha</SelectItem>
                                        <SelectItem value="DIGANTI">Diganti (Substitute)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {statusKehadiran === 'DIGANTI' && (
                         <FormField
                            control={form.control}
                            name="guru_pengganti_id"
                            render={({ field }) => (
                                <FormItem className="mt-3">
                                    <FormLabel>Pilih Guru Pengganti <span className="text-red-500">*</span></FormLabel>
                                    <Select 
                                        onValueChange={(val) => field.onChange(val ? Number(val) : null)} 
                                        defaultValue={field.value ? String(field.value) : undefined}
                                        value={field.value ? String(field.value) : undefined}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih guru..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {employees.map(emp => (
                                                <SelectItem key={emp.id} value={String(emp.id)}>
                                                    {emp.user?.name || emp.kode_karyawan}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                </div>

                <DialogFooter className="mt-6">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Batal
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Simpan Perubahan
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
