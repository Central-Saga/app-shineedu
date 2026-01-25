"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { DatePicker } from "@/components/ui/date-picker";
import { academicApi } from "@/modules/academic/infrastructure/api";
import { enrollmentRepository } from "@/modules/enrollment/infrastructure/enrollment.repository";

const formSchema = z.object({
  enrollment_ids: z.array(z.number()).min(1, "Pilih minimal 1 siswa"),
  tanggal_masuk: z.string().optional(),
});

interface AddAnggotaSheetProps {
  kelasId: number;
  programId: number;
  jenjangId: number;
  onSuccess: () => void;
}

export function AddAnggotaSheet({ kelasId, programId, jenjangId, onSuccess }: AddAnggotaSheetProps) {
  const [open, setOpen] = useState(false);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [filteredEnrollments, setFilteredEnrollments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      enrollment_ids: [],
      tanggal_masuk: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
     if (open) {
         fetchEnrollments();
     }
  }, [open, programId, jenjangId]);

  useEffect(() => {
      if (search) {
          const lower = search.toLowerCase();
          setFilteredEnrollments(
              enrollments.filter(e => 
                  e.murid?.nama_lengkap?.toLowerCase().includes(lower) || 
                  e.kode_enrollment?.toLowerCase().includes(lower) ||
                  e.murid?.kode_murid?.toLowerCase().includes(lower)
              )
          );
      } else {
          setFilteredEnrollments(enrollments);
      }
  }, [search, enrollments]);

  const fetchEnrollments = async () => {
      setIsLoading(true);
      try {
          const params: any = {
              status: 'Aktif',
              per_page: 50
          };
          
          if (programId) params.program_id = programId;
          if (jenjangId) params.jenjang_id = jenjangId;

          const res = await enrollmentRepository.getEnrollments(params);
          setEnrollments(res.data || []);
      } catch (e) {
          console.error(e);
          toast.error("Gagal memuat data siswa");
      } finally {
          setIsLoading(false);
      }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
      setIsSubmitting(true);
      try {
          await academicApi.addKelasMembers(kelasId, values);
          toast.success("Berhasil menambahkan anggota");
          setOpen(false);
          form.reset();
          onSuccess();
      } catch (error: any) {
          console.error(error);
          toast.error(error.message || "Gagal menambahkan anggota");
      } finally {
          setIsSubmitting(false);
      }
  };

  const selectedCount = form.watch("enrollment_ids").length;

  const toggleSelection = (id: number) => {
      const current = form.getValues("enrollment_ids");
      if (current.includes(id)) {
          form.setValue("enrollment_ids", current.filter(x => x !== id));
      } else {
          form.setValue("enrollment_ids", [...current, id]);
      }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
            <Plus className="mr-2 h-4 w-4" /> Tambah Anggota
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Tambah Anggota Kelas</DialogTitle>
          <DialogDescription>
            Pilih siswa aktif untuk dimasukkan ke kelas ini.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
             <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama atau kode pendaftaran..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
            </div>

             <div className="border rounded-lg overflow-hidden flex flex-col min-h-[300px] max-h-[400px]">
                 <ScrollArea className="flex-1">
                     {isLoading ? (
                         <div className="flex flex-col items-center justify-center py-20 gap-2">
                            <Loader2 className="animate-spin text-primary size-6" />
                            <p className="text-xs text-muted-foreground">Memuat data siswa...</p>
                         </div>
                     ) : filteredEnrollments.length === 0 ? (
                         <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                            <Users className="size-8 text-muted-foreground/30 mb-3" />
                            <p className="text-sm font-semibold">Tidak ada siswa tersedia</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {search ? 'Tidak ada hasil untuk kata kunci ini.' : 'Pastikan siswa memiliki pendaftaran berstatus Aktif.'}
                            </p>
                         </div>
                     ) : (
                         <div className="divide-y">
                             {filteredEnrollments.map((enr) => {
                                 const isSelected = form.watch("enrollment_ids").includes(enr.id);
                                 return (
                                     <div 
                                        key={enr.id} 
                                        className="flex items-start gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors" 
                                        onClick={() => toggleSelection(enr.id)}
                                     >
                                         <div className="pt-0.5">
                                            <Checkbox 
                                                checked={isSelected}
                                                onCheckedChange={() => toggleSelection(enr.id)}
                                            />
                                         </div>
                                         <div className="flex flex-col min-w-0">
                                             <span className="text-sm font-semibold truncate text-foreground">
                                                 {enr.murid?.nama_lengkap || 'Unknown Murid'}
                                             </span>
                                             <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                                                 <span className="font-mono">{enr.kode_enrollment}</span>
                                                 <span>•</span>
                                                 <span className="truncate">{enr.paket?.nama || 'Tanpa Paket'}</span>
                                             </div>
                                         </div>
                                     </div>
                                 );
                             })}
                         </div>
                     )}
                 </ScrollArea>
             </div>
             
             <div className="space-y-2">
                <Label htmlFor="tgl_masuk">Tanggal Masuk Kelas</Label>
                <DatePicker
                    date={form.watch("tanggal_masuk") ? new Date(form.watch("tanggal_masuk")!) : undefined}
                    setDate={(date) => form.setValue("tanggal_masuk", date ? format(date, "yyyy-MM-dd") : undefined)}
                    placeholder="Pilih Tanggal Masuk"
                />
             </div>
        </div>

        <DialogFooter>
            <div className="flex justify-between items-center w-full">
                <p className="text-sm font-medium text-muted-foreground">
                    {selectedCount} Peserta terpilih
                </p>
                <Button 
                    onClick={form.handleSubmit(onSubmit)} 
                    disabled={isSubmitting || selectedCount === 0}
                >
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Simpan Anggota"}
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
