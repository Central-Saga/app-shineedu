"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { assignmentRepository } from "@/modules/learning/infrastructure/assignment.repository";
import { materiRepository } from "@/modules/learning/infrastructure/materi.repository";
import { academicApi } from "@/modules/academic/infrastructure/api";
import { sesiApi } from "@/features/sesi/api/sesi.api";
import { get } from "@/shared/infrastructure/api/httpClient";
import type { Assignment, MateriModul } from "@/modules/learning/domain/entities";
import type { Kelas } from "@/modules/academic/domain/types";
import type { Sesi } from "@/features/sesi/types";
import { Loader2, Upload, Link as LinkIcon } from "lucide-react";

const baseSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi"),
  instructions: z.string().optional(),
  materi_modul_id: z.string().optional(),
  attachment_type: z.enum(["NONE", "FILE", "URL"]).default("NONE"),
  attachment_url: z.string().url("URL tidak valid").optional().or(z.literal("")),
  attachment_file: z.instanceof(File).optional(),
  due_at: z.date().optional(),
});

const createSchema = baseSchema.extend({
  kelas_id: z.string().min(1, "Kelas wajib dipilih"),
  sesi_id: z.string().optional(),
  enrollment_ids: z.array(z.number()).min(1, "Pilih minimal 1 murid"),
});

const editSchema = baseSchema.extend({
  kelas_id: z.string().optional(),
  sesi_id: z.string().optional(),
  enrollment_ids: z.array(z.number()).optional(),
});

type FormValues = z.infer<typeof createSchema>;

interface AssignmentFormProps {
  initialData?: Assignment;
  isEdit?: boolean;
}

