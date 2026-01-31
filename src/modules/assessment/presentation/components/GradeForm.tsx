"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Loader2 } from "lucide-react";

import { getTemplatesUsecase } from "@/modules/assessment/application/usecases/getTemplates.usecase"; // Assuming this exists or using repo
import { enrollmentRepository } from "@/modules/enrollment/infrastructure/enrollment.repository";
import { getEmployeesUsecase } from "@/modules/employees/application/usecases/getEmployees.usecase";

import type { CreateGradeInput, CertificateType } from "@/modules/assessment/domain/entities";
import type { CertificateTemplate } from "@/modules/assessment/domain/entities";

const formSchema = z.object({
  enrollment_id: z.coerce.number().min(1, "Pilih siswa"),
  certificate_template_id: z.coerce.number().min(1, "Pilih template"),
  teacher_karyawan_id: z.coerce.number().optional(),
  type: z.enum(["english", "computer"]),
  scores: z.record(z.string(), z.coerce.number().min(0, "Min 0").max(100, "Max 100")),
});

interface GradeFormProps {
  loading?: boolean;
  onSubmit: (data: CreateGradeInput) => void;
}

export function GradeForm({ loading, onSubmit }: GradeFormProps) {
  const [type, setType] = useState<CertificateType>("english");
  const [students, setStudents] = useState<{ value: number; label: string }[]>([]);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [teachers, setTeachers] = useState<{ value: number; label: string }[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "english",
      scores: {
        grammar: "" as any,
        reading: "" as any,
        speaking: "" as any,
        listening: "" as any,
        writing: "" as any,
        word: "" as any,
        excel: "" as any,
        powerpoint: "" as any,
        internet: "" as any,
      },
    },
  });

  // Load Data
  useEffect(() => {
    // 1. Load Enrollments (Ideally paginated, but simple for now)
    enrollmentRepository.getEnrollments({ per_page: 100 }) // Fetching 100 for now
      .then((res) => {
        setStudents(res.data.map(e => ({
            value: e.id,
            label: `${e.murid?.nama_lengkap} (${e.program?.nama || "-"})`
        })));
      });

    // 2. Load Teachers
    getEmployeesUsecase({ per_page: 100, status: "aktif" })
      .then((res) => {
        setTeachers(res.items.map(e => ({
            value: e.id,
            label: e.user?.name || e.kode_karyawan
        })));
      });
  }, []);

  // Filter templates when type changes
  useEffect(() => {
    getTemplatesUsecase({ type, per_page: 100 })
      .then((res) => setTemplates(res.items));
      
    // Reset inputs
    form.setValue("certificate_template_id", 0);
    // form.setValue("scores", {}); // Keep scores if user switches back? Or reset. Reset is safer.
    form.setValue("scores", {});
  }, [type, form]);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit({
      enrollment_id: values.enrollment_id,
      certificate_template_id: values.certificate_template_id,
      teacher_karyawan_id: values.teacher_karyawan_id,
      scores: values.scores,
    });
  };

  const scoreFields = type === "english" 
    ? ["grammar", "reading", "speaking", "listening", "writing"]
    : ["word", "excel", "powerpoint", "internet"];

  // Calculate Avg Preview
  const scores = form.watch("scores");
  const avg = Object.values(scores || {}).reduce((a, b) => a + (Number(b) || 0), 0) / (scoreFields.length || 1);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipe Sertifikat</FormLabel>
                <div className="flex gap-4">
                  <Button 
                    type="button" 
                    variant={field.value === "english" ? "default" : "outline"}
                    onClick={() => {
                        field.onChange("english");
                        setType("english");
                    }}
                  >
                    English
                  </Button>
                  <Button 
                    type="button" 
                    variant={field.value === "computer" ? "default" : "outline"}
                    onClick={() => {
                        field.onChange("computer");
                        setType("computer");
                    }}
                  >
                    Computer
                  </Button>
                </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="enrollment_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Siswa (Enrollment)</FormLabel>
                  <SearchableSelect
                    options={students}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Pilih Siswa..."
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="certificate_template_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template</FormLabel>
                  <Select 
                    onValueChange={(v) => field.onChange(Number(v))} 
                    value={field.value ? String(field.value) : undefined}
                    disabled={templates.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={templates.length === 0 ? "Tidak ada template" : "Pilih Template"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {templates.map(t => (
                        <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        <FormField
            control={form.control}
            name="teacher_karyawan_id"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Teacher / Evaluator (Opsional)</FormLabel>
                <SearchableSelect
                options={teachers}
                value={field.value || ""}
                onValueChange={field.onChange}
                placeholder="Pilih Guru..."
                />
                <FormMessage />
            </FormItem>
            )}
        />

        <div className="space-y-4 border rounded-lg p-4 bg-slate-50">
            <h3 className="font-medium text-sm">Input Nilai ({type})</h3>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {scoreFields.map(key => (
                    <FormField
                        key={key}
                        control={form.control}
                        name={`scores.${key}`}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="capitalize">{key}</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="number" 
                                        min={0} 
                                        max={100} 
                                        {...field} 
                                        value={field.value ?? ""}
                                        onChange={e => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                ))}
            </div>
            
            <div className="flex items-center justify-between border-t pt-2 mt-2">
                <span className="text-sm font-medium text-muted-foreground">Preview Average:</span>
                <span className="text-lg font-bold">{avg.toFixed(2)}</span>
            </div>
        </div>

        <div className="flex justify-end gap-2">
            {form.formState.errors.root && (
                <p className="text-red-500 text-sm">{form.formState.errors.root.message}</p>
            )}
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Simpan Nilai
          </Button>
        </div>
      </form>
    </Form>
  );
}
