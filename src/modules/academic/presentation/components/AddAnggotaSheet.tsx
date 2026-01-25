
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ApiResponse } from "@/shared/domain/types";
import { academicApi } from "@/modules/academic/infrastructure/api";

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
     if (open && programId && jenjangId) {
         fetchEnrollments();
     }
  }, [open, programId, jenjangId]);

  useEffect(() => {
      if (search) {
          const lower = search.toLowerCase();
          setFilteredEnrollments(
              enrollments.filter(e => 
                  e.murid?.nama_lengkap.toLowerCase().includes(lower) || 
                  e.kode_enrollment?.toLowerCase().includes(lower)
              )
          );
      } else {
          setFilteredEnrollments(enrollments);
      }
  }, [search, enrollments]);

  const fetchEnrollments = async () => {
      setIsLoading(true);
      try {
          // Assuming enrollment endpoint supports filtering
          // Or we fetch active enrollments and filter locally if backend not ready
          // Prompt says: "GET /enrollments?status=Aktif&program_id=&jenjang_id=&q=..."
          
          // Using raw fetch directly here assuming api helper might not have this specific flexible query yet
          // Or better, update api.ts. I'll use raw fetch for speed here since it's specific dependency
          
          const params = new URLSearchParams({
              status: 'Aktif',
              program_id: String(programId),
              jenjang_id: String(jenjangId),
              per_page: '100' // Limit reasonable number
          });
          
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/enrollments?${params}`);
          const json = await res.json();
          if (json.success) {
             setEnrollments(json.data || []);
          }
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
          // 422 errors handled by catch usually returns message
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
            <Plus className="mr-2 h-4 w-4" /> Tambah Anggota
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col h-full">
        <SheetHeader>
          <SheetTitle>Tambah Anggota Kelas</SheetTitle>
          <SheetDescription>
            Pilih siswa program yang sama untuk dimasukkan ke kelas ini.
          </SheetDescription>
        </SheetHeader>

        <div className="py-4 space-y-4 flex-1 flex flex-col min-h-0">
             <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                placeholder="Cari nama siswa..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                />
            </div>

             <div className="flex-1 border rounded-md relative overflow-hidden">
                 <ScrollArea className="h-[400px] p-4">
                     {isLoading ? (
                         <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
                     ) : filteredEnrollments.length === 0 ? (
                         <div className="text-center text-muted-foreground py-8">Tidak ada siswa tersedia.</div>
                     ) : (
                         <div className="space-y-2">
                             {filteredEnrollments.map((enr) => (
                                 <div key={enr.id} className="flex items-start space-x-3 p-2 hover:bg-accent rounded-md border border-transparent hover:border-border cursor-pointer" onClick={() => toggleSelection(enr.id)}>
                                     <Checkbox 
                                        checked={form.watch("enrollment_ids").includes(enr.id)}
                                        onCheckedChange={() => toggleSelection(enr.id)}
                                     />
                                     <div className="grid gap-1.5 leading-none">
                                         <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                                             {enr.murid?.nama_lengkap}
                                         </label>
                                         <p className="text-xs text-muted-foreground">
                                             {enr.kode_enrollment} - {enr.paket?.nama}
                                         </p>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     )}
                 </ScrollArea>
             </div>
             
             <div className="grid gap-2">
                <Label htmlFor="tgl_masuk">Tanggal Masuk</Label>
                <Input 
                    type="date" 
                    id="tgl_masuk" 
                    {...form.register("tanggal_masuk")}
                />
             </div>
        </div>

        <SheetFooter className="mt-auto pt-4 border-t">
            <div className="flex justify-between items-center w-full">
                <span className="text-sm text-muted-foreground">{selectedCount} siswa dipilih</span>
                <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting || selectedCount === 0}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Simpan
                </Button>
            </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