export function AssignmentForm({ initialData, isEdit = false }: AssignmentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [sesiList, setSesiList] = useState<Sesi[]>([]);
  const [materiModuls, setMateriModuls] = useState<MateriModul[]>([]);
  const [kelasEnrollments, setKelasEnrollments] = useState<Array<{ id: number; murid?: { nama_lengkap: string }; kode_enrollment: string }>>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const formSchema = isEdit ? editSchema : createSchema;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      kelas_id: "",
      sesi_id: "",
      enrollment_ids: initialData?.enrollment_id ? [initialData.enrollment_id] : [],
      title: initialData?.title || "",
      instructions: initialData?.instructions || "",
      materi_modul_id: initialData?.materi_modul_id ? String(initialData.materi_modul_id) : "",
      attachment_type: initialData?.attachment_type || "NONE",
      attachment_url: initialData?.attachment_url || "",
      due_at: initialData?.due_at ? new Date(initialData.due_at) : undefined,
    },
  });

  const selectedKelasId = form.watch("kelas_id");
  const selectedSesiId = form.watch("sesi_id");
  const attachmentType = form.watch("attachment_type");

  // Load kelas list
  useEffect(() => {
    const loadKelas = async () => {
      try {
        const result = await academicApi.getKelasList({ status: "Aktif", per_page: 100 });
        setKelasList(result.data || []);
      } catch {
        console.error("Failed to load kelas");
      }
    };
    loadKelas();
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (isEdit && initialData) {
      // Set kelas_id from enrollment's kelas
      if (initialData.enrollment?.kelas_id) {
        form.setValue("kelas_id", String(initialData.enrollment.kelas_id));
      }
      // Set sesi_id from realisasi_jadwal_kerja_id
      if (initialData.realisasi_jadwal_kerja_id) {
        form.setValue("sesi_id", String(initialData.realisasi_jadwal_kerja_id));
      }
    }
  }, [isEdit, initialData, form]);

  // Load sesi when kelas is selected
  useEffect(() => {
    if (!selectedKelasId) {
      setSesiList([]);
      return;
    }

    const loadSesi = async () => {
      try {
        const result = await sesiApi.getSesiByKelas(Number(selectedKelasId), {
          per_page: 100,
        });
        setSesiList(result.data || []);
      } catch {
        console.error("Failed to load sesi");
      }
    };
    loadSesi();
  }, [selectedKelasId]);

  // Load enrollments when kelas is selected
  useEffect(() => {
    if (!selectedKelasId) {
      setKelasEnrollments([]);
      form.setValue("enrollment_ids", []);
      return;
    }

    const loadEnrollments = async () => {
      console.log("🔍 Starting to load enrollments for class:", selectedKelasId);
      try {
        // Get class detail
        const kelasResult = await academicApi.getKelasDetail(Number(selectedKelasId));
        console.log("📚 Class data:", kelasResult.data);

        const classEnrollments = kelasResult.data?.enrollments || [];
        console.log("👥 Class enrollments:", classEnrollments);

        const enrollments = classEnrollments.map((e: { id: number; murid?: { nama_lengkap: string }; kode_enrollment: string }) => ({
          id: e.id,
          murid: e.murid,
          kode_enrollment: e.kode_enrollment,
        }));

        console.log(`✨ FINAL: Loaded ${enrollments.length} students:`, enrollments);
        setKelasEnrollments(enrollments);
      } catch (error) {
        console.error("💥 Failed to load enrollments:", error);
        setKelasEnrollments([]);
      }
    };

    loadEnrollments();
  }, [selectedKelasId, form]);

  // Load additional students from session when sesi is selected
  useEffect(() => {
    if (!selectedSesiId || !selectedKelasId) {
      return;
    }

    const loadSessionStudents = async () => {
      console.log("🔍 Loading students from session:", selectedSesiId);
      try {
        const absensiData = await get<any[]>(`sesi/${selectedSesiId}/absensi`);
        console.log("📊 Session attendance data:", absensiData);

        if (absensiData && Array.isArray(absensiData)) {
          const enrollmentMap = new Map(
            kelasEnrollments.map((e) => [e.id, e])
          );

          // Add transfer students from this session
          absensiData.forEach((a: { enrollment_id: number; enrollment?: { murid?: { nama_lengkap: string }; kode_enrollment?: string } }) => {
            if (!enrollmentMap.has(a.enrollment_id) && a.enrollment) {
              console.log("➕ Adding transfer student from session:", a.enrollment);
              enrollmentMap.set(a.enrollment_id, {
                id: a.enrollment_id,
                murid: a.enrollment.murid,
                kode_enrollment: a.enrollment.kode_enrollment || `ENR-${a.enrollment_id}`,
              });
            }
          });

          const updatedEnrollments = Array.from(enrollmentMap.values());
          console.log(`✨ Updated with session students: ${updatedEnrollments.length} total`, updatedEnrollments);
          setKelasEnrollments(updatedEnrollments);
        }
      } catch (error) {
        console.error("💥 Failed to load session students:", error);
      }
    };

    loadSessionStudents();
  }, [selectedSesiId, selectedKelasId]);

  // Load materi moduls
  useEffect(() => {
    const loadMateriModuls = async () => {
      try {
        const result = await materiRepository.getList({ is_active: true, per_page: 100 });
        setMateriModuls(result.data || []);
      } catch {
        console.error("Failed to load materi moduls");
      }
    };
    loadMateriModuls();
  }, []);

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const basePayload: any = {
        materi_modul_id: values.materi_modul_id ? Number(values.materi_modul_id) : undefined,
        title: values.title,
        instructions: values.instructions || undefined,
        attachment_type: values.attachment_type,
        due_at: values.due_at 
          ? `${values.due_at.getFullYear()}-${String(values.due_at.getMonth() + 1).padStart(2, '0')}-${String(values.due_at.getDate()).padStart(2, '0')}`
          : undefined,
        realisasi_jadwal_kerja_id: values.sesi_id ? Number(values.sesi_id) : undefined,
      };

      // Only add attachment_url if type is URL
      if (values.attachment_type === "URL" && values.attachment_url) {
        basePayload.attachment_url = values.attachment_url;
      }

      // Only add attachment_file if type is FILE and file is selected
      if (values.attachment_type === "FILE" && selectedFile) {
        basePayload.attachment_file = selectedFile;
      }

      if (isEdit && initialData) {
        await assignmentRepository.update(initialData.id, basePayload);
        toast.success("Tugas berhasil diperbarui");
      } else {
        // Bulk create assignments
        const promises = values.enrollment_ids.map((enrollmentId) =>
          assignmentRepository.create({
            ...basePayload,
            enrollment_id: enrollmentId,
          })
        );

        await Promise.all(promises);
        toast.success(`Berhasil membuat ${values.enrollment_ids.length} tugas`);
      }
      router.push("/dashboard/assignments");
      router.refresh();
    } catch (error: any) {
      console.error(error);
      toast.error(isEdit ? "Gagal memperbarui tugas" : "Gagal membuat tugas");
    } finally {
      setLoading(false);
    }
  };

  const toggleAllEnrollments = () => {
    const currentIds = form.getValues("enrollment_ids");
    if (currentIds.length === kelasEnrollments.length) {
      form.setValue("enrollment_ids", []);
    } else {
      form.setValue(
        "enrollment_ids",
        kelasEnrollments.map((e) => e.id)
      );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      form.setValue("attachment_file", file);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Accordion defaultValue="informasi-utama" className="w-full">
          
          {/* Informasi Utama */}
          <AccordionItem value="informasi-utama">
            <AccordionTrigger description="Informasi dasar mengenai tugas">
              Informasi Utama
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Judul Tugas <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: PR Matematika Bab 1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instruksi</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Instruksi pengerjaan tugas..."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="materi_modul_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Materi Terkait</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih materi (opsional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {materiModuls.map((m) => (
                              <SelectItem key={m.id} value={String(m.id)}>
                                {m.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>Hubungkan tugas dengan materi pembelajaran</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="due_at"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tenggat Waktu</FormLabel>
                        <FormControl>
                          <DatePicker
                            date={field.value}
                            setDate={field.onChange}
                            placeholder="Pilih tanggal (opsional)"
                            fromDate={new Date()}
                          />
                        </FormControl>
                        <FormDescription>Batas waktu pengumpulan tugas</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Lampiran */}
          <AccordionItem value="lampiran">
            <AccordionTrigger description="Tambahkan file atau link sebagai referensi">
              Lampiran
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="attachment_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipe Lampiran</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="NONE" id="none" />
                            <Label htmlFor="none" className="cursor-pointer">Tidak Ada</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="FILE" id="file" />
                            <Label htmlFor="file" className="cursor-pointer flex items-center gap-1">
                              <Upload className="h-3 w-3" />
                              File
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="URL" id="url" />
                            <Label htmlFor="url" className="cursor-pointer flex items-center gap-1">
                              <LinkIcon className="h-3 w-3" />
                              URL/Link
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {attachmentType === "FILE" && (
                  <FormField
                    control={form.control}
                    name="attachment_file"
                    render={() => (
                      <FormItem>
                        <FormLabel>Upload File</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <Input
                              type="file"
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.zip"
                              onChange={handleFileChange}
                            />
                            {selectedFile && (
                              <p className="text-sm text-muted-foreground">
                                File terpilih: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                              </p>
                            )}
                            {!selectedFile && isEdit && initialData?.attachment_url && (
                              <div className="text-sm text-muted-foreground">
                                <p>File saat ini: <a href={initialData.attachment_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{initialData.attachment_url.split('/').pop()}</a></p>
                                <p className="text-xs mt-1">Upload file baru untuk mengganti</p>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormDescription>
                          Maksimal 50MB. Format: PDF, DOC, XLS, PPT, JPG, PNG, ZIP
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {attachmentType === "URL" && (
                  <FormField
                    control={form.control}
                    name="attachment_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL/Link</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://example.com/materi"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Masukkan link ke Google Drive, YouTube, atau website lainnya
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Penerima Tugas - Only show when creating new assignment */}
          {!isEdit && (
            <AccordionItem value="penerima-tugas">
              <AccordionTrigger description="Pilih kelas dan murid yang akan menerima tugas">
                Penerima Tugas
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="kelas_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kelas <span className="text-red-500">*</span></FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih kelas..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {kelasList.map((k) => (
                                <SelectItem key={k.id} value={String(k.id)}>
                                  {k.nama_kelas} - {k.kode_kelas}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>Pilih kelas terlebih dahulu</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sesi_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sesi</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={!selectedKelasId}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih sesi (opsional)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {sesiList.map((s) => (
                                <SelectItem key={s.id} value={String(s.id)}>
                                  {new Date(s.tanggal).toLocaleDateString("id-ID")} - {s.jam_mulai_plan}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>Link tugas ke sesi tertentu</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {selectedKelasId && (
                    <FormField
                      control={form.control}
                      name="enrollment_ids"
                      render={() => (
                        <FormItem>
                          <div className="flex items-center justify-between mb-2">
                            <FormLabel>Pilih Murid <span className="text-red-500">*</span></FormLabel>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={toggleAllEnrollments}
                            >
                              {form.watch("enrollment_ids").length === kelasEnrollments.length
                                ? "Batalkan Semua"
                                : "Pilih Semua"}
                            </Button>
                          </div>
                          <Card>
                            <CardContent className="pt-4">
                              {kelasEnrollments.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  Tidak ada murid di kelas ini
                                </p>
                              ) : (
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                  {kelasEnrollments.map((enrollment) => (
                                    <FormField
                                      key={enrollment.id}
                                      control={form.control}
                                      name="enrollment_ids"
                                      render={({ field }) => {
                                        return (
                                          <FormItem
                                            key={enrollment.id}
                                            className="flex flex-row items-start space-x-3 space-y-0 p-3 border rounded-lg hover:bg-muted/50"
                                          >
                                            <FormControl>
                                              <Checkbox
                                                checked={field.value?.includes(enrollment.id)}
                                                onCheckedChange={(checked) => {
                                                  return checked
                                                    ? field.onChange([...field.value, enrollment.id])
                                                    : field.onChange(
                                                        field.value?.filter(
                                                          (value) => value !== enrollment.id
                                                        )
                                                      );
                                                }}
                                              />
                                            </FormControl>
                                            <div className="flex-1">
                                              <FormLabel className="text-sm font-medium cursor-pointer">
                                                {enrollment.murid?.nama_lengkap || "Unknown"}
                                              </FormLabel>
                                              <p className="text-xs text-muted-foreground">
                                                {enrollment.kode_enrollment}
                                              </p>
                                            </div>
                                          </FormItem>
                                        );
                                      }}
                                    />
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                          <FormDescription>
                            {form.watch("enrollment_ids").length} murid dipilih
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>

        <div className="flex items-center gap-3 pt-6">
          <Button type="submit" size="lg" disabled={loading} className="px-8">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit
              ? "Simpan Perubahan"
              : `Buat ${form.watch("enrollment_ids").length} Tugas`}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.push("/dashboard/assignments")}
            disabled={loading}
          >
            Batal
          </Button>
        </div>
      </form>
    </Form>
  );
}
