"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { programSchema, type ProgramFormValues } from "../schemas";
import { createProgram, updateProgram } from "@/modules/catalog/infrastructure/catalog.repository";
import type { Program, Jenjang } from "@/modules/catalog/domain/entities";
import { useTransition } from "react";

interface ProgramFormProps {
  initialData?: Program;
  jenjangOptions: Jenjang[];
  mode: "create" | "edit";
}

export function ProgramForm({ initialData, jenjangOptions, mode }: ProgramFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<ProgramFormValues>({
    resolver: zodResolver(programSchema) as any,
    defaultValues: {
      kode: initialData?.kode || "",
      nama: initialData?.nama || "",
      deskripsi: initialData?.deskripsi || "",
      status: (initialData?.status as "Aktif" | "Non Aktif") || "Aktif",
      jenjang_ids: initialData?.jenjangs?.map(j => j.id) || [],
    },
  });

  const onSubmit = (values: ProgramFormValues) => {
    startTransition(async () => {
      try {
        if (mode === "edit" && initialData) {
          await updateProgram(initialData.id, values);
          toast.success("Program berhasil diperbarui");
        } else {
          await createProgram(values);
          toast.success("Program berhasil ditambahkan");
        }
        router.push("/dashboard/catalog/program");
        router.refresh();
      } catch (error: unknown) {
        const err = error as { details?: Record<string, string[]> };
        if (err?.details) {
            Object.keys(err.details).forEach((key) => {
                form.setError(key as any, { message: (err.details as any)[key][0] });
            });
        }
      }
    });
  };

  return (
    <Card className="border-none shadow-premium ring-1 ring-slate-100 rounded-2xl overflow-hidden py-0">
      <CardHeader className="border-b border-slate-50 bg-slate-50/30 pb-4">
        <CardTitle className="text-lg font-bold text-slate-800">
          {mode === "create" ? "Tambah Program Pelajaran" : `Edit Program: ${initialData?.kode}`}
        </CardTitle>
        <CardDescription>
          Konfigurasi program mata pelajaran dan keterkaitannya dengan jenjang pendidikan.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <FormField
                control={form.control}
                name="kode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-tight text-slate-700">Kode Program</FormLabel>
                    <FormControl>
                      <Input placeholder="MATH" {...field} disabled={isPending} className="bg-slate-50/50" />
                    </FormControl>
                    <FormDescription className="text-[10px]">Kode unik referensi program.</FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nama"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-tight text-slate-700">Nama Program</FormLabel>
                    <FormControl>
                      <Input placeholder="Matematika" {...field} disabled={isPending} className="bg-slate-50/50" />
                    </FormControl>
                    <FormDescription className="text-[10px]">Nama lengkap mata pelajaran.</FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              
              <div className="md:col-span-2">
                <FormField
                    control={form.control}
                    name="deskripsi"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-tight text-slate-700">Deskripsi</FormLabel>
                        <FormControl>
                        <Textarea placeholder="Berikan deskripsi singkat mengenai program ini..." {...field} disabled={isPending} className="bg-slate-50/50 min-h-[100px]" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                    )}
                />
              </div>

              <div className="md:col-span-2 space-y-3">
                <Label className="text-xs font-bold uppercase tracking-tight text-slate-700">Akses Jenjang Pendidikan</Label>
                <Card className="bg-slate-50/30 border-slate-100 shadow-none rounded-xl">
                  <CardContent className="p-4">
                    <FormField
                        control={form.control}
                        name="jenjang_ids"
                        render={() => (
                            <FormItem>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {jenjangOptions.map((jenjang) => (
                                        <FormField
                                            key={jenjang.id}
                                            control={form.control}
                                            name="jenjang_ids"
                                            render={({ field }) => {
                                                return (
                                                    <FormItem
                                                        key={jenjang.id}
                                                        className="flex flex-row items-start space-x-3 space-y-0"
                                                    >
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value?.includes(jenjang.id)}
                                                                onCheckedChange={(checked) => {
                                                                    return checked
                                                                        ? field.onChange([...field.value, jenjang.id])
                                                                        : field.onChange(
                                                                            field.value?.filter(
                                                                                (value) => value !== jenjang.id
                                                                            )
                                                                        )
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormLabel className="text-sm font-medium text-slate-600 cursor-pointer">
                                                            {jenjang.nama}
                                                        </FormLabel>
                                                    </FormItem>
                                                )
                                            }}
                                        />
                                    ))}
                                </div>
                                <FormMessage className="text-xs" />
                            </FormItem>
                        )}
                    />
                  </CardContent>
                </Card>
                <p className="text-[10px] text-slate-400">Pilih jenjang yang dapat mengambil program pelajaran ini.</p>
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-tight text-slate-700">Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                      <FormControl>
                        <SelectTrigger className="bg-slate-50/50">
                          <SelectValue placeholder="Pilih status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Aktif">Aktif</SelectItem>
                        <SelectItem value="Non Aktif">Non Aktif</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-50">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.back()}
                    disabled={isPending}
                    className="text-slate-500"
                >
                    Batal
                </Button>
                <Button type="submit" disabled={isPending} className="bg-rose-700 hover:bg-rose-800 shadow-sm shadow-rose-200 rounded-full px-8">
                    {isPending ? "Menyimpan..." : mode === "create" ? "Simpan Program" : "Perbarui Program"}
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
