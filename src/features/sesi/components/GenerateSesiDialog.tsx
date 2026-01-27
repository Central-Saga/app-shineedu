"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

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
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { generateSesiSchema } from "../schemas";
import { sesiApi } from "../api/sesi.api";
import { format } from "date-fns";

interface GenerateSesiDialogProps {
  kelasId: number;
  onSuccess?: () => void;
}

export function GenerateSesiDialog({ kelasId, onSuccess }: GenerateSesiDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  
  const form = useForm<z.infer<typeof generateSesiSchema>>({
    resolver: zodResolver(generateSesiSchema) as any,
    defaultValues: {
      sumber: "SYSTEM" as "SYSTEM" | "MANUAL",
      auto_populate_absensi: true,
      from: format(new Date(), "yyyy-MM-01"),
      to: format(new Date(new Date().setMonth(new Date().getMonth() + 1, 0)), "yyyy-MM-dd"),
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: z.infer<typeof generateSesiSchema>) {
    try {
      const res = await sesiApi.generateSesi(kelasId, values);
      const count = res.data?.count ?? 0;
      
      if (count > 0) {
        toast.success(res.message);
      } else {
        toast.warning(res.message);
      }
      
      setOpen(false);
      if (onSuccess) onSuccess();
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Gagal generate sesi");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
            <Plus className="mr-2 h-4 w-4" /> Generate Sesi
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate Sesi</DialogTitle>
          <DialogDescription>
            Buat sesi pertemuan berdasarkan jadwal kerja kelas.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="from"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Dari Tanggal</FormLabel>
                                <FormControl>
                                    <DatePicker
                                        date={field.value ? new Date(field.value) : undefined}
                                        setDate={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                                        placeholder="Pilih tanggal"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="to"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Sampai Tanggal</FormLabel>
                                <FormControl>
                                    <DatePicker
                                        date={field.value ? new Date(field.value) : undefined}
                                        setDate={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                                        placeholder="Pilih tanggal"
                                        disabledDates={(date: Date) => {
                                            const fromDate = form.getValues("from");
                                            if (!fromDate) return false;
                                            // Reset time for comparison
                                            const d = new Date(date);
                                            d.setHours(0,0,0,0);
                                            const f = new Date(fromDate);
                                            f.setHours(0,0,0,0);
                                            return d < f;
                                        }}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="auto_populate_absensi"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>
                                    Auto Populate Absensi
                                </FormLabel>
                                <FormDescription>
                                    Otomatis buat data absensi untuk semua murid aktif.
                                </FormDescription>
                            </div>
                        </FormItem>
                    )}
                />

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Batal
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Generate
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
