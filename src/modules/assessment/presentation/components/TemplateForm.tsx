"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Loader2 } from "lucide-react";
import type { CreateTemplateInput } from "@/modules/assessment/domain/entities";

const formSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  type: z.enum(["english", "computer"], {
    required_error: "Pilih tipe template",
  }),
  data_mapping: z.string().refine((val) => {
    try {
      JSON.parse(val);
      return true;
    } catch {
      return false;
    }
  }, "Format JSON tidak valid"),
  // Files handled manually via ref or simple validation
  // We'll trust the user picks a file, or add custom validation if needed.
  // Zod doesn't handle FileList well natively without custom refinement.
});

interface TemplateFormProps {
  loading?: boolean;
  onSubmit: (data: CreateTemplateInput) => void;
}

export function TemplateForm({ loading, onSubmit }: TemplateFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "english",
      data_mapping: JSON.stringify(
        {
          cover: {
            student_name: { top: "50%", left: "50%", fontSize: "24pt" },
            date: { top: "80%", left: "10%" },
          },
        },
        null,
        2
      ),
    },
  });

  // Handle files separately
  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    // Get files from input elements
    const coverInput = document.getElementById("cover_image") as HTMLInputElement;
    const resultInput = document.getElementById("result_image") as HTMLInputElement;

    const coverFile = coverInput?.files?.[0];
    const resultFile = resultInput?.files?.[0];

    if (!coverFile) {
      form.setError("root", { message: "Cover image wajib diupload" });
      return;
    }

    onSubmit({
      name: values.name,
      type: values.type,
      data_mapping: values.data_mapping,
      cover_image: coverFile,
      result_image: resultFile,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Template</FormLabel>
                <FormControl>
                  <Input placeholder="Contoh: General English 2026" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipe Program</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tipe" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="computer">Computer</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormItem>
              <FormLabel>Cover Image (Background Page 1)</FormLabel>
              <FormControl>
                <Input id="cover_image" type="file" accept="image/*" />
              </FormControl>
              <FormDescription>Format PNG/JPG, resolusi A4 disarankan.</FormDescription>
            </FormItem>

            <FormItem>
              <FormLabel>Result Image (Background Page 2) (Opsional)</FormLabel>
              <FormControl>
                <Input id="result_image" type="file" accept="image/*" />
              </FormControl>
            </FormItem>
        </div>

        <FormField
          control={form.control}
          name="data_mapping"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data Mapping (JSON)</FormLabel>
              <FormControl>
                <Textarea
                  className="font-mono text-xs min-h-[200px]"
                  placeholder="{...}"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Koordinat posisi text (top, left) untuk nama siswa, tanggal, dll.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
            {form.formState.errors.root && (
                <p className="text-red-500 text-sm">{form.formState.errors.root.message}</p>
            )}
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Simpan Template
          </Button>
        </div>
      </form>
    </Form>
  );
}
