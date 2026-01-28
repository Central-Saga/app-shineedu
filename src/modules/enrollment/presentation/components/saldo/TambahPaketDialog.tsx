"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

import { saldoPertemuanApi } from "@/lib/api/saldo-pertemuan";
import { listPaket } from "@/modules/catalog/infrastructure/catalog.repository";
import { Paket } from "@/modules/catalog/domain/entities";

const formSchema = z.object({
  paket_id: z.string().min(1, "Paket harus dipilih"),
  tanggal_mulai: z.date().optional(),
  catatan: z.string().optional(),
});

interface TambahPaketDialogProps {
  enrollmentId: number;
  programId: number;
  jenjangId: number;
  onSuccess: () => void;
}

export function TambahPaketDialog({ enrollmentId, programId, jenjangId, onSuccess }: TambahPaketDialogProps) {
  const [open, setOpen] = useState(false);
  const [pakets, setPakets] = useState<Paket[]>([]);
  const [loadingPaket, setLoadingPaket] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      catatan: "",
    },
  });

  const { isSubmitting } = form.formState;

  useEffect(() => {
    if (open) {
      setLoadingPaket(true);
      // Filter paket by program and jenjang from enrollment
      listPaket({ 
        status: "Aktif", 
        program_id: programId,
        jenjang_id: jenjangId,
        per_page: 100 
      })
        .then((res) => {
          setPakets(res.items);
        })
        .catch((err) => {
          console.error("Gagal memuat paket:", err);
          toast.error("Gagal memuat daftar paket");
        })
        .finally(() => {
          setLoadingPaket(false);
        });
    }
  }, [open, programId, jenjangId]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await saldoPertemuanApi.createPaketMurid(enrollmentId, {
        paket_id: Number(values.paket_id),
        tanggal_mulai: values.tanggal_mulai ? format(values.tanggal_mulai, "yyyy-MM-dd") : undefined,
        catatan: values.catatan,
      });
      toast.success("Berhasil menambahkan paket ke murid");
      setOpen(false);
      form.reset();
      onSuccess();
    } catch (error: any) {
      console.error(error);
      if (error?.status === 422) {
          // Handle validation errors if specific fields
          // For now generic error
          toast.error("Data tidak valid. Silakan periksa kembali.");
      } else {
          toast.error(error.message || "Gagal menambahkan paket");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          <Plus className="size-4" />
          Tambah Paket
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tambah Paket Pertemuan</DialogTitle>
          <DialogDescription>
            Pilih paket pertemuan untuk murid ini. Saldo akan ditambahkan sesuai paket.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="paket_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paket <span className="text-red-500">*</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingPaket}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingPaket ? "Memuat paket..." : "Pilih Paket"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {pakets.map((paket) => (
                        <SelectItem key={paket.id} value={String(paket.id)}>
                          {paket.nama} ({paket.jumlah_pertemuan} Pertemuan)
                        </SelectItem>
                      ))}
                      {!loadingPaket && pakets.length === 0 && (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                              Tidak ada paket aktif
                          </div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Pilih paket yang akan diambil oleh murid.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tanggal_mulai"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Tanggal Mulai</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd MMMM yyyy")
                          ) : (
                            <span>Pilih tanggal (Opsional)</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="catatan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Catatan tambahan (opsional)" 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting || loadingPaket}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
