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
          // Relaxed query to check if any active enrollments exist
          // Usually we filter by program/jenjang, but for debugging/usability let's see why it's empty
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
        <Button variant="default" className="rounded-xl bg-rose-700 hover:bg-rose-800 shadow-lg shadow-rose-100 px-6 h-9 transition-all active:scale-95 font-bold text-[10px] uppercase tracking-wider">
            <Plus className="mr-2 h-3.5 w-3.5" /> Tambah Anggota
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none rounded-[2rem] shadow-premium ring-1 ring-slate-100">
        <DialogHeader className="pt-8 px-8 text-left">
          <DialogTitle className="text-xl font-bold text-slate-800 tracking-tight">Tambah Anggota Kelas</DialogTitle>
          <DialogDescription className="text-xs font-medium text-slate-400 leading-relaxed mt-1">
            Pilih siswa aktif untuk dimasukkan ke kelas ini. Hanya pendaftaran berstatus Aktif yang dapat ditarik ke dalam kelas.
          </DialogDescription>
        </DialogHeader>

        <div className="px-8 py-6 space-y-6">
             <div className="relative group">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-300 group-focus-within:text-rose-500 transition-colors" />
                <Input
                  placeholder="Cari nama atau kode pendaftaran..."
                  className="pl-10 h-11 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-rose-100 transition-all text-sm outline-none shadow-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
            </div>

             <div className="border border-slate-100 rounded-[1.5rem] bg-slate-50/30 overflow-hidden flex flex-col shadow-inner min-h-[300px] max-h-[400px]">
                 <ScrollArea className="flex-1 p-2">
                     {isLoading ? (
                         <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="animate-spin text-rose-600 size-6" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Memuat data siswa...</p>
                         </div>
                     ) : filteredEnrollments.length === 0 ? (
                         <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                            <div className="size-16 bg-white rounded-[1.5rem] flex items-center justify-center shadow-sm mb-4 ring-8 ring-slate-50/50">
                                <Users className="size-8 text-slate-200" />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tidak ada siswa tersedia</p>
                            <p className="text-[10px] text-slate-300 mt-2 leading-relaxed">
                                {search ? 'Tidak ada hasil untuk kata kunci ini.' : 'Pastikan siswa memiliki pendaftaran berstatus Aktif untuk Program/Level ini.'}
                            </p>
                         </div>
                     ) : (
                         <div className="space-y-1">
                             {filteredEnrollments.map((enr) => {
                                 const isSelected = form.watch("enrollment_ids").includes(enr.id);
                                 return (
                                     <div 
                                        key={enr.id} 
                                        className={`flex items-start gap-4 p-3.5 rounded-2xl transition-all cursor-pointer border ${isSelected ? 'bg-rose-600 border-rose-600 shadow-lg shadow-rose-100' : 'bg-transparent border-transparent hover:bg-white hover:border-slate-100'}`} 
                                        onClick={() => toggleSelection(enr.id)}
                                     >
                                         <div className="pt-0.5">
                                            <Checkbox 
                                                className={`rounded-md border-slate-200 ${isSelected ? 'border-white bg-white text-rose-600 hover:bg-white' : 'data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600'}`}
                                                checked={isSelected}
                                                onCheckedChange={() => toggleSelection(enr.id)}
                                            />
                                         </div>
                                         <div className="flex flex-col gap-0.5 min-w-0">
                                             <span className={`text-sm font-bold truncate tracking-tight ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                                                 {enr.murid?.nama_lengkap || 'Unknown Murid'}
                                             </span>
                                             <div className="flex items-center gap-2">
                                                 <span className={`text-[10px] font-mono font-bold uppercase tracking-tighter ${isSelected ? 'text-rose-200' : 'text-slate-400'}`}>{enr.kode_enrollment}</span>
                                                 <span className={`${isSelected ? 'text-rose-400' : 'text-slate-200'}`}>|</span>
                                                 <span className={`text-[10px] font-bold uppercase truncate tracking-tighter ${isSelected ? 'text-rose-100' : 'text-slate-400'}`}>{enr.paket?.nama || 'Tanpa Paket'}</span>
                                             </div>
                                         </div>
                                     </div>
                                 );
                             })}
                         </div>
                     )}
                 </ScrollArea>
             </div>
             
             <div className="space-y-2 px-1">
                <Label htmlFor="tgl_masuk" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tanggal Masuk Kelas</Label>
                <DatePicker
                    date={form.watch("tanggal_masuk") ? new Date(form.watch("tanggal_masuk")!) : undefined}
                    setDate={(date) => form.setValue("tanggal_masuk", date ? format(date, "yyyy-MM-dd") : undefined)}
                    placeholder="Pilih Tanggal Masuk"
                    className="h-11 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-semibold text-slate-700 text-sm shadow-sm hover:bg-slate-50"
                />
             </div>
        </div>

        <DialogFooter className="py-8 px-8 bg-slate-50/50 border-t border-slate-100">
            <div className="flex justify-between items-center w-full">
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800">{selectedCount} Peserta</span>
                    <span className="text-[10px] font-medium text-slate-400">Terpilih untuk masuk</span>
                </div>
                <Button 
                    className="rounded-xl px-8 h-11 bg-rose-700 hover:bg-rose-800 shadow-xl shadow-rose-100 font-bold text-xs uppercase tracking-widest transition-all scale-100 active:scale-95 disabled:opacity-50 border-none"
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
