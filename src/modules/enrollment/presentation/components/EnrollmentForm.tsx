"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { createEnrollmentSchema, CreateEnrollmentFormValues, UpdateEnrollmentFormValues, updateEnrollmentSchema } from "@/modules/enrollment/domain/schema";
import { Enrollment } from "@/modules/enrollment/domain/entities";
import { enrollmentRepository } from "@/modules/enrollment/infrastructure/enrollment.repository";
import { listJenjang, listProgram } from "@/modules/catalog/infrastructure/catalog.repository";
import { listMurids } from "@/modules/murid/infrastructure/murid.repository";
import { InlineCreateMurid } from "./InlineCreateMurid";
import { PricePreviewCard } from "./PricePreviewCard";
import { DatePicker } from "@/components/ui/date-picker";
import { format, parse, isValid } from "date-fns";
import { Jenjang, Program, Paket } from "@/modules/catalog/domain/entities";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import { Check, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface EnrollmentFormProps {
  initialData?: Enrollment;
  isEdit?: boolean;
}

export function EnrollmentForm({ initialData, isEdit = false }: EnrollmentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingPrice, setCheckingPrice] = useState(false);
  const [pricePreview, setPricePreview] = useState<number | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);

  // Options State
  const [programs, setPrograms] = useState<Program[]>([]);
  const [jenjangs, setJenjangs] = useState<Jenjang[]>([]);
  const [murids, setMurids] = useState<any[]>([]);
  const [muridSearch, setMuridSearch] = useState("");
  const [debouncedMuridSearch, setDebouncedMuridSearch] = useState(muridSearch);

  // Manual Debounce for Murid Search
  useEffect(() => {
      const handler = setTimeout(() => {
          setDebouncedMuridSearch(muridSearch);
      }, 300);
      return () => clearTimeout(handler);
  }, [muridSearch]);

  const form = useForm<CreateEnrollmentFormValues | UpdateEnrollmentFormValues>({
    resolver: zodResolver(isEdit ? updateEnrollmentSchema : createEnrollmentSchema) as any,
    defaultValues: initialData ? {
       tanggal_mulai: initialData.tanggal_mulai ?? undefined,
       tanggal_selesai: initialData.tanggal_selesai ?? undefined,
       status: initialData.status as any,
       catatan: initialData.catatan ?? "",
       biaya_pendaftaran_amount: initialData.biaya_pendaftaran_amount ?? 0,
       biaya_pendaftaran_status: initialData.biaya_pendaftaran_status ?? "WAIVED",
       biaya_pendaftaran_due_date: initialData.biaya_pendaftaran_due_date ?? undefined,
    } : {
      mode_murid: "existing",
      jumlah_siswa: 1,
      tanggal_mulai: new Date().toISOString().split("T")[0],
    },
  });

  // Form Watchers
  const modeMurid = form.watch("mode_murid" as any);
  const programId = form.watch("program_id" as any);
  const jenjangId = form.watch("jenjang_id" as any);
  const paketId = form.watch("paket_id" as any);
  const jumlahSiswa = form.watch("jumlah_siswa" as any);
  const tanggalMulai = form.watch("tanggal_mulai");

  // Catalog Selection State
  const [filteredPrograms, setFilteredPrograms] = useState<Program[]>([]);
  const [filteredPakets, setFilteredPakets] = useState<Paket[]>([]);

  const selectedPaket = filteredPakets.find(p => String(p.id) === String(paketId));
  const isReguler = selectedPaket?.tipe === 'REGULER';

  // Force jumlah_siswa to 1 if it's a regular package
  useEffect(() => {
    if (isReguler) {
      form.setValue("jumlah_siswa", 1);
    }
  }, [isReguler, form]);

  // Fetch Catalog Options initially
  useEffect(() => {
    const fetchCatalog = async () => {
        try {
             const [pRes, jRes] = await Promise.all([
                 listProgram({ per_page: 100 }),
                 listJenjang({ per_page: 100 })
             ]);
             setPrograms(pRes.items || []);
             setJenjangs(jRes.items || []);
        } catch (e) {
            console.error("Failed to fetch catalog options", e);
            toast.error("Gagal memuat opsi katalog");
        }
    };
    if (!isEdit) fetchCatalog();
  }, [isEdit]);

  // 1. When Jenjang changes: Filter Programs & Reset Dependents
  useEffect(() => {
    if (isEdit) return;
    
    if (jenjangId) {
        const filtered = programs.filter((p: any) => 
            p.jenjangs?.some((j: any) => String(j.id) === String(jenjangId))
        );
        setFilteredPrograms(filtered);

        // If current program is not in the filtered list, reset it
        if (programId && !filtered.some(p => String(p.id) === String(programId))) {
            form.setValue("program_id", undefined as any);
            form.setValue("paket_id", undefined as any);
        }
    } else {
        setFilteredPrograms([]);
        form.setValue("program_id", undefined as any);
        form.setValue("paket_id", undefined as any);
    }
  }, [jenjangId, programs, isEdit, form, programId]);

  // 2. When Program or Jenjang changes: Fetch Available Packages
  useEffect(() => {
    if (isEdit) return;

    const fetchValidPakets = async () => {
        if (programId && jenjangId) {
            try {
                // Using price list to determine valid packages for the selected combination
                const { listPaketHarga } = await import("@/modules/catalog/infrastructure/catalog.repository");
                const res = await listPaketHarga({ 
                    program_id: Number(programId), 
                    jenjang_id: Number(jenjangId),
                    per_page: 100,
                    status: "Aktif"
                });
                
                const uniquePakets: any[] = [];
                const seenIds = new Set();
                
                res.items.forEach(item => {
                    if (item.paket && !seenIds.has(item.paket.id)) {
                        uniquePakets.push(item.paket);
                        seenIds.add(item.paket.id);
                    }
                });

                setFilteredPakets(uniquePakets);
                
                if (paketId && !seenIds.has(Number(paketId))) {
                    form.setValue("paket_id", undefined as any);
                }
            } catch (e) {
                console.error("Failed to fetch valid packages", e);
            }
        } else {
            setFilteredPakets([]);
            form.setValue("paket_id", undefined as any);
        }
    };

    fetchValidPakets();
  }, [programId, jenjangId, isEdit, form, paketId]);

  // Fetch Murids
  useEffect(() => {
      if (isEdit) return;
      const fetchMurids = async () => {
          try {
              const res = await listMurids({ q: debouncedMuridSearch, per_page: 10 });
              setMurids(res.items || []);
          } catch(e) {
              console.error(e);
          }
      };
      // Always fetch initially or when search changes if mode is 'existing'
      if (modeMurid === 'existing') fetchMurids();
  }, [debouncedMuridSearch, isEdit, modeMurid]);


  // Price Preview Logic
  useEffect(() => {
      if (isEdit) return;
      if (programId && jenjangId && paketId && jumlahSiswa && tanggalMulai) {
          setCheckingPrice(true);
          setPriceError(null);
          enrollmentRepository.getEnrollmentPricePreview({
              program_id: Number(programId),
              jenjang_id: Number(jenjangId),
              paket_id: Number(paketId),
              jumlah_siswa: Number(jumlahSiswa),
              tanggal_mulai: String(tanggalMulai)
          })
          .then(res => {
              if (res.data) {
                  setPricePreview(res.data.harga);
              } else {
                  setPricePreview(null);
                  setPriceError("Harga tidak ditemukan untuk kombinasi ini.");
              }
          })
          .catch(err => {
              setPricePreview(null);
              setPriceError("Gagal mengambil info harga.");
          })
          .finally(() => setCheckingPrice(false));
      } else {
          setPricePreview(null);
          setPriceError(null);
      }
  }, [programId, jenjangId, paketId, jumlahSiswa, tanggalMulai, isEdit]);


  const onSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (isEdit) {
        await enrollmentRepository.updateEnrollment(initialData!.id, values);
        toast.success("Enrollment berhasil diperbarui");
      } else {
         if (pricePreview === null && !checkingPrice) {
             toast.error("Harga belum valid. Cek input katalog.");
             setLoading(false);
             return;
         }
         await enrollmentRepository.createEnrollment(values);
         toast.success("Enrollment berhasil dibuat");
      }
      router.push("/dashboard/enrollment");
      router.refresh();
    } catch (error: any) {
      if (error.response?.status === 422) {
         toast.error("Validasi gagal. Cek form.");
      } else {
        toast.error(error.message || "Terjadi kesalahan");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Accordion defaultValue="data-enrollment" className="w-full">
            
            {/* 1. Informasi Murid */}
            {!isEdit && (
              <AccordionItem value="data-murid">
                <AccordionTrigger>Informasi Murid</AccordionTrigger>
                <AccordionContent className="pt-4">
                  <FormField
                    control={form.control}
                    name="mode_murid"
                    render={({ field }) => (
                       <Tabs 
                          value={field.value} 
                          onValueChange={field.onChange} 
                          className="w-full"
                        >
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                          <TabsTrigger value="existing">Pilih Murid Existing</TabsTrigger>
                          <TabsTrigger value="new">Tambah Murid Baru</TabsTrigger>
                        </TabsList>

                        <TabsContent value="existing" className="space-y-4">
                            <FormField
                              control={form.control}
                              name="murid_id"
                              render={({ field }) => (
                                <FormItem className="flex flex-col">
                                  <FormLabel>Cari Murid</FormLabel>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          variant="outline"
                                          role="combobox"
                                          className={cn(
                                            "w-full justify-between",
                                            !field.value && "text-muted-foreground"
                                          )}
                                        >
                                          {field.value
                                            ? murids.find((m) => m.id === field.value)?.nama_lengkap || "Terpilih"
                                            : "Pilih murid..."}
                                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-2" align="start">
                                       <div className="flex items-center border-b px-3 pb-2 mb-2">
                                          <Search className="mr-2 h-4 w-4 opacity-50" />
                                          <input 
                                              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                              placeholder="Ketik nama / kode murid..."
                                              value={muridSearch}
                                              onChange={(e) => setMuridSearch(e.target.value)}
                                          />
                                       </div>
                                       <div className="max-h-[200px] overflow-y-auto space-y-1">
                                           {murids.length === 0 ? (
                                               <div className="py-6 text-center text-sm text-muted-foreground">
                                                   {muridSearch ? "Tidak ditemukan." : "Ketik untuk mencari."}
                                               </div>
                                           ) : (
                                               murids.map((murid) => (
                                                   <div
                                                      key={murid.id}
                                                      className={cn(
                                                          "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                                          murid.id === field.value && "bg-accent"
                                                      )}
                                                      onClick={() => form.setValue("murid_id", murid.id)}
                                                   >
                                                       <Check
                                                        className={cn(
                                                          "mr-2 h-4 w-4",
                                                          murid.id === field.value ? "opacity-100" : "opacity-0"
                                                        )}
                                                      />
                                                       <div className="flex flex-col">
                                                          <span className="font-medium">{murid.nama_lengkap}</span>
                                                          <span className="text-xs text-muted-foreground">
                                                              {murid.kode_murid}
                                                          </span>
                                                      </div>
                                                   </div>
                                               ))
                                           )}
                                       </div>
                                    </PopoverContent>
                                  </Popover>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                        </TabsContent>

                        <TabsContent value="new">
                          <InlineCreateMurid />
                        </TabsContent>
                      </Tabs>
                    )}
                  />
                </AccordionContent>
              </AccordionItem>
            )}

            {/* 2. Produk & Layanan */}
            <AccordionItem value="data-enrollment">
              <AccordionTrigger>Produk & Layanan</AccordionTrigger>
              <AccordionContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {!isEdit ? (
                      <>
                         <FormField
                            control={form.control}
                            name="jenjang_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Jenjang</FormLabel>
                                    <Select 
                                        onValueChange={field.onChange} 
                                        value={field.value ? String(field.value) : undefined}
                                    >
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Pilih Jenjang" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {jenjangs.map(j => (
                                                <SelectItem key={j.id} value={String(j.id)}>{j.nama}</SelectItem>
                                            ))}
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
                                    <FormLabel>Program</FormLabel>
                                    <Select 
                                        onValueChange={field.onChange} 
                                        value={field.value ? String(field.value) : undefined}
                                        disabled={!jenjangId}
                                    >
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder={!jenjangId ? "Pilih jenjang dulu" : "Pilih Program"} /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {filteredPrograms.map(p => (
                                                <SelectItem key={p.id} value={String(p.id)}>{p.nama}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="paket_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Paket</FormLabel>
                                    <Select 
                                        onValueChange={field.onChange} 
                                        value={field.value ? String(field.value) : undefined}
                                        disabled={!programId}
                                    >
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder={!programId ? "Pilih program dulu" : "Pilih Paket"} /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {filteredPakets.map(p => (
                                                <SelectItem key={p.id} value={String(p.id)}>{p.nama}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="jumlah_siswa"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Jumlah Siswa</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="number" 
                                            min={1} 
                                            {...field} 
                                            disabled={isReguler || !paketId}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        {isReguler ? "Paket reguler dibatasi 1 siswa" : "Untuk private/semi-private"}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                      </>
                    ) : (
                      <div className="col-span-2 grid grid-cols-2 gap-4 p-4 border rounded-md bg-muted/50">
                        <div><span className="text-muted-foreground block text-xs">Program</span>{initialData?.program?.nama}</div>
                        <div><span className="text-muted-foreground block text-xs">Jenjang</span>{initialData?.jenjang?.nama}</div>
                        <div><span className="text-muted-foreground block text-xs">Paket</span>{initialData?.paket?.nama}</div>
                        <div><span className="text-muted-foreground block text-xs">Siswa</span>{initialData?.jumlah_siswa}</div>
                      </div>
                    )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 3. Periode & Status */}
             <AccordionItem value="data-periode">
              <AccordionTrigger>Periode & Catatan</AccordionTrigger>
              <AccordionContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="tanggal_mulai"
                        render={({ field }) => (
                            <FormItem className="flex flex-col mt-[7px]">
                                <FormLabel className="mb-[6px]">Tanggal Mulai</FormLabel>
                                <FormControl>
                                    <DatePicker
                                        date={field.value && isValid(parse(field.value, "yyyy-MM-dd", new Date())) ? parse(field.value, "yyyy-MM-dd", new Date()) : null}
                                        setDate={(date) => {
                                            const formatted = date ? format(date, "yyyy-MM-dd") : null;
                                            field.onChange(formatted);
                                        }}
                                        placeholder="Pilih tanggal mulai"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="tanggal_selesai"
                        render={({ field }) => (
                            <FormItem className="flex flex-col mt-[7px]">
                                <FormLabel className="mb-[6px]">Tanggal Selesai</FormLabel>
                                <FormControl>
                                    <DatePicker
                                        date={field.value && isValid(parse(field.value, "yyyy-MM-dd", new Date())) ? parse(field.value, "yyyy-MM-dd", new Date()) : null}
                                        setDate={(date) => {
                                            const formatted = date ? format(date, "yyyy-MM-dd") : null;
                                            field.onChange(formatted);
                                        }}
                                        placeholder="Pilih tanggal selesai"
                                    />
                                </FormControl>
                                <FormDescription>Kosongkan jika aktif berkelanjutan</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {isEdit && (
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status Enrollment</FormLabel>
                                    <Select 
                                        onValueChange={field.onChange} 
                                        value={field.value as string}
                                    >
                                        <FormControl>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Aktif">Aktif</SelectItem>
                                            <SelectItem value="Pause">Pause</SelectItem>
                                            <SelectItem value="Selesai">Selesai</SelectItem>
                                            <SelectItem value="Cancel">Cancel</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    <FormField
                      control={form.control}
                      name="catatan"
                      render={({ field }) => (
                          <FormItem className="col-span-2">
                              <FormLabel>Catatan</FormLabel>
                              <FormControl>
                                  <Textarea placeholder="Catatan tambahan (opsional)" {...field} />
                              </FormControl>
                              <FormMessage />
                          </FormItem>
                      )}
                  />
                  </div>
              </AccordionContent>
            </AccordionItem>

            {/* 4. Rincian Biaya (Show at bottom of form flow) */}
            {!isEdit && (
              <AccordionItem value="data-biaya">
                <AccordionTrigger>Rincian Biaya</AccordionTrigger>
                <AccordionContent className="pt-4">
                   <PricePreviewCard 
                        loading={checkingPrice}
                        price={pricePreview}
                        error={priceError}
                        hasRequiredParams={!!(programId && jenjangId && paketId && jumlahSiswa)}
                    />
                </AccordionContent>
              </AccordionItem>
            )}

             {/* Biaya Pendaftaran Section */}
             <AccordionItem value="data-biaya-pendaftaran">
                <AccordionTrigger>Biaya Pendaftaran</AccordionTrigger>
                <AccordionContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                      <FormField
                          control={form.control}
                          name="biaya_pendaftaran_amount"
                          render={({ field }) => (
                              <FormItem>
                                  <FormLabel>Nominal Biaya Pendaftaran</FormLabel>
                                  <FormControl>
                                      <Input 
                                        type="number" 
                                        min={0} 
                                        {...field}
                                        onChange={e => {
                                          field.onChange(e);
                                          // Auto-set status logic
                                          const val = Number(e.target.value);
                                          if (val > 0) form.setValue("biaya_pendaftaran_status", "UNPAID");
                                          else form.setValue("biaya_pendaftaran_status", "WAIVED");
                                        }}
                                      />
                                  </FormControl>
                                  <FormMessage />
                              </FormItem>
                          )}
                      />

                     <FormField
                        control={form.control}
                        name="biaya_pendaftaran_status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status Pembayaran</FormLabel>
                                <Select 
                                    onValueChange={field.onChange} 
                                    value={field.value}
                                    disabled={Number(form.watch("biaya_pendaftaran_amount")) === 0}
                                >
                                    <FormControl>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="UNPAID">Unpaid</SelectItem>
                                        <SelectItem value="PAID">Paid</SelectItem>
                                        <SelectItem value="WAIVED">Waived</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormDescription>{Number(form.watch("biaya_pendaftaran_amount")) === 0 ? "Otomatis WAIVED jika 0" : ""}</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {Number(form.watch("biaya_pendaftaran_amount")) > 0 && form.watch("biaya_pendaftaran_status") !== 'WAIVED' && (
                        <FormField
                            control={form.control}
                            name="biaya_pendaftaran_due_date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col mt-[7px]">
                                    <FormLabel className="mb-[6px]">Jatuh Tempo</FormLabel>
                                    <FormControl>
                                        <DatePicker
                                            date={field.value && isValid(parse(field.value, "yyyy-MM-dd", new Date())) ? parse(field.value, "yyyy-MM-dd", new Date()) : null}
                                            setDate={(date) => {
                                                const formatted = date ? format(date, "yyyy-MM-dd") : null;
                                                field.onChange(formatted);
                                            }}
                                            placeholder="Pilih tanggal jatuh tempo"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                  </div>
                </AccordionContent>
             </AccordionItem>
          </Accordion>

          <div className="flex items-center gap-3 pt-6">
             <Button type="submit" size="lg" disabled={loading || (!isEdit && !pricePreview)} className="px-8 font-bold text-white">
                {loading ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Simpan Enrollment"}
             </Button>
             <Button 
                type="button" 
                variant="outline" 
                size="lg" 
                onClick={() => router.back()} 
                disabled={loading}
              >
                Batal
              </Button>
          </div>

        </form>
      </Form>
    </div>
  );
}
