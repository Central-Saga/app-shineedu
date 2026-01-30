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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { assignmentRepository } from "@/modules/learning/infrastructure/assignment.repository";
import { materiRepository } from "@/modules/learning/infrastructure/materi.repository";
import { academicApi } from "@/modules/academic/infrastructure/api";
import { sesiApi } from "@/features/sesi/api/sesi.api";
import type { Assignment, MateriModul } from "@/modules/learning/domain/entities";
import type { Kelas } from "@/modules/academic/domain/types";
import type { Sesi } from "@/features/sesi/types";
import { Loader2, Users, Calendar } from "lucide-react";

const formSchema = z.object({
  assignment_mode: z.enum(["single", "bulk"]),
  kelas_id: z.string().optional(),
  sesi_id: z.string().optional(),
  enrollment_ids: z.array(z.number()).min(1, "Pilih minimal 1 murid"),
  materi_modul_id: z.string().optional(),
  title: z.string().min(1, "Judul wajib diisi"),
  instructions: z.string().optional(),
  due_at: z.date().optional(),
});

type FormValues = z.infer<typeof formSchema>;

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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assignment_mode: "bulk",
      kelas_id: "",
      sesi_id: "",
      enrollment_ids: initialData?.enrollment_id ? [initialData.enrollment_id] : [],
      materi_modul_id: initialData?.materi_modul_id ? String(initialData.materi_modul_id) : "",
      title: initialData?.title || "",
      instructions: initialData?.instructions || "",
      due_at: initialData?.due_at ? new Date(initialData.due_at) : undefined,
    },
  });

  const selectedKelasId = form.watch("kelas_id");

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
      try {
        const result = await academicApi.getKelasDetail(Number(selectedKelasId));
        if (result.success && result.data) {
          setKelasEnrollments(result.data.enrollments || []);
        }
      } catch {
        console.error("Failed to load enrollments");
      }
    };
    loadEnrollments();
  }, [selectedKelasId, form]);

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
      const basePayload = {
        materi_modul_id: values.materi_modul_id ? Number(values.materi_modul_id) : undefined,
        title: values.title,
        instructions: values.instructions || undefined,
        due_at: values.due_at?.toISOString(),
        realisasi_jadwal_kerja_id: values.sesi_id ? Number(values.sesi_id) : undefined,
      };

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
    } catch {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Edit Tugas" : "Buat Tugas Baru"}</CardTitle>
        <CardDescription>
          {isEdit
            ? "Perbarui informasi tugas yang sudah ada"
            : "Assign tugas ke murid berdasarkan kelas dan sesi"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {!isEdit && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <FormField
                  control={form.control}
                  name="kelas_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <Calendar className="inline h-4 w-4 mr-2" />
                        Kelas *
                      </FormLabel>
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
                      <FormLabel>
                        <Calendar className="inline h-4 w-4 mr-2" />
                        Sesi (Opsional)
                      </FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!selectedKelasId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih sesi..." />
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
            )}

            {!isEdit && selectedKelasId && (
              <FormField
                control={form.control}
                name="enrollment_ids"
                render={() => (
                  <FormItem>
                    <div className="flex items-center justify-between mb-2">
                      <FormLabel>
                        <Users className="inline h-4 w-4 mr-2" />
                        Pilih Murid *
                      </FormLabel>
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

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Judul Tugas *</FormLabel>
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
                    <FormLabel>Materi Terkait (Opsional)</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih materi" />
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tenggat Waktu (Opsional)</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value}
                        setDate={field.onChange}
                        placeholder="Pilih tanggal"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/assignments")}
              >
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit
                  ? "Simpan Perubahan"
                  : `Buat ${form.watch("enrollment_ids").length} Tugas`}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
