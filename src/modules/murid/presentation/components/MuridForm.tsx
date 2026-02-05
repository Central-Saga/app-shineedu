"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { muridSchema, type MuridFormValues } from "../../domain/schema";
import { useRouter } from "next/navigation";
import { format, parse, isValid } from "date-fns";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface MuridFormProps {
  initialData?: MuridFormValues;
  onSubmit: (values: MuridFormValues) => void;
  isLoading?: boolean;
  jenjangOptions?: { id: number; nama: string }[];
  mode: "create" | "edit";
}

export function MuridForm({ 
  initialData, 
  onSubmit, 
  isLoading = false,
  jenjangOptions = [],
  mode,
}: MuridFormProps) {
  const router = useRouter();
  const form = useForm<MuridFormValues>({
    resolver: zodResolver(muridSchema) as any,
    defaultValues: initialData || {
      nama_lengkap: "",
      kode_murid: null,
      jenis_kelamin: null,
      tanggal_lahir: null,
      no_hp: null,
      email: null,
      alamat: null,
      jenjang_id: null,
      sekolah_asal: null,
      kelas_sekolah: null,
      nama_wali: null,
      no_hp_wali: null,
      email_wali: null,
      hubungan_wali: null,
      catatan_khusus: null,
      kebutuhan_khusus: null,
      status: "Aktif",
    },
  });

  const onFormSubmit = (values: MuridFormValues) => {
    onSubmit(values);
  };

  const generateCode = React.useCallback(() => {
    // Generate Kode Murid: Registration Date (DDMMYY) + 4 Random Digits
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yy = String(now.getFullYear()).slice(-2);
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
    form.setValue("kode_murid", `${dd}${mm}${yy}${random}`);
  }, [form]);

  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
          <Accordion defaultValue="data-pribadi" className="w-full">
            
            {/* Data Pribadi */}
            <AccordionItem value="data-pribadi">
              <AccordionTrigger description="Informasi identitas dasar murid">
                Data Pribadi
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="nama_lengkap"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Lengkap <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Masukkan nama lengkap" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="kode_murid"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kode Murid</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input 
                              placeholder="Otomatis (Tgl Daftar + Unik)" 
                              {...field} 
                              value={field.value || ""} 
                              disabled={isLoading} 
                              readOnly 
                              className="bg-slate-50 font-mono"
                            />
                          </FormControl>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="icon" 
                            onClick={() => generateCode()}
                            disabled={isLoading}
                            title="Generate Ulang Kode"
                          >
                            <RefreshCw className="size-4" />
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 col-span-1 md:col-span-2">
                    <FormField
                      control={form.control}
                      name="no_hp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nomor HP</FormLabel>
                          <FormControl>
                            <Input placeholder="62812..." {...field} value={field.value || ""} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="example@email.com" {...field} value={field.value || ""} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="jenis_kelamin"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Jenis Kelamin</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value || undefined}
                            className="flex gap-6 mt-2"
                            disabled={isLoading}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="L" id="jk-l" />
                              <Label htmlFor="jk-l" className="font-normal cursor-pointer">Laki-laki</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="P" id="jk-p" />
                              <Label htmlFor="jk-p" className="font-normal cursor-pointer">Perempuan</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tanggal_lahir"
                    render={({ field }) => (
                      <FormItem className="flex flex-col mt-[7px]">
                        <FormLabel className="mb-[6px]">Tanggal Lahir</FormLabel>
                        <FormControl>
                          <DatePicker
                            date={field.value && isValid(parse(field.value, "yyyy-MM-dd", new Date())) ? parse(field.value, "yyyy-MM-dd", new Date()) : null}
                            setDate={(date) => {
                              const formatted = date ? format(date, "yyyy-MM-dd") : null;
                              field.onChange(formatted);
                              // Auto-generate code when DOB is set in create mode
                              if (mode === "create" && !form.getValues("kode_murid")) {
                                generateCode();
                              }
                            }}
                            placeholder="Pilih tanggal lahir"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="alamat"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Alamat</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Alamat lengkap" className="min-h-[80px]" {...field} value={field.value || ""} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Akun & Keamanan */}
            <AccordionItem value="akun-keamanan">
              <AccordionTrigger description="Pengaturan akun login aplikasi">
                Akun & Keamanan
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-1 md:col-span-2 p-4 bg-amber-50 rounded-lg text-amber-800 text-sm border border-amber-200 mb-2">
                     Akun login akan dibuatkan otomatis jika Email diisi. Password dapat diisi manual atau digenerate.
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password Akun</FormLabel>
                        <div className="flex gap-2">
                            <FormControl>
                              <Input 
                                type="text" 
                                placeholder={mode === 'edit' ? "Kosongkan jika tidak ingin mengubah password" : "Password untuk login"} 
                                {...field} 
                                value={field.value || ""} 
                                disabled={isLoading} 
                              />
                            </FormControl>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
                                    let password = "";
                                    for (let i = 0; i < 12; i++) {
                                        password += chars.charAt(Math.floor(Math.random() * chars.length));
                                    }
                                    form.setValue("password", password);
                                }}
                                title="Generate Password"
                            >
                                Generate
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => {
                                    if (field.value) {
                                        navigator.clipboard.writeText(field.value);
                                        toast.success("Password disalin ke clipboard!");
                                    }
                                }}
                                disabled={!field.value}
                                title="Copy Password"
                            >
                                Copy
                            </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
            
            {/* Data Akademik */}
            <AccordionItem value="data-akademik">
              <AccordionTrigger description="Informasi jenjang dan sekolah">
                Data Akademik
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="jenjang_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jenjang</FormLabel>
                        <Select 
                          onValueChange={(val) => field.onChange(val ? Number(val) : null)} 
                          value={field.value?.toString() || undefined}
                          disabled={isLoading}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full h-9">
                              <SelectValue placeholder="Pilih Jenjang" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent position="popper">
                            {jenjangOptions.length > 0 ? (
                                jenjangOptions.map((opt) => (
                                <SelectItem key={opt.id} value={opt.id.toString()}>
                                    {opt.nama}
                                </SelectItem>
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

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="sekolah_asal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sekolah Asal</FormLabel>
                          <FormControl>
                            <Input placeholder="Nama sekolah" {...field} value={field.value || ""} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="kelas_sekolah"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kelas di Sekolah</FormLabel>
                          <FormControl>
                            <Input placeholder="Contoh: IX A" {...field} value={field.value || ""} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Data Wali */}
            <AccordionItem value="data-wali">
              <AccordionTrigger description="Informasi kontak darurat dan wali">
                Data Orang Tua / Wali
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nama_wali"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Wali</FormLabel>
                          <FormControl>
                            <Input placeholder="Nama orang tua / wali" {...field} value={field.value || ""} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email_wali"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Wali</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="example@email.com" {...field} value={field.value || ""} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="no_hp_wali"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>No. HP Wali</FormLabel>
                          <FormControl>
                            <Input placeholder="Nomor HP wali" {...field} value={field.value || ""} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="hubungan_wali"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hubungan</FormLabel>
                          <FormControl>
                            <Input placeholder="Contoh: Ayah / Ibu" {...field} value={field.value || ""} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Informasi Tambahan */}
            <AccordionItem value="informasi-tambahan">
              <AccordionTrigger description="Catatan dan kebutuhan khusus lainnya">
                Informasi Tambahan
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="kebutuhan_khusus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kebutuhan Khusus</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Deskripsikan jika ada kebutuhan khusus" {...field} value={field.value || ""} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="catatan_khusus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catatan Khusus</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Catatan tambahan lainnya" {...field} value={field.value || ""} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Status Panel */}
            <AccordionItem value="status-panel">
              <AccordionTrigger description="Pengaturan aktif/nonaktif data murid">
                Status Operasional
              </AccordionTrigger>
              <AccordionContent>
                <div className="max-w-md">
                  {mode === "create" ? (
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 rounded-xl border px-4 py-3 bg-slate-50/50 cursor-not-allowed opacity-70">
                        <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-sm font-medium">Status: Aktif</span>
                      </div>
                      <p className="text-xs text-muted-foreground max-w-xs">
                        Murid baru secara otomatis berstatus <strong>Aktif</strong>. Gunakan halaman edit untuk merubah status di masa mendatang.
                      </p>
                    </div>
                  ) : (
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pilih Status</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value} 
                            disabled={isLoading}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full h-9">
                                <SelectValue placeholder="Pilih status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent position="popper">
                              <SelectItem value="Aktif">Aktif</SelectItem>
                              <SelectItem value="Non Aktif">Non Aktif</SelectItem>
                            </SelectContent>
                          </Select>
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
            <Button type="submit" size="lg" disabled={isLoading} className="px-8 font-bold text-white">
              {isLoading ? "Menyimpan…" : mode === "create" ? "Simpan Data Murid" : "Simpan Perubahan"}
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
