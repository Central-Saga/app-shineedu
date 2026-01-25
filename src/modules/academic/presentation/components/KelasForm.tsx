"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateKelasValues, createKelasSchema } from "@/modules/academic/domain/schemas";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useRouter } from "next/navigation";

import { Program } from "@/modules/catalog/domain/entities";
import { useEffect, useMemo } from "react";

// Reuse `Option` interface
interface Option {
  id: number;
  nama: string;
}

interface KelasFormProps {
  initialData?: any; // strict type later
  programs: Program[];
  jenjangs: Option[];
  onSubmit: (values: CreateKelasValues) => void;
  isLoading?: boolean;
  isEdit?: boolean;
}

export function KelasForm({ initialData, programs, jenjangs, onSubmit, isLoading, isEdit = false }: KelasFormProps) {
  const router = useRouter();
  const form = useForm<CreateKelasValues>({
    resolver: zodResolver(createKelasSchema) as any,
    defaultValues: {
      nama_kelas: initialData?.nama_kelas || "",
      program_id: initialData?.program_id || undefined,
      jenjang_id: initialData?.jenjang_id || undefined,
      tipe_kelas: initialData?.tipe_kelas || "REGULER",
      mode_private: initialData?.mode_private || null,
      kapasitas: initialData?.kapasitas || null,
      status: initialData?.status || "Aktif",
      periode_mulai: initialData?.periode_mulai || "",
      periode_selesai: initialData?.periode_selesai || "",
      ruangan_default: initialData?.ruangan_default || "",
      catatan: initialData?.catatan || "",
    },
  });

  const tipeKelas = form.watch("tipe_kelas");
  const selectedJenjang = form.watch("jenjang_id");
  const modePrivate = form.watch("mode_private");

  // Auto-set capacity for Private Individu
  useEffect(() => {
     if (tipeKelas === 'PRIVATE' && modePrivate === 'INDIVIDU') {
         form.setValue('kapasitas', 1);
     }
  }, [tipeKelas, modePrivate, form]);

  // Filter programs based on selected jenjang
  const filteredPrograms = useMemo(() => {
    // Debugging logs
// ... (rest of filtering logic)
    console.log("All Programs:", programs);
    console.log("Selected Jenjang:", selectedJenjang);

    if (!selectedJenjang) return []; 
    
    return programs.filter(p => {
        // Ensure jenjangs is an array
        const jenjangs = p.jenjangs || [];
        // Loose comparison to handle potential string/number mismatches
        return jenjangs.some(j => j.id == selectedJenjang);
    });
  }, [selectedJenjang, programs]);

  // Reset program if jenjang changes
  useEffect(() => {
      // Only reset if the currently selected program is not in the new filtered list
      // But actually if Jenjang changes, the old program is likely invalid.
      // So safest is to reset.
      // But avoid resetting on initial load if initialData is present.
      // Simple check: if form value program_id exists but is not in filteredPrograms, reset it.
      const currentProgram = form.getValues("program_id");
      if (currentProgram && filteredPrograms.length > 0) {
          const exists = filteredPrograms.find(p => p.id === currentProgram);
          if (!exists) {
              form.setValue("program_id", undefined as any); // Cast because undefined might not be strictly allowed by some types but usually form reset handles it
          }
      } else if (currentProgram && (!filteredPrograms || filteredPrograms.length === 0) && selectedJenjang) {
          // If jenjang selected but no programs found, clear program
           form.setValue("program_id", undefined as any);
      }
  }, [selectedJenjang, filteredPrograms, form]);


  return (
    <div className="w-full">
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Accordion defaultValue="informasi-utama" className="w-full">
                
                {/* Informasi Utama */}
                <AccordionItem value="informasi-utama">
                    <AccordionTrigger description="Informasi dasar mengenai kelas">
                        Informasi Kelas
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="nama_kelas"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel>Nama Kelas <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input placeholder="Contoh: Coding SD Batch 1" {...field} disabled={isLoading} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
                            {isEdit ? (
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <Select 
                                            onValueChange={field.onChange} 
                                            defaultValue={field.value}
                                            disabled={isLoading}
                                        >
                                            <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih Status" />
                                            </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Draft">Draft</SelectItem>
                                                <SelectItem value="Aktif">Aktif</SelectItem>
                                                <SelectItem value="Selesai">Selesai</SelectItem>
                                                <SelectItem value="Non Aktif">Non Aktif</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            ) : (
                                <div className="flex flex-col gap-2 mt-[6px]">
                                     <FormLabel>Status</FormLabel>
                                     <div className="flex items-center gap-2 rounded-xl border px-4 py-2.5 bg-slate-50/50 cursor-not-allowed opacity-70">
                                        <div className="size-2.5 rounded-full bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20" />
                                        <span className="text-sm font-medium">Status: Aktif</span>
                                    </div>
                                    <p className="text-[0.8rem] text-muted-foreground">
                                        Kelas baru secara otomatis berstatus <strong>Aktif</strong>.
                                    </p>
                                </div>
                            )}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Katalog */}
                <AccordionItem value="katalog">
                    <AccordionTrigger description="Pengaturan Program dan Jenjang">
                        Katalog
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <FormField
                                control={form.control}
                                name="jenjang_id"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Jenjang <span className="text-red-500">*</span></FormLabel>
                                    <Select 
                                        onValueChange={(val) => field.onChange(Number(val))} 
                                        defaultValue={field.value ? String(field.value) : undefined}
                                        disabled={isLoading}
                                    >
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih Jenjang" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {jenjangs.length > 0 ? (
                                                jenjangs.map(j => (
                                                    <SelectItem key={j.id} value={String(j.id)}>{j.nama}</SelectItem>
                                                ))
                                            ) : (
                                                 <div className="p-2 text-sm text-muted-foreground">Tidak ada data jenjang</div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
                            <FormField
                                control={form.control}
                                name="program_id"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Program <span className="text-red-500">*</span></FormLabel>
                                    <Select 
                                        onValueChange={(val) => field.onChange(Number(val))} 
                                        value={field.value ? String(field.value) : undefined}
                                        disabled={isLoading || !selectedJenjang}
                                    >
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={selectedJenjang ? "Pilih Program" : "Pilih Jenjang Terlebih Dahulu"} />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {filteredPrograms.length > 0 ? (
                                                filteredPrograms.map(p => (
                                                    <SelectItem key={p.id} value={String(p.id)}>{p.nama}</SelectItem>
                                                ))
                                            ) : (
                                                <div className="p-2 text-sm text-muted-foreground">
                                                    {selectedJenjang ? "Tidak ada program untuk jenjang ini" : "Pilih jenjang terlebih dahulu"}
                                                </div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </AccordionContent>
                </AccordionItem>
                
                {/* Tipe & Kapasitas */}
                <AccordionItem value="tipe-kapasitas">
                    <AccordionTrigger description="Konfigurasi tipe kelas dan kapasitas siswa">
                        Tipe & Kapasitas
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             <FormField
                                control={form.control}
                                name="tipe_kelas"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Tipe Kelas</FormLabel>
                                    <Select 
                                        onValueChange={field.onChange} 
                                        defaultValue={field.value}
                                        disabled={isLoading}
                                    >
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih Tipe" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="REGULER">Reguler</SelectItem>
                                            <SelectItem value="PRIVATE">Private</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {tipeKelas === 'PRIVATE' && (
                                <FormField
                                    control={form.control}
                                    name="mode_private"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Mode Private</FormLabel>
                                        <Select 
                                            onValueChange={field.onChange} 
                                            defaultValue={field.value || undefined}
                                            disabled={isLoading}
                                        >
                                            <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih Mode" />
                                            </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="INDIVIDU">Individu (1 Siswa)</SelectItem>
                                                <SelectItem value="GROUP">Group (Banyak Siswa)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <FormField
                                control={form.control}
                                name="kapasitas"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Kapasitas (Max Siswa)</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="number" 
                                            placeholder="Contoh: 20" 
                                            {...field} 
                                            value={field.value ?? ''} 
                                            onChange={e => field.onChange(e.target.valueAsNumber)} 
                                            disabled={isLoading || (tipeKelas === 'PRIVATE' && modePrivate === 'INDIVIDU')}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Jadwal & Lokasi */}
                <AccordionItem value="jadwal-lokasi">
                    <AccordionTrigger description="Pengaturan periode dan lokasi kelas">
                        Jadwal & Lokasi
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormField
                                control={form.control}
                                name="periode_mulai"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Periode Mulai</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} value={field.value || ''} disabled={isLoading} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="periode_selesai"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Periode Selesai</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} value={field.value || ''} disabled={isLoading} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="ruangan_default"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Ruangan Default <span className="text-muted-foreground font-normal ml-1">(Opsional)</span></FormLabel>
                                    <FormControl>
                                        <Input placeholder="Contoh: Lab Komputer 1" {...field} value={field.value || ''} disabled={isLoading} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Catatan Tambahan */}
                <AccordionItem value="catatan-tambahan">
                    <AccordionTrigger description="Keterangan tambahan untuk kelas ini">
                        Catatan Tambahan
                    </AccordionTrigger>
                    <AccordionContent>
                         <FormField
                            control={form.control}
                            name="catatan"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Catatan</FormLabel>
                                <FormControl>
                                    <Textarea 
                                        placeholder="Catatan tambahan..." 
                                        {...field} 
                                        value={field.value || ''} 
                                        disabled={isLoading}
                                        className="min-h-[100px]"
                                    />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            <div className="flex items-center gap-3 pt-6">
                 <Button type="submit" size="lg" disabled={isLoading} className="px-8 font-bold text-white">
                    {isLoading ? "Menyimpan..." : "Simpan Kelas"}
                </Button>
                <Button 
                    type="button" 
                    variant="outline" 
                    size="lg" 
                    onClick={() => router.back()} 
                    disabled={isLoading}
                >
                    Batal
                </Button>
            </div>
        </form>
        </Form>
    </div>
  );
}
